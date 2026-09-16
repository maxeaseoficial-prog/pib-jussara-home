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

type ZApiConfig = {
  baseUrl: string;
  instanceId: string;
  instanceToken: string;
  clientToken: string;
};

function cleanBaseUrl(value: string | undefined) {
  const candidate = value?.trim() || DEFAULT_BASE_URL;
  return candidate.replace(/\/+$/, "");
}

export function getZApiConfigurationStatus() {
  const missing = [
    !process.env["ZAPI_INSTANCE_ID"]?.trim() ? "ZAPI_INSTANCE_ID" : null,
    !process.env["ZAPI_INSTANCE_TOKEN"]?.trim() ? "ZAPI_INSTANCE_TOKEN" : null,
    !process.env["ZAPI_CLIENT_TOKEN"]?.trim() ? "ZAPI_CLIENT_TOKEN" : null,
  ].filter((value): value is string => Boolean(value));

  return { configured: missing.length === 0, missing };
}

function getConfig(): ZApiConfig {
  const status = getZApiConfigurationStatus();
  if (!status.configured) throw new ZApiConfigurationError(status.missing);

  return {
    baseUrl: cleanBaseUrl(process.env["ZAPI_BASE_URL"]),
    instanceId: process.env["ZAPI_INSTANCE_ID"]!.trim(),
    instanceToken: process.env["ZAPI_INSTANCE_TOKEN"]!.trim(),
    clientToken: process.env["ZAPI_CLIENT_TOKEN"]!.trim(),
  };
}

function safeErrorText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").slice(0, 400);
}

async function requestZApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const config = getConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${config.baseUrl}/instances/${encodeURIComponent(config.instanceId)}/token/${encodeURIComponent(config.instanceToken)}${path}`,
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
    if (error instanceof ZApiConfigurationError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("A Z-API demorou demais para responder.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
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

  if (!value) {
    throw new Error("A Z-API não retornou um QR Code para esta instância.");
  }

  return { value };
}

export function normalizeWhatsappPhone(raw: string) {
  let digits = raw.replace(/\D/g, "");

  if (digits.startsWith("00")) digits = digits.slice(2);

  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    return digits;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return null;
}

export async function sendZApiText(phone: string, message: string) {
  const normalizedPhone = normalizeWhatsappPhone(phone);
  if (!normalizedPhone) {
    throw new Error("Telefone brasileiro inválido ou incompleto.");
  }

  const payload = await requestZApi<{
    zaapId?: string;
    messageId?: string;
    id?: string;
  }>("/send-text", {
    method: "POST",
    body: JSON.stringify({
      phone: normalizedPhone,
      message,
      delayMessage: 5,
    }),
  });

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

export function getZApiWebhookSecret() {
  return process.env["ZAPI_WEBHOOK_SECRET"]?.trim() || null;
}

export async function timingSafeSecretEquals(provided: string, expected: string) {
  const { createHash, timingSafeEqual } = await import("node:crypto");
  const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();
  return timingSafeEqual(digest(provided), digest(expected));
}
