import { getSupabase } from "@/lib/supabase";

export type ChurchService = {
  id: string;
  title: string;
  category: string;
  description: string;
  service_time: string;
  recurrence_type: "weekly" | "monthly";
  weekday: number | null;
  day_of_month: number | null;
  image_url: string | null;
  image_path: string | null;
  fallback_key: "worship" | "interior" | "youth" | "family" | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  category: string;
  location: string | null;
  image_url: string | null;
  image_path: string | null;
  display_type: "normal" | "featured" | "notice";
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type ChurchServiceInput = Omit<
  ChurchService,
  "id" | "created_at" | "updated_at" | "fallback_key"
> & { fallback_key?: ChurchService["fallback_key"] };

export type CalendarEventInput = Omit<CalendarEvent, "id" | "created_at" | "updated_at">;

export const programmingQueryKeys = {
  publicServices: ["programming", "public-services"] as const,
  publicEvents: (from: string, to: string) => ["programming", "public-events", from, to] as const,
  adminServices: ["admin", "programming", "services"] as const,
  adminEvents: (from: string, to: string) => ["admin", "programming", "events", from, to] as const,
  summary: (from: string, to: string) => ["admin", "programming", "summary", from, to] as const,
};

async function requireClient() {
  const client = await getSupabase();
  if (!client) throw new Error("Supabase unavailable");
  return client as any;
}

const serviceSelect =
  "id,title,category,description,service_time,recurrence_type,weekday,day_of_month,image_url,image_path,fallback_key,active,sort_order,created_at,updated_at";
const eventSelect =
  "id,title,description,event_date,start_time,end_time,all_day,category,location,image_url,image_path,display_type,published,created_at,updated_at";

export async function loadPublicChurchServices(signal?: AbortSignal) {
  const client = await requireClient();
  const request = client
    .from("church_services")
    .select(serviceSelect)
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });
  if (signal) request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []) as ChurchService[];
}

export async function loadPublishedCalendarEvents(from: string, to: string, signal?: AbortSignal) {
  const client = await requireClient();
  const request = client
    .from("church_calendar_events")
    .select(eventSelect)
    .eq("published", true)
    .gte("event_date", from)
    .lte("event_date", to)
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true, nullsFirst: true });
  if (signal) request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []) as CalendarEvent[];
}

export async function loadAdminChurchServices(signal?: AbortSignal) {
  const client = await requireClient();
  const request = client
    .from("church_services")
    .select(serviceSelect)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });
  if (signal) request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []) as ChurchService[];
}

export async function loadAdminCalendarEvents(from: string, to: string, signal?: AbortSignal) {
  const client = await requireClient();
  const request = client
    .from("church_calendar_events")
    .select(eventSelect)
    .gte("event_date", from)
    .lte("event_date", to)
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true, nullsFirst: true });
  if (signal) request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []) as CalendarEvent[];
}

export async function createChurchService(input: ChurchServiceInput) {
  const client = await requireClient();
  const { data, error } = await client
    .from("church_services")
    .insert(input)
    .select(serviceSelect)
    .single();
  if (error) throw error;
  return data as ChurchService;
}

export async function updateChurchService(id: string, input: Partial<ChurchServiceInput>) {
  const client = await requireClient();
  const { data, error } = await client
    .from("church_services")
    .update(input)
    .eq("id", id)
    .select(serviceSelect)
    .single();
  if (error) throw error;
  return data as ChurchService;
}

export async function deleteChurchService(id: string) {
  const client = await requireClient();
  const { error } = await client.from("church_services").delete().eq("id", id);
  if (error) throw error;
}

export async function createCalendarEvent(input: CalendarEventInput) {
  const client = await requireClient();
  const { data, error } = await client
    .from("church_calendar_events")
    .insert(input)
    .select(eventSelect)
    .single();
  if (error) throw error;
  return data as CalendarEvent;
}

export async function updateCalendarEvent(id: string, input: Partial<CalendarEventInput>) {
  const client = await requireClient();
  const { data, error } = await client
    .from("church_calendar_events")
    .update(input)
    .eq("id", id)
    .select(eventSelect)
    .single();
  if (error) throw error;
  return data as CalendarEvent;
}

export async function deleteCalendarEvent(id: string) {
  const client = await requireClient();
  const { error } = await client.from("church_calendar_events").delete().eq("id", id);
  if (error) throw error;
}

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 5 * 1024 * 1024;

export async function uploadProgrammingImage(file: File, folder: "services" | "events") {
  if (!allowedImageTypes.has(file.type)) {
    throw new Error("Envie uma imagem JPG, PNG ou WebP.");
  }
  if (file.size > maxImageBytes) {
    throw new Error("A imagem deve ter no máximo 5 MB.");
  }

  const client = await requireClient();
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const randomPart = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${folder}/${Date.now()}-${randomPart}.${extension}`;

  const { error } = await client.storage.from("church-programming").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;

  const { data } = client.storage.from("church-programming").getPublicUrl(path);
  return { path, url: data.publicUrl as string };
}

export async function removeProgrammingImage(path: string | null | undefined) {
  if (!path) return;
  const client = await requireClient();
  const { error } = await client.storage.from("church-programming").remove([path]);
  if (error) throw error;
}

export async function loadProgrammingSummary(from: string, to: string) {
  const client = await requireClient();
  const [services, events] = await Promise.all([
    client.from("church_services").select("id", { count: "exact", head: true }).eq("active", true),
    client
      .from("church_calendar_events")
      .select("id", { count: "exact", head: true })
      .eq("published", true)
      .gte("event_date", from)
      .lte("event_date", to),
  ]);

  if (services.error) throw services.error;
  if (events.error) throw events.error;
  return {
    activeServices: Number(services.count ?? 0),
    publishedEvents: Number(events.count ?? 0),
  };
}
