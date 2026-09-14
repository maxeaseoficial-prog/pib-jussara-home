import { useContext } from "react";
import { SiteSettingsContext } from "@/site/site-settings-context";

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error("useSiteSettings deve ser usado dentro de SiteSettingsProvider.");
  }
  return context;
}
