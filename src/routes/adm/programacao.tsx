"use client";

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  ImagePlus,
  LoaderCircle,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { AdminPageHeader } from "@/admin/AdminPageHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getServiceImage } from "@/programming/programming-images";
import {
  createCalendarEvent,
  createChurchService,
  deleteCalendarEvent,
  deleteChurchService,
  loadAdminCalendarEvents,
  loadAdminChurchServices,
  programmingQueryKeys,
  removeProgrammingImage,
  updateCalendarEvent,
  updateChurchService,
  uploadProgrammingImage,
  type CalendarEvent,
  type CalendarEventInput,
  type ChurchService,
  type ChurchServiceInput,
} from "@/programming/programming-data";
import {
  dateString,
  daysInMonth,
  formatEventTime,
  formatServiceRecurrence,
  getSaoPauloTodayString,
  monthLabel,
  parseDateString,
} from "@/programming/schedule";

export const Route = createFileRoute("/adm/programacao")({
  component: AdminProgramming,
});

type Tab = "services" | "calendar";
type SaveServiceArgs = {
  current: ChurchService | null;
  input: ChurchServiceInput;
  file: File | null;
};
type SaveEventArgs = {
  current: CalendarEvent | null;
  input: CalendarEventInput;
  file: File | null;
};

function AdminProgramming() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("services");
  const [serviceDialog, setServiceDialog] = useState<ChurchService | "new" | null>(null);
  const [eventDialog, setEventDialog] = useState<CalendarEvent | "new" | null>(null);
  const [feedback, setFeedback] = useState("");
  const today = getSaoPauloTodayString();
  const [monthValue, setMonthValue] = useState(today.slice(0, 7));
  const [monthYear, monthNumber] = monthValue.split("-").map(Number);
  const year = Number.isFinite(monthYear) ? monthYear : new Date().getFullYear();
  const monthIndex = Number.isFinite(monthNumber) ? monthNumber - 1 : new Date().getMonth();
  const monthStart = dateString(year, monthIndex, 1);
  const monthEnd = dateString(year, monthIndex, daysInMonth(year, monthIndex));

  const services = useQuery({
    queryKey: programmingQueryKeys.adminServices,
    queryFn: ({ signal }) => loadAdminChurchServices(signal),
  });
  const events = useQuery({
    queryKey: programmingQueryKeys.adminEvents(monthStart, monthEnd),
    queryFn: ({ signal }) => loadAdminCalendarEvents(monthStart, monthEnd, signal),
  });

  const saveService = useMutation({
    mutationFn: async ({ current, input, file }: SaveServiceArgs) => {
      let uploaded: { path: string; url: string } | null = null;
      try {
        if (file) uploaded = await uploadProgrammingImage(file, "services");
        const payload: ChurchServiceInput = {
          ...input,
          image_url: uploaded?.url ?? input.image_url,
          image_path: uploaded?.path ?? input.image_path,
        };
        const saved = current
          ? await updateChurchService(current.id, payload)
          : await createChurchService(payload);
        if (uploaded && current?.image_path && current.image_path !== uploaded.path) {
          await removeProgrammingImage(current.image_path).catch(() => undefined);
        }
        return saved;
      } catch (error) {
        if (uploaded) await removeProgrammingImage(uploaded.path).catch(() => undefined);
        throw error;
      }
    },
    onSuccess: async () => {
      setFeedback("Culto fixo salvo com sucesso.");
      setServiceDialog(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: programmingQueryKeys.adminServices }),
        queryClient.invalidateQueries({ queryKey: programmingQueryKeys.publicServices }),
      ]);
    },
  });

  const removeService = useMutation({
    mutationFn: async (service: ChurchService) => {
      await deleteChurchService(service.id);
      if (service.image_path) await removeProgrammingImage(service.image_path).catch(() => undefined);
    },
    onSuccess: async () => {
      setFeedback("Culto fixo excluído.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: programmingQueryKeys.adminServices }),
        queryClient.invalidateQueries({ queryKey: programmingQueryKeys.publicServices }),
      ]);
    },
  });

  const saveEvent = useMutation({
    mutationFn: async ({ current, input, file }: SaveEventArgs) => {
      let uploaded: { path: string; url: string } | null = null;
      try {
        if (file) uploaded = await uploadProgrammingImage(file, "events");
        const payload: CalendarEventInput = {
          ...input,
          image_url: uploaded?.url ?? input.image_url,
          image_path: uploaded?.path ?? input.image_path,
        };
        const saved = current
          ? await updateCalendarEvent(current.id, payload)
          : await createCalendarEvent(payload);
        if (uploaded && current?.image_path && current.image_path !== uploaded.path) {
          await removeProgrammingImage(current.image_path).catch(() => undefined);
        }
        return saved;
      } catch (error) {
        if (uploaded) await removeProgrammingImage(uploaded.path).catch(() => undefined);
        throw error;
      }
    },
    onSuccess: async () => {
      setFeedback("Evento do calendário salvo com sucesso.");
      setEventDialog(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "programming", "events"] });
      await queryClient.invalidateQueries({ queryKey: ["programming", "public-events"] });
    },
  });

  const removeEvent = useMutation({
    mutationFn: async (event: CalendarEvent) => {
      await deleteCalendarEvent(event.id);
      if (event.image_path) await removeProgrammingImage(event.image_path).catch(() => undefined);
    },
    onSuccess: async () => {
      setFeedback("Evento excluído.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "programming", "events"] });
      await queryClient.invalidateQueries({ queryKey: ["programming", "public-events"] });
    },
  });

  const error =
    saveService.error ?? removeService.error ?? saveEvent.error ?? removeEvent.error ?? null;

  return (
    <div>
      <AdminPageHeader
        title="Programação"
        description="Mantenha os cultos fixos e o calendário mensal que aparecem no site da igreja."
      />

      <div className="mt-8 flex flex-wrap gap-2 rounded-2xl border border-border bg-white p-2">
        <TabButton active={tab === "services"} onClick={() => setTab("services")}>
          Cultos fixos
        </TabButton>
        <TabButton active={tab === "calendar"} onClick={() => setTab("calendar")}>
          Calendário mensal
        </TabButton>
      </div>

      {(feedback || error) ? (
        <div className={`mt-5 rounded-xl px-4 py-3 text-sm font-semibold ${error ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`} aria-live="polite">
          {error instanceof Error ? error.message : feedback}
        </div>
      ) : null}

      {tab === "services" ? (
        <section className="mt-6 rounded-2xl border border-border bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Clock3 className="h-5 w-5 text-green-700" aria-hidden="true" />
                <h2 className="text-lg font-extrabold text-green-950">Cultos fixos</h2>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                Estes itens alimentam os cards de “Próximos cultos e eventos” e entram automaticamente no calendário público.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setFeedback(""); setServiceDialog("new"); }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-green-900 px-4 text-sm font-bold text-white hover:bg-green-950"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Novo culto fixo
            </button>
          </div>

          {services.isPending ? (
            <div className="mt-7 h-32 animate-pulse rounded-xl bg-surface-soft" />
          ) : services.isError ? (
            <button type="button" onClick={() => void services.refetch()} className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-green-900">
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </button>
          ) : services.data.length === 0 ? (
            <EmptyState title="Nenhum culto fixo cadastrado" description="Crie a primeira programação recorrente para começar." />
          ) : (
            <div className="mt-7 grid gap-4 lg:grid-cols-2">
              {services.data.map((service) => (
                <article key={service.id} className="overflow-hidden rounded-2xl border border-border bg-white">
                  <div className="grid sm:grid-cols-[9rem_1fr]">
                    <img src={getServiceImage(service)} alt="" className="h-44 w-full object-cover sm:h-full" />
                    <div className="p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-green-800">{service.category}</span>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${service.active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                          {service.active ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                      <h3 className="mt-3 font-extrabold text-green-950">{service.title}</h3>
                      <p className="mt-2 text-xs font-semibold text-text-secondary">{formatServiceRecurrence(service)}</p>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-text-secondary">{service.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" onClick={() => { setFeedback(""); setServiceDialog(service); }} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-bold text-green-900 hover:bg-surface-soft">
                          <Edit3 className="h-3.5 w-3.5" /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Excluir “${service.title}”?`)) removeService.mutate(service);
                          }}
                          disabled={removeService.isPending}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-100 px-3 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="mt-6 rounded-2xl border border-border bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-green-700" aria-hidden="true" />
                <h2 className="text-lg font-extrabold text-green-950">Calendário mensal</h2>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                Cadastre eventos diferentes, avisos e destaques. Os cultos fixos entram no calendário público automaticamente.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input type="month" value={monthValue} onChange={(event) => setMonthValue(event.target.value)} className="h-11 rounded-xl bg-white shadow-none" />
              <button
                type="button"
                onClick={() => { setFeedback(""); setEventDialog("new"); }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-green-900 px-4 text-sm font-bold text-white hover:bg-green-950"
              >
                <Plus className="h-4 w-4" /> Novo evento
              </button>
            </div>
          </div>

          <div className="mt-7 rounded-xl bg-surface-soft px-4 py-3">
            <p className="text-sm font-extrabold text-green-950">{monthLabel(year, monthIndex)}</p>
          </div>

          {events.isPending ? (
            <div className="mt-5 h-32 animate-pulse rounded-xl bg-surface-soft" />
          ) : events.isError ? (
            <button type="button" onClick={() => void events.refetch()} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-green-900">
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </button>
          ) : events.data.length === 0 ? (
            <EmptyState title="Nenhum evento especial neste mês" description="Os cultos fixos continuam aparecendo automaticamente no calendário público." />
          ) : (
            <div className="mt-5 space-y-3">
              {events.data.map((event) => (
                <article key={event.id} className="rounded-2xl border border-border p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <EventTypeBadge event={event} />
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${event.published ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                          {event.published ? "Publicado" : "Rascunho"}
                        </span>
                      </div>
                      <h3 className="mt-3 font-extrabold text-green-950">{event.title}</h3>
                      <p className="mt-2 text-sm font-semibold text-text-secondary">
                        {formatAdminDate(event.event_date)} · {formatEventTime(event.start_time, event.end_time, event.all_day)}
                      </p>
                      {event.location ? (
                        <p className="mt-2 flex items-center gap-2 text-xs text-text-secondary"><MapPin className="h-3.5 w-3.5 text-green-700" />{event.location}</p>
                      ) : null}
                      {event.description ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-text-secondary">{event.description}</p> : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button type="button" onClick={() => { setFeedback(""); setEventDialog(event); }} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-bold text-green-900 hover:bg-surface-soft">
                        <Edit3 className="h-3.5 w-3.5" /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => { if (window.confirm(`Excluir “${event.title}”?`)) removeEvent.mutate(event); }}
                        disabled={removeEvent.isPending}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-100 px-3 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Excluir
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <Dialog open={serviceDialog !== null} onOpenChange={(open) => !open && setServiceDialog(null)}>
        {serviceDialog !== null ? (
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl border-border bg-white">
            <ServiceForm
              current={serviceDialog === "new" ? null : serviceDialog}
              saving={saveService.isPending}
              onCancel={() => setServiceDialog(null)}
              onSubmit={(input, file) => saveService.mutate({ current: serviceDialog === "new" ? null : serviceDialog, input, file })}
            />
          </DialogContent>
        ) : null}
      </Dialog>

      <Dialog open={eventDialog !== null} onOpenChange={(open) => !open && setEventDialog(null)}>
        {eventDialog !== null ? (
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl border-border bg-white">
            <EventForm
              current={eventDialog === "new" ? null : eventDialog}
              defaultDate={`${monthValue}-01`}
              saving={saveEvent.isPending}
              onCancel={() => setEventDialog(null)}
              onSubmit={(input, file) => saveEvent.mutate({ current: eventDialog === "new" ? null : eventDialog, input, file })}
            />
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${active ? "bg-green-900 text-white" : "text-green-900 hover:bg-surface-soft"}`}>
      {children}
    </button>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-7 rounded-2xl bg-surface-soft px-5 py-9 text-center">
      <CalendarDays className="mx-auto h-6 w-6 text-green-700" />
      <p className="mt-3 text-sm font-extrabold text-green-950">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">{description}</p>
    </div>
  );
}

function ServiceForm({ current, saving, onCancel, onSubmit }: { current: ChurchService | null; saving: boolean; onCancel: () => void; onSubmit: (input: ChurchServiceInput, file: File | null) => void }) {
  const [title, setTitle] = useState(current?.title ?? "");
  const [category, setCategory] = useState(current?.category ?? "Culto");
  const [description, setDescription] = useState(current?.description ?? "");
  const [time, setTime] = useState(current?.service_time?.slice(0, 5) ?? "19:00");
  const [recurrence, setRecurrence] = useState<"weekly" | "monthly">(current?.recurrence_type ?? "weekly");
  const [weekday, setWeekday] = useState(String(current?.weekday ?? 0));
  const [dayOfMonth, setDayOfMonth] = useState(String(current?.day_of_month ?? 1));
  const [active, setActive] = useState(current?.active ?? true);
  const [sortOrder, setSortOrder] = useState(String(current?.sort_order ?? 10));
  const [file, setFile] = useState<File | null>(null);

  const valid = title.trim() && category.trim() && description.trim() && time && (recurrence === "weekly" ? weekday !== "" : Number(dayOfMonth) >= 1 && Number(dayOfMonth) <= 31);

  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      if (!valid) return;
      onSubmit({
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        service_time: `${time}:00`,
        recurrence_type: recurrence,
        weekday: recurrence === "weekly" ? Number(weekday) : null,
        day_of_month: recurrence === "monthly" ? Number(dayOfMonth) : null,
        image_url: current?.image_url ?? null,
        image_path: current?.image_path ?? null,
        active,
        sort_order: Number(sortOrder) || 0,
        fallback_key: current?.fallback_key ?? null,
      }, file);
    }}>
      <DialogHeader>
        <DialogTitle className="text-xl font-extrabold text-green-950">{current ? "Editar culto fixo" : "Novo culto fixo"}</DialogTitle>
        <DialogDescription>Defina a programação recorrente exibida nos cards e no calendário do site.</DialogDescription>
      </DialogHeader>

      <div className="mt-5 grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nome"><Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className="h-11 rounded-xl" /></Field>
          <Field label="Categoria"><Input value={category} onChange={(e) => setCategory(e.target.value)} maxLength={60} className="h-11 rounded-xl" /></Field>
        </div>
        <Field label="Descrição"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1200} rows={4} className="rounded-xl" /></Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Horário"><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-11 rounded-xl" /></Field>
          <Field label="Recorrência">
            <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as "weekly" | "monthly")} className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none">
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>
          </Field>
        </div>
        {recurrence === "weekly" ? (
          <Field label="Dia da semana">
            <select value={weekday} onChange={(e) => setWeekday(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none">
              <option value="0">Domingo</option><option value="1">Segunda-feira</option><option value="2">Terça-feira</option><option value="3">Quarta-feira</option><option value="4">Quinta-feira</option><option value="5">Sexta-feira</option><option value="6">Sábado</option>
            </select>
          </Field>
        ) : (
          <Field label="Dia do mês"><Input type="number" min={1} max={31} value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} className="h-11 rounded-xl" /></Field>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Ordem de exibição"><Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="h-11 rounded-xl" /></Field>
          <label className="flex items-center gap-3 self-end rounded-xl border border-border px-4 py-3 text-sm font-bold text-text-primary">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-green-800" /> Ativo no site
          </label>
        </div>
        <Field label="Foto">
          <div className="rounded-xl border border-dashed border-border p-4">
            {current ? <img src={getServiceImage(current)} alt="" className="mb-3 h-28 w-full rounded-lg object-cover" /> : null}
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-green-900">
              <ImagePlus className="h-4 w-4" /> {file ? file.name : "Selecionar imagem"}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            <p className="mt-2 text-xs text-text-secondary">JPG, PNG ou WebP. Máximo de 5 MB.</p>
          </div>
        </Field>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="h-11 rounded-xl border border-border px-4 text-sm font-bold text-green-900">Cancelar</button>
        <button type="submit" disabled={!valid || saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-green-900 px-5 text-sm font-bold text-white disabled:opacity-50">
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Salvar culto
        </button>
      </div>
    </form>
  );
}

function EventForm({ current, defaultDate, saving, onCancel, onSubmit }: { current: CalendarEvent | null; defaultDate: string; saving: boolean; onCancel: () => void; onSubmit: (input: CalendarEventInput, file: File | null) => void }) {
  const [title, setTitle] = useState(current?.title ?? "");
  const [category, setCategory] = useState(current?.category ?? "Evento");
  const [description, setDescription] = useState(current?.description ?? "");
  const [date, setDate] = useState(current?.event_date ?? defaultDate);
  const [allDay, setAllDay] = useState(current?.all_day ?? false);
  const [startTime, setStartTime] = useState(current?.start_time?.slice(0, 5) ?? "19:00");
  const [endTime, setEndTime] = useState(current?.end_time?.slice(0, 5) ?? "");
  const [location, setLocation] = useState(current?.location ?? "");
  const [displayType, setDisplayType] = useState<CalendarEvent["display_type"]>(current?.display_type ?? "normal");
  const [published, setPublished] = useState(current?.published ?? true);
  const [file, setFile] = useState<File | null>(null);

  const valid = title.trim() && category.trim() && date && (allDay || startTime);

  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      if (!valid) return;
      onSubmit({
        title: title.trim(),
        description: description.trim(),
        event_date: date,
        start_time: allDay ? null : `${startTime}:00`,
        end_time: allDay || !endTime ? null : `${endTime}:00`,
        all_day: allDay,
        category: category.trim(),
        location: location.trim() || null,
        image_url: current?.image_url ?? null,
        image_path: current?.image_path ?? null,
        display_type: displayType,
        published,
      }, file);
    }}>
      <DialogHeader>
        <DialogTitle className="text-xl font-extrabold text-green-950">{current ? "Editar evento" : "Novo evento do calendário"}</DialogTitle>
        <DialogDescription>Publique eventos diferentes do mês, avisos ou destaques.</DialogDescription>
      </DialogHeader>

      <div className="mt-5 grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Título"><Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} className="h-11 rounded-xl" /></Field>
          <Field label="Categoria"><Input value={category} onChange={(e) => setCategory(e.target.value)} maxLength={60} className="h-11 rounded-xl" /></Field>
        </div>
        <Field label="Descrição"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={3000} rows={4} className="rounded-xl" /></Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Data"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-xl" /></Field>
          <Field label="Tipo visual">
            <select value={displayType} onChange={(e) => setDisplayType(e.target.value as CalendarEvent["display_type"])} className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none">
              <option value="normal">Normal</option><option value="featured">Destaque</option><option value="notice">Aviso</option>
            </select>
          </Field>
        </div>
        <label className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm font-bold text-text-primary">
          <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="h-4 w-4 accent-green-800" /> Evento de dia inteiro
        </label>
        {!allDay ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Horário inicial"><Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-11 rounded-xl" /></Field>
            <Field label="Horário final (opcional)"><Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-11 rounded-xl" /></Field>
          </div>
        ) : null}
        <Field label="Local (opcional)"><Input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={300} className="h-11 rounded-xl" placeholder="Ex.: Templo principal" /></Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm font-bold text-text-primary">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 accent-green-800" /> Publicado no site
          </label>
          <div className="rounded-xl border border-dashed border-border px-4 py-3">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-green-900">
              <ImagePlus className="h-4 w-4" /> {file ? file.name : current?.image_url ? "Substituir foto" : "Adicionar foto"}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            <p className="mt-1 text-xs text-text-secondary">Opcional · até 5 MB.</p>
          </div>
        </div>
        {current?.image_url ? <img src={current.image_url} alt="" className="h-36 w-full rounded-xl object-cover" /> : null}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="h-11 rounded-xl border border-border px-4 text-sm font-bold text-green-900">Cancelar</button>
        <button type="submit" disabled={!valid || saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-green-900 px-5 text-sm font-bold text-white disabled:opacity-50">
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Salvar evento
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-text-primary">{label}</span>{children}</label>;
}

function EventTypeBadge({ event }: { event: CalendarEvent }) {
  if (event.display_type === "featured") return <span className="inline-flex items-center gap-1 rounded-full bg-green-900 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white"><Sparkles className="h-3 w-3" /> Destaque</span>;
  if (event.display_type === "notice") return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-900">Aviso</span>;
  return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-700">Normal</span>;
}

function formatAdminDate(value: string) {
  const parsed = parseDateString(value);
  if (!parsed) return value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(Date.UTC(parsed.year, parsed.monthIndex, parsed.day, 12)));
}
