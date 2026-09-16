import family from "@/assets/family.jpg";
import interior from "@/assets/interior.jpg";
import worship from "@/assets/worship.jpg";
import youth from "@/assets/youth.jpg";
import type { ChurchService } from "./programming-data";

const fallbackImages: Record<NonNullable<ChurchService["fallback_key"]>, string> = {
  worship,
  interior,
  youth,
  family,
};

export function getServiceImage(service: Pick<ChurchService, "image_url" | "fallback_key">) {
  if (service.image_url) return service.image_url;
  if (service.fallback_key) return fallbackImages[service.fallback_key];
  return worship;
}
