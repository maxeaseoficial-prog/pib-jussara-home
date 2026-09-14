import { createContext } from "react";
import type { SiteSettings } from "@/site/site-settings";

export type SiteSettingsContextValue = {
  settings: SiteSettings;
  isUsingFallback: boolean;
  refresh: () => Promise<boolean>;
};

export const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);
