import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/cron/whatsapp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const {
          bearerTokenFromRequest,
          verifyDatabaseWorkerToken,
        } = await import("@/admin/admin-api.server");
        const token = bearerTokenFromRequest(request);
        let authorized = false;

        if (token && process.env["LOVABLE_CRON_SECRET"]) {
          const { authenticateCronRequest } = await import("@/integrations/supabase/cron-auth");
          authorized = (await authenticateCronRequest(request)) === null;
        }

        if (!authorized && token) {
          authorized = await verifyDatabaseWorkerToken(token);
        }

        if (!authorized) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const {
          getZApiConfigurationStatus,
          normalizeWhatsappPhone,
          sendZApiText,
        } = await import("@/integrations/zapi/zapi.server");
        const db = supabaseAdmin as any;

        const configuration = getZApiConfigurationStatus();
        const { data: campaigns, error: claimError } = await db.rpc(
          "claim_due_whatsapp_campaigns",
          { p_limit: 2 },
        );

        if (claimError) {
          console.error("[whatsapp-worker] Claim failed", claimError.message);
          return Response.json({ error: "Não foi possível buscar campanhas." }, { status: 500 });
        }

        const summaries: Array<Record<string, unknown>> = [];

        for (const campaign of campaigns ?? []) {
          if (!configuration.configured) {
            const message = "Credenciais Z-API não configuradas no servidor.";
            await db.rpc("fail_whatsapp_campaign_run", {
              p_campaign_id: campaign.id,
              p_error: message,
            });
            summaries.push({ campaignId: campaign.id, status: "error", error: message });
            continue;
          }

          const scheduledFor = campaign.next_run_at;
          if (!scheduledFor) {
            await db.rpc("fail_whatsapp_campaign_run", {
              p_campaign_id: campaign.id,
              p_error: "Campanha sem próxima execução definida.",
            });
            summaries.push({ campaignId: campaign.id, status: "error" });
            continue;
          }

          const { data: members, error: membersError } = await db
            .from("profiles")
            .select("id,full_name,phone")
            .order("created_at", { ascending: true });

          if (membersError) {
            await db.rpc("fail_whatsapp_campaign_run", {
              p_campaign_id: campaign.id,
              p_error: "Não foi possível carregar os membros.",
            });
            summaries.push({ campaignId: campaign.id, status: "error" });
            continue;
          }

          let sent = 0;
          let failed = 0;
          let skipped = 0;

          for (const member of members ?? []) {
            const normalizedPhone = normalizeWhatsappPhone(member.phone ?? "");
            const existing = await db
              .from("whatsapp_deliveries")
              .select("id,status")
              .eq("campaign_id", campaign.id)
              .eq("member_id", member.id)
              .eq("scheduled_for", scheduledFor)
              .maybeSingle();

            if (existing.error) {
              console.error("[whatsapp-worker] Delivery lookup failed", existing.error.message);
              failed += 1;
              continue;
            }

            if (existing.data && existing.data.status !== "queued") {
              continue;
            }

            let deliveryId = existing.data?.id as string | undefined;

            if (!deliveryId) {
              const inserted = await db
                .from("whatsapp_deliveries")
                .insert({
                  campaign_id: campaign.id,
                  member_id: member.id,
                  member_name: member.full_name,
                  phone: normalizedPhone ?? String(member.phone ?? "").replace(/\D/g, ""),
                  scheduled_for: scheduledFor,
                  status: normalizedPhone ? "queued" : "skipped",
                  error: normalizedPhone ? null : "Telefone inválido ou incompleto.",
                })
                .select("id")
                .single();

              if (inserted.error) {
                if (inserted.error.code === "23505") continue;
                console.error("[whatsapp-worker] Delivery insert failed", inserted.error.message);
                failed += 1;
                continue;
              }

              deliveryId = inserted.data.id;

              if (!normalizedPhone) {
                skipped += 1;
                continue;
              }
            }

            if (!normalizedPhone) {
              skipped += 1;
              continue;
            }

            try {
              const result = await sendZApiText(normalizedPhone, campaign.message);
              const updated = await db
                .from("whatsapp_deliveries")
                .update({
                  status: "sent",
                  phone: result.phone,
                  zapi_zaap_id: result.zaapId,
                  zapi_message_id: result.messageId,
                  error: null,
                  sent_at: new Date().toISOString(),
                  status_updated_at: new Date().toISOString(),
                })
                .eq("id", deliveryId);

              if (updated.error) {
                console.error("[whatsapp-worker] Delivery update failed", updated.error.message);
                failed += 1;
              } else {
                sent += 1;
              }
            } catch (error) {
              failed += 1;
              const message =
                error instanceof Error ? error.message.slice(0, 700) : "Falha ao enviar mensagem.";
              await db
                .from("whatsapp_deliveries")
                .update({
                  status: "failed",
                  error: message,
                  status_updated_at: new Date().toISOString(),
                })
                .eq("id", deliveryId);
            }
          }

          const summaryError =
            failed > 0 ? `${failed} envio(s) falharam; ${skipped} foram pulados.` : null;

          const completed = await db.rpc("complete_whatsapp_campaign_run", {
            p_campaign_id: campaign.id,
            p_error: summaryError,
          });

          if (completed.error) {
            console.error("[whatsapp-worker] Campaign completion failed", completed.error.message);
          }

          summaries.push({
            campaignId: campaign.id,
            status: "processed",
            sent,
            failed,
            skipped,
          });
        }

        return Response.json({ ok: true, processed: summaries.length, campaigns: summaries });
      },
    },
  },
});
