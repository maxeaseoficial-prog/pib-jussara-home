import type { ChurchService } from "./programming-data";

const weekdayLong = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

const weekdayShort = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function dateString(year: number, monthIndex: number, day: number) {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

export function parseDateString(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (!Number.isFinite(year) || monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) return null;
  return { year, monthIndex, day };
}

export function daysInMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function weekdayForDate(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day, 12)).getUTCDay();
}

export function getSaoPauloTodayString() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function formatServiceTime(value: string | null | undefined) {
  if (!value) return "—";
  const [hours = "", minutes = ""] = value.split(":");
  return `${hours}h${minutes}`;
}

export function formatEventTime(start: string | null, end: string | null, allDay = false) {
  if (allDay) return "Dia inteiro";
  const startLabel = formatServiceTime(start);
  if (!end) return startLabel;
  return `${startLabel} – ${formatServiceTime(end)}`;
}

export function formatServiceRecurrence(service: ChurchService) {
  const time = formatServiceTime(service.service_time);
  if (service.recurrence_type === "weekly") {
    const day = service.weekday == null ? "Dia não definido" : weekdayLong[service.weekday];
    return `${day} · ${time}`;
  }
  return `Todo dia ${service.day_of_month ?? "—"} · ${time}`;
}

export function serviceOccurrencesInMonth(service: ChurchService, year: number, monthIndex: number) {
  const output: string[] = [];
  const totalDays = daysInMonth(year, monthIndex);

  if (service.recurrence_type === "weekly" && service.weekday != null) {
    for (let day = 1; day <= totalDays; day += 1) {
      if (weekdayForDate(year, monthIndex, day) === service.weekday) {
        output.push(dateString(year, monthIndex, day));
      }
    }
    return output;
  }

  if (
    service.recurrence_type === "monthly" &&
    service.day_of_month != null &&
    service.day_of_month <= totalDays
  ) {
    output.push(dateString(year, monthIndex, service.day_of_month));
  }
  return output;
}

export function nextServiceOccurrence(service: ChurchService, from = getSaoPauloTodayString()) {
  const parsed = parseDateString(from);
  if (!parsed) return null;

  if (service.recurrence_type === "weekly" && service.weekday != null) {
    for (let offset = 0; offset <= 7; offset += 1) {
      const date = new Date(Date.UTC(parsed.year, parsed.monthIndex, parsed.day + offset, 12));
      if (date.getUTCDay() === service.weekday) {
        return dateString(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
      }
    }
    return null;
  }

  if (service.recurrence_type === "monthly" && service.day_of_month != null) {
    for (let offset = 0; offset <= 12; offset += 1) {
      const absoluteMonth = parsed.monthIndex + offset;
      const year = parsed.year + Math.floor(absoluteMonth / 12);
      const monthIndex = ((absoluteMonth % 12) + 12) % 12;
      const totalDays = daysInMonth(year, monthIndex);
      if (service.day_of_month > totalDays) continue;
      const candidate = dateString(year, monthIndex, service.day_of_month);
      if (candidate >= from) return candidate;
    }
  }

  return null;
}

export function formatOccurrenceBadge(value: string) {
  const parsed = parseDateString(value);
  if (!parsed) return { day: "—", month: "—", weekday: "—" };
  const date = new Date(Date.UTC(parsed.year, parsed.monthIndex, parsed.day, 12));
  const month = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" })
    .format(date)
    .replace(".", "")
    .toUpperCase();
  return {
    day: pad(parsed.day),
    month,
    weekday: weekdayLong[date.getUTCDay()],
  };
}

export function monthLabel(year: number, monthIndex: number) {
  const value = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthIndex, 1, 12)));
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function weekdayShortLabel(index: number) {
  return weekdayShort[index] ?? "";
}
