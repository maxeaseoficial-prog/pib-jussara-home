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

        let body: { action?: unknown; registerWorker?: unknown };
        try {
          body = (await request.json()) as typeof body;
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
        } = await import("@/integrations/zapi/zapi.server");

        if (body.registerWorker === true) {
          const workerUrl = new URL("/api/cron/whatsapp", request.url).toString();
          if (workerUrl.startsWith("https://")) {
            await registerWhatsappWorkerUrl(workerUrl);
          }
        }

        const configuration = getZApiConfigurationStatus();
        if (!configuration.configured) {
          return Response.json({
            configured: false,
            connected: false,
            smartphoneConnected: false,
            error: null,
            missing: configuration.missing,
          });
        }

        try {
          if (body.action === "status") {
            const status = await getZApiInstanceStatus();
            return Response.json({ configured: true, ...status });
          }

          if (body.action === "qr") {
            const qr = await getZApiQrCode();
            return Response.json({ configured: true, value: qr.value });
          }

          if (body.action === "configureWebhook") {
            const secret = getZApiWebhookSecret();
            if (!secret) {
              return Response.json(
                { error: "Configure ZAPI_WEBHOOK_SECRET no ambiente do servidor antes de ativar o webhook." },
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
            "[zapi-admin]",
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
