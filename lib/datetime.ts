export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function defaultDateValue(offsetDays = 1): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parse YYYY-MM-DD or ISO string → date at local noon. */
export function parseScheduledDate(value: string): Date | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0, 0);
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return startOfDay(parsed);
}

export function formatDateLabel(value: string): string {
  const date = parseScheduledDate(value);
  if (!date) return value;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    weekday: "short",
  }).format(date);
}

export function defaultTimeValue(hours: number, minutes = 0): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}`;
}

export function parseTimeHm(value: string): { hours: number; minutes: number } | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  return { hours, minutes };
}

export function combineDateAndTime(dateValue: string, timeValue: string): Date | null {
  const match = dateValue.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  const time = parseTimeHm(timeValue);
  if (!match || !time) return null;

  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d), time.hours, time.minutes, 0, 0);
}

export function formatTimeHm(value: string): string {
  const time = parseTimeHm(value);
  if (!time) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(time.hours)}:${pad(time.minutes)}`;
}

export function formatScheduleLabel(dateValue: string, startTime: string, endTime: string): string {
  return `${formatDateLabel(dateValue)} · ${formatTimeHm(startTime)}—${formatTimeHm(endTime)}`;
}

export function durationHoursFromRange(startTime: string, endTime: string): number | null {
  const start = parseTimeHm(startTime);
  const end = parseTimeHm(endTime);
  if (!start || !end) return null;

  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;
  if (endMinutes <= startMinutes) return null;

  return Math.max(1, Math.ceil((endMinutes - startMinutes) / 60));
}

/** Extract start/end from labels like "30 мая, сб · 10:00—12:00". */
export function parseTimeRangeFromLabel(timeLabel: string): { start: string; end: string } | null {
  const match = timeLabel.match(/(\d{1,2}:\d{2})\s*[—–-]\s*(\d{1,2}:\d{2})/);
  if (!match) return null;

  return {
    start: formatTimeHm(match[1]),
    end: formatTimeHm(match[2]),
  };
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  const absSec = Math.abs(diffSec);

  const rtf = new Intl.RelativeTimeFormat("ru", { numeric: "auto" });

  if (absSec < 60) return rtf.format(diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, "hour");
  const diffDay = Math.round(diffHour / 24);
  if (Math.abs(diffDay) < 7) return rtf.format(diffDay, "day");

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function resolveTaskDurationHours(timeLabel: string, fallbackHours: number): number {
  const range = parseTimeRangeFromLabel(timeLabel);
  if (!range) return fallbackHours;

  const hours = durationHoursFromRange(range.start, range.end);
  return hours ?? fallbackHours;
}
