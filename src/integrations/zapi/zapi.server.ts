import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DEFAULT_BASE_URL = "https://api.z-api.io";
const REQUEST_TIMEOUT_MS = 20_000;

export class ZApiConfigurationError extends Error {
  missing: string[];

  constructor(missing: string[]) {
    super("A integração Z-API ainda não foi configurada.");
    this.name = "ZApiConfigurationError";
    this.missing = missing;
  }
}

export type ZApiConfig = {
  baseUrl: string;
  instanceId: string;
  instanceToken: string;
  clientToken: string;
};

type StoredZApiConfig = Partial<ZApiConfig> & { webhookSecret?: string | null };

function cleanBaseUrl(value: string | undefined | null) {
  const candidate = value?.trim() || DEFAULT_BASE_URL;
  return candidate.replace(/\/+$/, "");
}

function safeErrorText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").slice(0, 400);
}

async function loadVaultConfiguration(): Promise<StoredZApiConfig> {
  const db = supabaseAdmin as any;
  const { data, error } = await db.rpc("service_get_zapi_configuration");
  if (error) {
    // During rolling deploys the migration may not exist yet. Environment variables remain a fallback.
    return {};
  }

  if (!data || typeof data !== "object") return {};
  return {
    instanceId: typeof data.instanceId === "string" ? data.instanceId : undefined,
    instanceToken: typeof data.instanceToken === "string" ? data.instanceToken : undefined,
    clientToken: typeof data.clientToken === "string" ? data.clientToken : undefined,
    baseUrl: typeof data.baseUrl === "string" ? data.baseUrl : undefined,
    webhookSecret: typeof data.webhookSecret === "string" ? data.webhookSecret : null,
  };
}

async function resolveStoredConfiguration() {
  const vault = await loadVaultConfiguration();
  return {
    instanceId: vault.instanceId?.trim() || process.env["ZAPI_INSTANCE_ID"]?.trim() || "",
    instanceToken:
      vault.instanceToken?.trim() || process.env["ZAPI_INSTANCE_TOKEN"]?.trim() || "",
    clientToken: vault.clientToken?.trim() || process.env["ZAPI_CLIENT_TOKEN"]?.trim() || "",
    baseUrl: cleanBaseUrl(vault.baseUrl || process.env["ZAPI_BASE_URL"]),
    webhookSecret:
      vault.webhookSecret?.trim() || process.env["ZAPI_WEBHOOK_SECRET"]?.trim() || null,
    source: vault.instanceId && vault.instanceToken && vault.clientToken ? "vault" : "env",
  } as const;
}

export async function getZApiConfigurationStatus() {
  const config = await resolveStoredConfiguration();
  const missing = [
    !config.instanceId ? "Instance ID" : null,
    !config.instanceToken ? "Instance Token" : null,
    !config.clientToken ? "Client Token" : null,
  ].filter((value): value is string => Boolean(value));

  return {
    configured: missing.length === 0,
    missing,
    instanceIdMasked: config.instanceId
      ? `${config.instanceId.slice(0, 4)}••••${config.instanceId.slice(-4)}`
      : null,
    source: config.source,
  };
}

async function getConfig(): Promise<ZApiConfig> {
  const resolved = await resolveStoredConfiguration();
  const missing = [
    !resolved.instanceId ? "Instance ID" : null,
    !resolved.instanceToken ? "Instance Token" : null,
    !resolved.clientToken ? "Client Token" : null,
  ].filter((value): value is string => Boolean(value));

  if (missing.length) throw new ZApiConfigurationError(missing);

  return {
    baseUrl: resolved.baseUrl,
    instanceId: resolved.instanceId,
    instanceToken: resolved.instanceToken,
    clientToken: resolved.clientToken,
  };
}

