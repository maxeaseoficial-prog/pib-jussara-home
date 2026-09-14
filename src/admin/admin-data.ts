import { getSupabase } from "@/lib/supabase";
import type { Database } from "@/integrations/supabase/types";

export type AdminMember = Database["public"]["Functions"]["admin_list_members"]["Returns"][number];
export type SiteSettingsRow = Database["public"]["Tables"]["site_settings"]["Row"];
export type SiteSettingsUpdate = Database["public"]["Tables"]["site_settings"]["Update"];

export const adminQueryKeys = {
  memberCount: ["admin", "member-count"] as const,
  members: (searchQuery: string) => ["admin", "members", searchQuery] as const,
  siteSettings: ["site-settings", "admin"] as const,
};

async function requireClient() {
  const client = await getSupabase();
  if (!client) throw new Error("Supabase unavailable");
  return client;
}

export async function loadAdminMemberCount(signal?: AbortSignal) {
  const client = await requireClient();
  const request = client.rpc("admin_member_count");
  if (signal) request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  return Number(data ?? 0);
}

export async function loadAdminMembers(searchQuery: string, signal?: AbortSignal) {
  const client = await requireClient();
  const request = client.rpc("admin_list_members", {
    search_query: searchQuery.trim() || null,
  });
  if (signal) request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []) as AdminMember[];
}

export async function loadPersistentSiteSettings(signal?: AbortSignal) {
  const client = await requireClient();
  const request = client
    .from("site_settings")
    .select(
      "id, phone, institutional_email, full_address, instagram_url, facebook_url, youtube_url, youtube_live_url, updated_at",
    )
    .eq("id", true);
  if (signal) request.abortSignal(signal);
  const { data, error } = await request.single<SiteSettingsRow>();
  if (error) throw error;
  return data;
}

export async function savePersistentSiteSettings(update: SiteSettingsUpdate) {
  const client = await requireClient();
  const { data, error } = await client
    .from("site_settings")
    .update(update)
    .eq("id", true)
    .select(
      "id, phone, institutional_email, full_address, instagram_url, facebook_url, youtube_url, youtube_live_url, updated_at",
    )
    .single<SiteSettingsRow>();
  if (error) throw error;
  return data;
}
