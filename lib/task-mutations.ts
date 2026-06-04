import type { Task } from "@prisma/client";
import { sanitizeEmoji } from "@/lib/emoji";
import {
  combineDateAndTime,
  durationHoursFromRange,
  formatScheduleLabel,
  parseScheduledDate,
  parseTimeRangeFromLabel,
} from "@/lib/datetime";
import { clampDurationHours } from "@/lib/duration";
import { MAX_TASK_PAY, parseTaskPay } from "@/lib/pay";
import {
  isPartnerOnlyCategory,
  normalizeCategory,
  parsePersonPostCategory,
  parsePartnerCategory,
  PARTNER_DEFAULT_CATEGORY,
} from "@/lib/categories";

export const TASK_MUTATION_ERRORS = {
  NOT_FOUND: "Задание не найдено",
  NOT_OPEN: "Можно изменить или удалить только открытое задание",
  FORBIDDEN: "Нет доступа к этому заданию",
  INVALID: "Некорректные данные",
} as const;

export function assertTaskOpen(task: Pick<Task, "status">) {
  if (task.status !== "OPEN") {
    throw new Error("NOT_OPEN");
  }
}

type ScheduleInput = {
  scheduledAt?: string;
  timeStart?: string;
  timeEnd?: string;
  timeLabel?: string;
  durationHours?: number;
};

export function resolveScheduleFields(input: ScheduleInput, fallbackDuration = 2) {
  const scheduledDateRaw = String(input.scheduledAt ?? "").trim();
  const timeStart = String(input.timeStart ?? "").trim();
  const timeEnd = String(input.timeEnd ?? "").trim();
  let durationHours = clampDurationHours(Number(input.durationHours) || 0);
  let scheduledAt =
    scheduledDateRaw && timeStart ? combineDateAndTime(scheduledDateRaw, timeStart) : null;
  let timeLabel = String(input.timeLabel ?? "").trim();

  if (timeStart && timeEnd && scheduledDateRaw) {
    const rangeHours = durationHoursFromRange(timeStart, timeEnd);
    if (!rangeHours) return { error: "Время окончания должно быть позже начала" as const };
    durationHours = clampDurationHours(rangeHours);
    scheduledAt = combineDateAndTime(scheduledDateRaw, timeStart);
    timeLabel = formatScheduleLabel(scheduledDateRaw, timeStart, timeEnd);
  } else if (!durationHours) {
    durationHours = fallbackDuration;
    scheduledAt = scheduledDateRaw ? parseScheduledDate(scheduledDateRaw) : null;
  }

  if (!timeLabel || !scheduledAt) {
    return { error: "Укажите дату и время" as const };
  }

  return { durationHours, scheduledAt, timeLabel };
}

export function parsePersonTaskBody(body: Record<string, unknown>) {
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const place = String(body.place ?? "").trim();
  const pay = parseTaskPay(body.pay);
  const requestedCategory = normalizeCategory(String(body.category ?? ""));
  if (requestedCategory && isPartnerOnlyCategory(requestedCategory)) {
    return { error: "Продажи и коммерческие услуги доступны только подтверждённым партнёрам." };
  }
  const category = parsePersonPostCategory(String(body.category ?? ""));
  const schedule = resolveScheduleFields(body as ScheduleInput, 2);
  if ("error" in schedule) return { error: schedule.error };

  if (!title || !place || pay === null) {
    return {
      error: `Заполните все поля. Оплата — от 1 до ${MAX_TASK_PAY.toLocaleString("ru-RU")} ₽`,
    };
  }

  return {
    data: {
      title,
      description,
      place,
      pay,
      category,
      durationHours: schedule.durationHours,
      scheduledAt: schedule.scheduledAt,
      timeLabel: schedule.timeLabel,
      emoji: sanitizeEmoji(String(body.emoji ?? "📋")),
    },
  };
}

export function parsePartnerTaskBody(body: Record<string, unknown>, defaultPlace: string) {
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const place = String(body.place ?? defaultPlace).trim();
  const pay = parseTaskPay(body.pay);
  const schedule = resolveScheduleFields(body as ScheduleInput, 8);
  if ("error" in schedule) return { error: schedule.error };

  if (!title || !place || pay === null) {
    return {
      error: `Заполните все поля. Оплата — до ${MAX_TASK_PAY.toLocaleString("ru-RU")} ₽`,
    };
  }

  const category =
    parsePartnerCategory(String(body.category ?? "")) ?? PARTNER_DEFAULT_CATEGORY;

  return {
    data: {
      title,
      description,
      place,
      pay,
      category,
      durationHours: schedule.durationHours,
      scheduledAt: schedule.scheduledAt,
      timeLabel: schedule.timeLabel,
      emoji: sanitizeEmoji(String(body.emoji ?? "🛒")),
      lmkRequired: Boolean(body.lmkRequired),
    },
  };
}

export function scheduledDateFromIso(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function defaultTimesFromTask(timeLabel: string, scheduledAt: string | null | undefined) {
  const range = parseTimeRangeFromLabel(timeLabel);
  if (range) return range;

  if (scheduledAt) {
    const date = new Date(scheduledAt);
    const hours = date.getHours();
    const pad = (n: number) => String(n).padStart(2, "0");
    const start = `${pad(hours)}:${pad(date.getMinutes())}`;
    const endHours = Math.min(23, hours + 2);
    return { start, end: `${pad(endHours)}:${pad(date.getMinutes())}` };
  }

  return { start: "10:00", end: "12:00" };
}
