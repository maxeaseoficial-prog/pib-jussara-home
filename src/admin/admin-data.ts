import { getSupabase } from "@/lib/supabase";
import type { Database } from "@/integrations/supabase/types";

export type AdminMember = Database["public"]["Functions"]["admin_list_members"]["Returns"][number];
export type SiteSettingsRow = Database["public"]["Tables"]["site_settings"]["Row"];
export type SiteSettingsUpdate = Database["public"]["Tables"]["site_settings"]["Update"];

async function requireClient() {
  const client = await getSupabase();
  if (!client) throw new Error("Supabase unavailable");
  return client;
}

export async function loadAdminMemberCount() {
  const client = await requireClient();
  const { data, error } = await client.rpc("admin_member_count");
  if (error) throw error;
  return Number(data ?? 0);
}

export async function loadAdminMembers(searchQuery: string) {
  const client = await requireClient();
  const { data, error } = await client.rpc("admin_list_members", {
    search_query: searchQuery.trim() || null,
  });
  if (error) throw error;
  return (data ?? []) as AdminMember[];
}

export async function loadPersistentSiteSettings() {
  const client = await requireClient();
  const { data, error } = await client
    .from("site_settings")
    .select(
      "id, phone, institutional_email, full_address, instagram_url, facebook_url, youtube_url, youtube_live_url, updated_at",
    )
    .eq("id", true)
    .single<SiteSettingsRow>();
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