async function requestZApiWithConfig<T>(
  config: ZApiConfig,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${cleanBaseUrl(config.baseUrl)}/instances/${encodeURIComponent(config.instanceId)}/token/${encodeURIComponent(config.instanceToken)}${path}`,
      {
        ...init,
        signal: controller.signal,
        headers: {
          "Client-Token": config.clientToken,
          ...(init.body ? { "Content-Type": "application/json" } : {}),
          ...init.headers,
        },
      },
    );

    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }

    if (!response.ok) {
      const upstreamMessage =
        payload && typeof payload === "object" && "message" in payload
          ? safeErrorText((payload as { message?: unknown }).message)
          : "";
      throw new Error(
        upstreamMessage
          ? `A Z-API recusou a operação (${response.status}): ${upstreamMessage}`
          : `A Z-API recusou a operação (${response.status}).`,
      );
    }

    return payload as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("A Z-API demorou demais para responder.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function requestZApi<T>(path: string, init: RequestInit = {}) {
  return requestZApiWithConfig<T>(await getConfig(), path, init);
}

export async function testZApiConfiguration(input: ZApiConfig) {
  const payload = await requestZApiWithConfig<{
    connected?: boolean;
    smartphoneConnected?: boolean;
    error?: string;
  }>(
    {
      baseUrl: cleanBaseUrl(input.baseUrl),
      instanceId: input.instanceId.trim(),
      instanceToken: input.instanceToken.trim(),
      clientToken: input.clientToken.trim(),
    },
    "/status",
    { method: "GET" },
  );

  return {
    connected: payload.connected === true,
    smartphoneConnected: payload.smartphoneConnected === true,
    error: safeErrorText(payload.error) || null,
  };
}

export async function saveZApiConfiguration(input: ZApiConfig) {
  const db = supabaseAdmin as any;
  const { error } = await db.rpc("service_save_zapi_configuration", {
    p_instance_id: input.instanceId.trim(),
    p_instance_token: input.instanceToken.trim(),
    p_client_token: input.clientToken.trim(),
    p_base_url: cleanBaseUrl(input.baseUrl),
  });
  if (error) throw new Error("Não foi possível salvar as credenciais com segurança.");
}

export async function getZApiInstanceStatus() {
  const payload = await requestZApi<{
    connected?: boolean;
    smartphoneConnected?: boolean;
    error?: string;
  }>("/status", { method: "GET" });

  return {
    connected: payload.connected === true,
    smartphoneConnected: payload.smartphoneConnected === true,
    error: safeErrorText(payload.error) || null,
  };
}

export async function getZApiQrCode() {
  const payload = await requestZApi<{ value?: string }>("/qr-code", { method: "GET" });
  const value = typeof payload.value === "string" ? payload.value : null;
  if (!value) throw new Error("A Z-API não retornou um QR Code para esta instância.");
  return { value };
}

export function normalizeWhatsappPhone(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return null;
}

export async function sendZApiText(phone: string, message: string) {
  const normalizedPhone = normalizeWhatsappPhone(phone);
  if (!normalizedPhone) throw new Error("Telefone brasileiro inválido ou incompleto.");

  const payload = await requestZApi<{ zaapId?: string; messageId?: string; id?: string }>(
    "/send-text",
    {
      method: "POST",
      body: JSON.stringify({ phone: normalizedPhone, message, delayMessage: 5 }),
    },
  );

  return {
    phone: normalizedPhone,
    zaapId: typeof payload.zaapId === "string" ? payload.zaapId : null,
    messageId:
      typeof payload.messageId === "string"
        ? payload.messageId
        : typeof payload.id === "string"
          ? payload.id
          : null,
  };
}

export async function configureZApiMessageStatusWebhook(callbackUrl: string) {
  await requestZApi("/update-webhook-message-status", {
    method: "PUT",
    body: JSON.stringify({ value: callbackUrl }),
  });
}

export async function getZApiWebhookSecret() {
  const resolved = await resolveStoredConfiguration();
  return resolved.webhookSecret;
}

export async function timingSafeSecretEquals(provided: string, expected: string) {
  const { createHash, timingSafeEqual } = await import("node:crypto");
  const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();
  return timingSafeEqual(digest(provided), digest(expected));
}
