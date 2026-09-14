"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSupabase } from "@/lib/supabase";
import {
  fallbackSiteSettings,
  siteSettingsFromRow,
  type SiteSettings,
  type SiteSettingsRow,
} from "@/site/site-settings";
import { SiteSettingsContext } from "@/site/site-settings-context";

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(fallbackSiteSettings);
  const [isUsingFallback, setIsUsingFallback] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const client = await getSupabase();
      if (!client) return false;

      const { data, error } = await client
        .from("site_settings")
        .select(
          "id, phone, institutional_email, full_address, instagram_url, facebook_url, youtube_url, youtube_live_url, updated_at",
        )
        .eq("id", true)
        .maybeSingle<SiteSettingsRow>();

      if (error || !data) return false;
      setSettings(siteSettingsFromRow(data));
      setIsUsingFallback(false);
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ settings, isUsingFallback, refresh }),
    [isUsingFallback, refresh, settings],
  );

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}
