import { supabase } from "@/integrations/supabase/client";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"]?.trim();
const supabasePublishableKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"]?.trim();

function hasValidSupabaseUrl(value: string | undefined) {
  if (!value) return false;

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = Boolean(
  hasValidSupabaseUrl(supabaseUrl) && supabasePublishableKey,
);

export function getSupabase() {
  if (!isSupabaseConfigured) return Promise.resolve(null);
  return Promise.resolve(supabase);
}
