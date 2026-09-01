import { TEAM_TIMEZONE } from "../domain";

export function dateKey(date = new Date(), timeZone = TEAM_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatDate(value?: string, options?: Intl.DateTimeFormatOptions): string {
  if (!value) return "";
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", options ?? { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function formatTime(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

export function relativeDate(value: string, now = new Date()): string {
  const date = new Date(value);
  const days = Math.round((date.getTime() - now.getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (Math.abs(days) < 7) return days > 0 ? `In ${days} days` : `${Math.abs(days)} days ago`;
  return formatDate(value, { month: "short", day: "numeric" });
}

export function startOfCurrentWeek(now = new Date()): string {
  const copy = new Date(now);
  const day = copy.getDay();
  copy.setDate(copy.getDate() + (day === 0 ? -6 : 1 - day));
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString();
}
