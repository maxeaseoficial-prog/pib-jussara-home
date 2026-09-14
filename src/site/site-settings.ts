import type { Database } from "@/integrations/supabase/types";
import { churchConfig } from "@/data/church";

export type SiteSettingsRow = Database["public"]["Tables"]["site_settings"]["Row"];

export type SiteSettings = {
  phone: string;
  institutionalEmail: string;
  fullAddress: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  youtubeLiveUrl: string;
  updatedAt: string | null;
};

export const fallbackSiteSettings: SiteSettings = {
  phone: churchConfig.phone,
  institutionalEmail: churchConfig.email,
  fullAddress: churchConfig.address.full,
  instagramUrl: churchConfig.instagram,
  facebookUrl: churchConfig.facebook,
  youtubeUrl: churchConfig.youtube,
  youtubeLiveUrl: churchConfig.youtubeLiveUrl,
  updatedAt: null,
};

export function siteSettingsFromRow(row: SiteSettingsRow): SiteSettings {
  return {
    phone: row.phone,
    institutionalEmail: row.institutional_email,
    fullAddress: row.full_address,
    instagramUrl: row.instagram_url,
    facebookUrl: row.facebook_url,
    youtubeUrl: row.youtube_url,
    youtubeLiveUrl: row.youtube_live_url,
    updatedAt: row.updated_at,
  };
}

export function youtubeVideoIdFromUrl(value: string) {
  const trimmed = value.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      const watchId = url.searchParams.get("v");
      if (watchId && /^[a-zA-Z0-9_-]{11}$/.test(watchId)) return watchId;

      const [kind, pathId] = url.pathname.split("/").filter(Boolean);
      if (
        ["embed", "shorts", "live"].includes(kind ?? "") &&
        pathId &&
        /^[a-zA-Z0-9_-]{11}$/.test(pathId)
      ) {
        return pathId;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function normalizeYouTubeLiveUrl(value: string) {
  const id = youtubeVideoIdFromUrl(value);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
