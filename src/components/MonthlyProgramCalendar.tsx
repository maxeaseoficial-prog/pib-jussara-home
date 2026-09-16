"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getServiceImage } from "@/programming/programming-images";
import {
  loadPublishedCalendarEvents,
  programmingQueryKeys,
  type CalendarEvent,
  type ChurchService,
} from "@/programming/programming-data";
import {
  dateString,
  daysInMonth,
  formatEventTime,
  formatOccurrenceBadge,
  formatServiceTime,
  getSaoPauloTodayString,
  monthLabel,
  parseDateString,
  serviceOccurrencesInMonth,
  weekdayShortLabel,
} from "@/programming/schedule";

export function MonthlyProgramCalendar({ services }: { services: ChurchService[] }) {
  const initial = parseDateString(getSaoPauloTodayString()) ?? {
    year: new Date().getFullYear(),
    monthIndex: new Date().getMonth(),
    day: 1,
  };
  const [cursor, setCursor] = useState({ year: initial.year, monthIndex: initial.monthIndex });
  const [selected, setSelected] = useState<CalendarItem | null>(null);

  const firstDate = dateString(cursor.year, cursor.monthIndex, 1);
  const lastDate = dateString(
    cursor.year,
    cursor.monthIndex,
    daysInMonth(cursor.year, cursor.monthIndex),
  );

  const events = useQuery({
    queryKey: programmingQueryKeys.publicEvents(firstDate, lastDate),
    queryFn: ({ signal }) => loadPublishedCalendarEvents(firstDate, lastDate, signal),
  });

  const items = useMemo(() => {
    const output: CalendarItem[] = [];

    for (const service of services) {
      for (const occurrence of serviceOccurrencesInMonth(service, cursor.year, cursor.monthIndex)) {
        output.push({
          id: `service-${service.id}-${occurrence}`,
          source: "service",
          date: occurrence,
          title: service.title,
          category: service.category,
          description: service.description,
          timeLabel: formatServiceTime(service.service_time),
          location: null,
          imageUrl: getServiceImage(service),
          displayType: "service",
        });
      }
    }

    for (const event of events.data ?? []) {
      output.push(eventToCalendarItem(event));
    }

    return output.sort((a, b) =>
      a.date === b.date ? a.timeLabel.localeCompare(b.timeLabel) : a.date.localeCompare(b.date),
    );
  }, [cursor.monthIndex, cursor.year, events.data, services]);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const current = map.get(item.date) ?? [];
      current.push(item);
      map.set(item.date, current);
    }
    return map;
  }, [items]);

  const firstWeekday = new Date(Date.UTC(cursor.year, cursor.monthIndex, 1, 12)).getUTCDay();
  const totalDays = daysInMonth(cursor.year, cursor.monthIndex);
  const cells: Array<string | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, index) => dateString(cursor.year, cursor.monthIndex, index + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const moveMonth = (offset: number) => {
    const date = new Date(Date.UTC(cursor.year, cursor.monthIndex + offset, 1, 12));
    setCursor({ year: date.getUTCFullYear(), monthIndex: date.getUTCMonth() });
  };

  const daysWithItems = Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <section id="calendario-programacao" className="mt-16 scroll-mt-24 rounded-[2rem] border border-border bg-surface p-5 sm:p-8 lg:p-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow text-green-700">Calendário da igreja</p>
          <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
            {monthLabel(cursor.year, cursor.monthIndex)}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
            Cultos fixos aparecem automaticamente. Eventos especiais, destaques e avisos são publicados pela administração.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            className="grid h-11 w-11 place-items-center rounded-full border border-border bg-white text-green-900 transition-colors hover:bg-surface-soft"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            className="grid h-11 w-11 place-items-center rounded-full border border-border bg-white text-green-900 transition-colors hover:bg-surface-soft"
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-2 text-xs font-bold">
        <span className="rounded-full bg-green-50 px-3 py-1.5 text-green-800">Culto fixo</span>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">Evento</span>
        <span className="rounded-full bg-green-900 px-3 py-1.5 text-white">Destaque</span>
        <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-900">Aviso</span>
      </div>

      {events.isError ? (
        <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Os eventos especiais não puderam ser carregados agora. Os cultos fixos continuam disponíveis abaixo.
        </p>
      ) : null}

      <div className="mt-7 hidden overflow-hidden rounded-2xl border border-border md:block">
        <div className="grid grid-cols-7 border-b border-border bg-surface-soft">
          {Array.from({ length: 7 }, (_, index) => (
            <div key={index} className="px-3 py-3 text-center text-xs font-extrabold uppercase tracking-[0.08em] text-text-secondary">
              {weekdayShortLabel(index)}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 bg-border gap-px">
          {cells.map((value, index) => {
            if (!value) return <div key={`empty-${index}`} className="min-h-32 bg-background/60" />;
            const dateItems = byDate.get(value) ?? [];
            const parsed = parseDateString(value);
            const isToday = value === getSaoPauloTodayString();
            return (
              <div key={value} className="min-h-32 bg-white p-2.5">
                <div className="mb-2 flex items-center justify-between">
                  <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold ${isToday ? "bg-green-900 text-white" : "text-text-primary"}`}>
                    {parsed?.day}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {dateItems.slice(0, 3).map((item) => (
                    <CalendarPill key={item.id} item={item} onClick={() => setSelected(item)} />
                  ))}
                  {dateItems.length > 3 ? (
                    <button
                      type="button"
                      onClick={() => setSelected(dateItems[3] ?? null)}
                      className="w-full px-1 text-left text-[11px] font-bold text-green-800"
                    >
                      +{dateItems.length - 3} mais
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-7 space-y-3 md:hidden">
        {daysWithItems.length === 0 ? (
          <div className="rounded-2xl bg-surface-soft px-5 py-8 text-center">
            <CalendarDays className="mx-auto h-6 w-6 text-green-700" aria-hidden="true" />
            <p className="mt-3 text-sm font-bold text-green-950">Nenhuma programação publicada neste mês.</p>
          </div>
        ) : (
          daysWithItems.map(([date, dateItems]) => {
            const badge = formatOccurrenceBadge(date);
            return (
              <article key={date} className="rounded-2xl border border-border bg-white p-4">
                <div className="flex items-center gap-3 border-b border-border pb-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-surface-soft text-base font-extrabold text-green-950">
                    {badge.day}
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-text-primary">{badge.weekday}</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-green-700">{badge.month}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {dateItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelected(item)}
                      className="flex w-full items-start justify-between gap-3 rounded-xl bg-surface-soft px-3 py-3 text-left"
                    >
                      <span>
                        <span className="block text-sm font-extrabold text-text-primary">{item.title}</span>
                        <span className="mt-1 block text-xs text-text-secondary">{item.timeLabel}</span>
                      </span>
                      <ItemBadge item={item} />
                    </button>
                  ))}
                </div>
              </article>
            );
          })
        )}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        {selected ? (
          <DialogContent className="max-h-[88vh] max-w-xl overflow-y-auto rounded-2xl border-border bg-white p-0">
            {selected.imageUrl ? (
              <img src={selected.imageUrl} alt="" className="aspect-[16/7] w-full rounded-t-2xl object-cover" />
            ) : null}
            <div className="p-6 sm:p-7">
              <DialogHeader>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <ItemBadge item={selected} />
                  <span className="text-xs font-bold uppercase tracking-wider text-green-700">{selected.category}</span>
                </div>
                <DialogTitle className="text-2xl font-extrabold text-green-950">{selected.title}</DialogTitle>
                <DialogDescription className="sr-only">Detalhes da programação selecionada</DialogDescription>
              </DialogHeader>
              <div className="mt-5 grid gap-3 text-sm text-text-secondary">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-green-700" aria-hidden="true" />
                  {formatOccurrenceBadge(selected.date).weekday}, {formatOccurrenceBadge(selected.date).day} de {formatOccurrenceBadge(selected.date).month.toLowerCase()}
                </p>
                <p className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-green-700" aria-hidden="true" />
                  {selected.timeLabel}
                </p>
                {selected.location ? (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-700" aria-hidden="true" />
                    {selected.location}
                  </p>
                ) : null}
              </div>
              {selected.description ? (
                <p className="mt-5 text-sm leading-7 text-text-secondary">{selected.description}</p>
              ) : null}
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </section>
  );
}

type CalendarItem = {
  id: string;
  source: "service" | "event";
  date: string;
  title: string;
  category: string;
  description: string;
  timeLabel: string;
  location: string | null;
  imageUrl: string | null;
  displayType: "service" | CalendarEvent["display_type"];
};

function eventToCalendarItem(event: CalendarEvent): CalendarItem {
  return {
    id: `event-${event.id}`,
    source: "event",
    date: event.event_date,
    title: event.title,
    category: event.category,
    description: event.description,
    timeLabel: formatEventTime(event.start_time, event.end_time, event.all_day),
    location: event.location,
    imageUrl: event.image_url,
    displayType: event.display_type,
  };
}

function itemClass(item: CalendarItem) {
  if (item.displayType === "featured") return "bg-green-900 text-white hover:bg-green-950";
  if (item.displayType === "notice") return "bg-amber-100 text-amber-950 hover:bg-amber-200";
  if (item.displayType === "service") return "bg-green-50 text-green-900 hover:bg-green-100";
  return "bg-slate-100 text-slate-800 hover:bg-slate-200";
}

function CalendarPill({ item, onClick }: { item: CalendarItem; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${item.title} · ${item.timeLabel}`}
      className={`block w-full truncate rounded-lg px-2 py-1.5 text-left text-[11px] font-bold transition-colors ${itemClass(item)}`}
    >
      {item.displayType === "notice" ? "AVISO · " : ""}{item.title}
    </button>
  );
}

function ItemBadge({ item }: { item: CalendarItem }) {
  if (item.displayType === "featured") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-900 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
        <Sparkles className="h-3 w-3" aria-hidden="true" /> Destaque
      </span>
    );
  }
  if (item.displayType === "notice") {
    return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-900">Aviso</span>;
  }
  if (item.displayType === "service") {
    return <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-green-800">Culto</span>;
  }
  return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-700">Evento</span>;
}
