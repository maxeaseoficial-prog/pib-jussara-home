import { supabaseAdmin } from "@/integrations/supabase/client.server";

type AdminAuthorization =
  | { ok: true; userId: string }
  | { ok: false; response: Response };

function jsonError(status: number, error: string) {
  return Response.json({ error }, { status });
}

export async function authorizeAdminRequest(request: Request): Promise<AdminAuthorization> {
  const match = /^Bearer ([^\s,]+)$/.exec(request.headers.get("authorization") ?? "");
  const token = match?.[1];

  if (!token) {
    return { ok: false, response: jsonError(401, "Sessão administrativa ausente.") };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return { ok: false, response: jsonError(401, "Sua sessão expirou. Entre novamente.") };
  }

  const db = supabaseAdmin as any;
  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[admin-api] Could not verify administrator role", profileError.message);
    return { ok: false, response: jsonError(500, "Não foi possível validar o acesso administrativo.") };
  }

  if (profile?.role !== "admin") {
    return { ok: false, response: jsonError(403, "Acesso administrativo necessário.") };
  }

  return { ok: true, userId: data.user.id };
}

export function bearerTokenFromRequest(request: Request) {
  return /^Bearer ([^\s,]+)$/.exec(request.headers.get("authorization") ?? "")?.[1] ?? null;
}

export async function verifyDatabaseWorkerToken(token: string) {
  const db = supabaseAdmin as any;
  const { data, error } = await db.rpc("verify_whatsapp_worker_token", { p_token: token });
  if (error) {
    console.error("[whatsapp-worker] Could not validate database worker token", error.message);
    return false;
  }
  return data === true;
}

export async function registerWhatsappWorkerUrl(workerUrl: string) {
  const db = supabaseAdmin as any;
  const { error } = await db.rpc("configure_whatsapp_worker_url", { p_url: workerUrl });
  if (error) {
    console.error("[whatsapp-worker] Could not register worker URL", error.message);
  }
}
