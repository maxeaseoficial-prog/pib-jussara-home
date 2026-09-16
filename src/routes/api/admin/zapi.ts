import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/admin/zapi")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authorizeAdminRequest, registerWhatsappWorkerUrl } = await import(
          "@/admin/admin-api.server"
        );
        const authorization = await authorizeAdminRequest(request);
        if (!authorization.ok) return authorization.response;

        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return Response.json({ error: "Requisição inválida." }, { status: 400 });
        }

        const {
          ZApiConfigurationError,
          configureZApiMessageStatusWebhook,
          getZApiConfigurationStatus,
          getZApiInstanceStatus,
          getZApiQrCode,
          getZApiWebhookSecret,
          saveZApiConfiguration,
          testZApiConfiguration,
        } = await import("@/integrations/zapi/zapi.server");

        if (body.registerWorker === true) {
          const workerUrl = new URL("/api/cron/whatsapp", request.url).toString();
          if (workerUrl.startsWith("https://")) await registerWhatsappWorkerUrl(workerUrl);
        }

        try {
          if (body.action === "saveConfiguration") {
            const instanceId = typeof body.instanceId === "string" ? body.instanceId.trim() : "";
            const instanceToken =
              typeof body.instanceToken === "string" ? body.instanceToken.trim() : "";
            const clientToken = typeof body.clientToken === "string" ? body.clientToken.trim() : "";
            const baseUrl =
              typeof body.baseUrl === "string" && body.baseUrl.trim()
                ? body.baseUrl.trim()
                : "https://api.z-api.io";

            if (!instanceId || !instanceToken || !clientToken) {
              return Response.json(
                { error: "Preencha Instance ID, Instance Token e Client Token." },
                { status: 400 },
              );
            }
            if (!baseUrl.startsWith("https://")) {
              return Response.json({ error: "A URL base precisa usar HTTPS." }, { status: 400 });
            }

            const status = await testZApiConfiguration({
              instanceId,
              instanceToken,
              clientToken,
              baseUrl,
            });

            await saveZApiConfiguration({ instanceId, instanceToken, clientToken, baseUrl });

            // Configure the delivery webhook immediately after saving when possible.
            const secret = await getZApiWebhookSecret();
            if (secret) {
              const callback = new URL("/api/webhooks/zapi/status", request.url);
              callback.searchParams.set("secret", secret);
              await configureZApiMessageStatusWebhook(callback.toString()).catch(() => undefined);
            }

            const configuration = await getZApiConfigurationStatus();
            return Response.json({
              ok: true,
              configured: true,
              instanceIdMasked: configuration.instanceIdMasked,
              ...status,
            });
          }

          const configuration = await getZApiConfigurationStatus();
          if (!configuration.configured) {
            return Response.json({
              configured: false,
              connected: false,
              smartphoneConnected: false,
              error: null,
              missing: configuration.missing,
              instanceIdMasked: null,
            });
          }

          if (body.action === "status") {
            const status = await getZApiInstanceStatus();
            return Response.json({
              configured: true,
              instanceIdMasked: configuration.instanceIdMasked,
              ...status,
            });
          }

          if (body.action === "qr") {
            const qr = await getZApiQrCode();
            return Response.json({ configured: true, value: qr.value });
          }

          if (body.action === "configureWebhook") {
            const secret = await getZApiWebhookSecret();
            if (!secret) {
              return Response.json(
                { error: "Não foi possível gerar a chave segura do webhook." },
                { status: 409 },
              );
            }

            const callback = new URL("/api/webhooks/zapi/status", request.url);
            callback.searchParams.set("secret", secret);
            await configureZApiMessageStatusWebhook(callback.toString());
            return Response.json({ ok: true });
          }

          return Response.json({ error: "Ação não reconhecida." }, { status: 400 });
        } catch (error) {
          if (error instanceof ZApiConfigurationError) {
            return Response.json(
              {
                configured: false,
                connected: false,
                smartphoneConnected: false,
                error: null,
                missing: error.missing,
              },
              { status: 409 },
            );
          }

          console.error(
            "[zapi-admin] Operation failed",
            error instanceof Error ? error.message : "Unknown Z-API admin error",
          );
          return Response.json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Não foi possível concluir a operação com a Z-API.",
            },
            { status: 502 },
          );
        }
      },
    },
  },
});
