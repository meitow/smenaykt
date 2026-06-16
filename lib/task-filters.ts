import { parseScheduledDate } from "@/lib/datetime";
import { DURATION_HOUR_OPTIONS } from "@/lib/duration";
import type { TaskCategory } from "@/lib/categories";

export {
  TASK_CATEGORIES,
  PARTNER_DEFAULT_CATEGORY,
  PARTNER_ONLY_CATEGORIES,
  PARTNER_TASK_CATEGORY_GROUPS,
  PERSONAL_DEFAULT_CATEGORY,
  PERSON_POST_CATEGORIES,
  isAllowedPersonPostCategory,
  parsePersonPostCategory,
  TASK_CATEGORY_GROUPS,
  categoryLabelKey,
  categoryGroupLabelKey,
  isPartnerOnlyCategory,
  normalizeCategory,
  parsePartnerCategory,
  findCategoryGroup,
  type TaskCategory,
  type TaskCategoryGroupId,
} from "@/lib/categories";

export type { TaskCategory as TaskCategoryFilter };

export const TIME_FILTERS = ["all", "today", "tomorrow", "week", "date"] as const;
export type TimeFilter = (typeof TIME_FILTERS)[number];

export const DURATION_HOUR_FILTER_OPTIONS = ["all", ...DURATION_HOUR_OPTIONS.map(String)] as const;
export type DurationHoursFilter = (typeof DURATION_HOUR_FILTER_OPTIONS)[number];

export type SourceFilter = "all" | "person" | "partner";

export type TaskListFilters = {
  source: SourceFilter;
  category: TaskCategory | "all";
  when: TimeFilter;
  scheduledDate: string;
  durationHours: DurationHoursFilter;
  search: string;
};

export const defaultTaskListFilters: TaskListFilters = {
  source: "all",
  category: "all",
  when: "all",
  scheduledDate: "",
  durationHours: "all",
  search: "",
};


export function buildTasksQuery(filters: TaskListFilters): string {
  const params = new URLSearchParams();
  if (filters.source !== "all") params.set("source", filters.source);
  if (filters.category !== "all") params.set("category", filters.category);
  if (filters.when !== "all") {
    params.set("when", filters.when);
    if (filters.when === "date" && filters.scheduledDate) {
      params.set("scheduledDate", filters.scheduledDate);
    }
  }
  if (filters.durationHours !== "all") params.set("durationHours", filters.durationHours);
  const search = filters.search.trim();
  if (search) params.set("q", search);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function resolveWhenRange(
  when: TimeFilter,
  scheduledDate?: string
): { gte?: Date; lte?: Date } | null {
  if (when === "date" && scheduledDate) {
    const date = parseScheduledDate(scheduledDate);
    if (date) return { gte: startOfDay(date), lte: endOfDay(date) };
    return null;
  }

  const now = new Date();
  const today = startOfDay(now);

  if (when === "today") {
    return { gte: today, lte: endOfDay(today) };
  }

  if (when === "tomorrow") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { gte: tomorrow, lte: endOfDay(tomorrow) };
  }

  if (when === "week") {
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return { gte: today, lte: endOfDay(weekEnd) };
  }

  return null;
}

export function matchesTaskSearch(task: { title: string; description: string; place: string }, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = `${task.title} ${task.description} ${task.place}`.toLowerCase();
  return haystack.includes(q);
}

export function formatDuration(hours: number): string {
  if (hours <= 0) return "—";
  return `${hours} ч`;
}
