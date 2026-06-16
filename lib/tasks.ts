import type { Task as DbTask } from "@prisma/client";
import type { Task, TaskSource, TaskStatus } from "@/lib/types";
import type { TaskCategory, TaskListFilters } from "@/lib/task-filters";
import { defaultTaskListFilters, resolveWhenRange } from "@/lib/task-filters";
import { clampDurationHours } from "@/lib/duration";
import { resolveTaskDurationHours } from "@/lib/datetime";
import { normalizeCategory, PERSONAL_DEFAULT_CATEGORY } from "@/lib/categories";

export function toClientTask(row: DbTask): Task {
  return {
    id: row.id,
    source: row.source as TaskSource,
    title: row.title,
    description: row.description,
    category: normalizeCategory(row.category) ?? PERSONAL_DEFAULT_CATEGORY,
    durationHours: resolveTaskDurationHours(row.timeLabel, row.durationHours),
    pay: row.pay,
    place: row.place,
    timeLabel: row.timeLabel,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    emoji: row.emoji,
    lmkRequired: row.lmkRequired,
    phone: row.phone,
    status: row.status as TaskStatus,
    workerName: row.workerName,
    workerPhone: row.workerPhone,
    acceptedAt: row.acceptedAt?.toISOString() ?? null,
    publisherCompletedAt: row.publisherCompletedAt?.toISOString() ?? null,
    workerCompletedAt: row.workerCompletedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

export async function listTasks(filters: TaskListFilters = defaultTaskListFilters) {
  const { prisma } = await import("@/lib/prisma");

  const where: Record<string, unknown> = { status: "OPEN", hidden: false };

  if (filters.source === "person" || filters.source === "partner") {
    where.source = filters.source;
  }

  if (filters.category !== "all") {
    where.category = filters.category;
  }

  const whenRange = resolveWhenRange(filters.when, filters.scheduledDate || undefined);
  if (whenRange) {
    where.scheduledAt = whenRange;
  }

  const durationFilter =
    filters.durationHours !== "all" ? clampDurationHours(Number(filters.durationHours)) : null;

  const rows = await prisma.task.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
  });

  const filtered = durationFilter
    ? rows.filter(
        (row) => resolveTaskDurationHours(row.timeLabel, row.durationHours) === durationFilter
      )
    : rows;

  return filtered.map(toClientTask);
}

export async function getTaskById(id: string) {
  const { prisma } = await import("@/lib/prisma");
  const row = await prisma.task.findUnique({ where: { id } });
  if (!row || row.hidden) return null;
  return toClientTask(row);
}
