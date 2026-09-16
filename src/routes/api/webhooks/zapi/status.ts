import { createFileRoute } from "@tanstack/react-router";

function collectIds(payload: Record<string, unknown>) {
  const values: string[] = [];
  const candidates = [payload["id"], payload["messageId"], payload["zaapId"]];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) values.push(candidate.trim());
  }

  if (Array.isArray(payload["ids"])) {
    for (const item of payload["ids"]) {
      if (typeof item === "string" && item.trim()) values.push(item.trim());
    }
  }

  return Array.from(new Set(values)).slice(0, 50);
}

function mapStatus(value: unknown) {
  const status = typeof value === "string" ? value.toUpperCase() : "";
  if (status === "READ" || status === "PLAYED") return "read";
  if (status === "RECEIVED" || status === "DELIVERED") return "received";
  if (status === "SENT" || status === "SERVER_ACK") return "sent";
  if (
    status === "ERROR" ||
    status === "FAILED" ||
    status === "FAILURE" ||
    status === "CANCELED" ||
    status === "CANCELLED"
  ) {
    return "failed";
  }
  return null;
}

export const Route = createFileRoute("/api/webhooks/zapi/status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { getZApiWebhookSecret, timingSafeSecretEquals } = await import(
          "@/integrations/zapi/zapi.server"
        );
        const expected = getZApiWebhookSecret();
        const provided = new URL(request.url).searchParams.get("secret") ?? "";

        if (!expected || !provided || !(await timingSafeSecretEquals(provided, expected))) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        let payload: Record<string, unknown>;
        try {
          payload = (await request.json()) as Record<string, unknown>;
        } catch {
          return Response.json({ error: "Invalid payload" }, { status: 400 });
        }

        const deliveryStatus = mapStatus(payload["status"]);
        const ids = collectIds(payload);

        if (!deliveryStatus || ids.length === 0) {
          return Response.json({ ok: true, updated: 0 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const db = supabaseAdmin as any;
        const now = new Date().toISOString();
        const errorText =
          deliveryStatus === "failed" && typeof payload["error"] === "string"
            ? payload["error"].slice(0, 700)
            : null;

        const update = {
          status: deliveryStatus,
          status_updated_at: now,
          ...(errorText ? { error: errorText } : {}),
        };

        const [byMessageId, byZaapId] = await Promise.all([
          db.from("whatsapp_deliveries").update(update).in("zapi_message_id", ids).select("id"),
          db.from("whatsapp_deliveries").update(update).in("zapi_zaap_id", ids).select("id"),
        ]);

        if (byMessageId.error || byZaapId.error) {
          console.error(
            "[zapi-webhook] Delivery update failed",
            byMessageId.error?.message ?? byZaapId.error?.message,
          );
          return Response.json({ error: "Could not update delivery status" }, { status: 500 });
        }

        const updatedIds = new Set<string>();
        for (const row of [...(byMessageId.data ?? []), ...(byZaapId.data ?? [])]) {
          if (row?.id) updatedIds.add(row.id);
        }

        return Response.json({ ok: true, updated: updatedIds.size });
      },
    },
  },
});
