import { getSupabase } from "@/lib/supabase";

export type WhatsappCampaign = {
  id: string;
  title: string;
  message: string;
  audience: "all_members";
  schedule_type: "once" | "weekly";
  scheduled_at: string | null;
  weekdays: number[] | null;
  send_time: string | null;
  timezone: string;
  status: "scheduled" | "processing" | "paused" | "completed" | "error";
  next_run_at: string | null;
  processing_started_at: string | null;
  created_by: string;
  last_run_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type WhatsappDelivery = {
  id: string;
  campaign_id: string;
  member_id: string | null;
  member_name: string;
  phone: string;
  scheduled_for: string;
  status: "queued" | "sent" | "received" | "read" | "failed" | "skipped";
  zapi_zaap_id: string | null;
  zapi_message_id: string | null;
  error: string | null;
  sent_at: string | null;
  status_updated_at: string;
  created_at: string;
};

export type ZapiConnectionStatus = {
  configured: boolean;
  connected: boolean;
  smartphoneConnected: boolean;
  error: string | null;
  missing?: string[];
};

export type ZapiQrCode = {
  configured: boolean;
  value: string | null;
};

export const whatsappQueryKeys = {
  campaigns: ["admin", "whatsapp", "campaigns"] as const,
  deliveries: ["admin", "whatsapp", "deliveries"] as const,
  status: ["admin", "whatsapp", "status"] as const,
  scheduledCount: ["admin", "whatsapp", "scheduled-count"] as const,
};

async function requireClient() {
  const client = await getSupabase();
  if (!client) throw new Error("Supabase unavailable");
  // The migration is the source of truth until generated Supabase types are refreshed.
  return client as any;
}

async function getAccessToken() {
  const client = await requireClient();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;

  const token = data.session?.access_token;
  if (!token) throw new Error("Sua sessão expirou. Entre novamente no painel.");
  return token as string;
}

async function adminApi<T>(body: Record<string, unknown>): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch("/api/admin/zapi", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | { error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error || "Não foi possível concluir a operação com o WhatsApp.");
  }

  return payload as T;
}

export async function loadWhatsappCampaigns(signal?: AbortSignal) {
  const client = await requireClient();
  const request = client
    .from("whatsapp_campaigns")
    .select(
      "id,title,message,audience,schedule_type,scheduled_at,weekdays,send_time,timezone,status,next_run_at,processing_started_at,created_by,last_run_at,last_error,created_at,updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (signal) request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []) as WhatsappCampaign[];
}

export async function loadWhatsappDeliveries(signal?: AbortSignal) {
  const client = await requireClient();
  const request = client
    .from("whatsapp_deliveries")
    .select(
      "id,campaign_id,member_id,member_name,phone,scheduled_for,status,zapi_zaap_id,zapi_message_id,error,sent_at,status_updated_at,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (signal) request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []) as WhatsappDelivery[];
}

export async function loadScheduledWhatsappCampaignCount(signal?: AbortSignal) {
  const client = await requireClient();
  const request = client
    .from("whatsapp_campaigns")
    .select("id", { count: "exact", head: true })
    .in("status", ["scheduled", "processing"]);

  if (signal) request.abortSignal(signal);
  const { count, error } = await request;
  if (error) throw error;
  return Number(count ?? 0);
}

export async function createWhatsappCampaign(input: {
  title: string;
  message: string;
  scheduleType: "once" | "weekly";
  scheduledLocal?: string | null;
  weekdays?: number[] | null;
  sendTime?: string | null;
}) {
  const client = await requireClient();
  const { data, error } = await client.rpc("admin_create_whatsapp_campaign", {
    p_title: input.title,
    p_message: input.message,
    p_schedule_type: input.scheduleType,
    p_scheduled_local: input.scheduledLocal || null,
    p_weekdays: input.weekdays?.length ? input.weekdays : null,
    p_send_time: input.sendTime || null,
    p_timezone: "America/Sao_Paulo",
  });

  if (error) throw error;
  return data as WhatsappCampaign;
}

export async function setWhatsappCampaignStatus(
  campaignId: string,
  status: "paused" | "scheduled",
) {
  const client = await requireClient();
  const { data, error } = await client.rpc("admin_set_whatsapp_campaign_status", {
    p_campaign_id: campaignId,
    p_status: status,
  });

  if (error) throw error;
  return data as WhatsappCampaign;
}

export async function deleteWhatsappCampaign(campaignId: string) {
  const client = await requireClient();
  const { error } = await client.from("whatsapp_campaigns").delete().eq("id", campaignId);
  if (error) throw error;
}

export async function loadZapiStatus() {
  return adminApi<ZapiConnectionStatus>({ action: "status", registerWorker: true });
}

export async function loadZapiQrCode() {
  return adminApi<ZapiQrCode>({ action: "qr" });
}

export async function configureZapiStatusWebhook() {
  return adminApi<{ ok: true }>({ action: "configureWebhook" });
}
