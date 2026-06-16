"use client";

import { useState } from "react";
import { CategoryFilterSheet } from "@/components/CategoryFilterSheet";
import { FilterSheet } from "@/components/FilterSheet";
import { WhenFilterSheet } from "@/components/WhenFilterSheet";
import { formatDateLabel } from "@/lib/datetime";
import {
  DURATION_HOUR_FILTER_OPTIONS,
  defaultTaskListFilters,
  type DurationHoursFilter,
  type SourceFilter,
  type TaskCategory,
  type TaskListFilters,
  type TimeFilter,
} from "@/lib/task-filters";
import { t } from "@/lib/i18n";

type SheetKey = "source" | "category" | "when" | "durationHours";

type TaskFiltersCompactProps = {
  value: TaskListFilters;
  onChange: (next: TaskListFilters) => void;
  resultCount?: number;
  hideSourceFilter?: boolean;
  compact?: boolean;
  embedded?: boolean;
};

function labelForSource(v: SourceFilter) {
  if (v === "person") return t("home.filterHome");
  if (v === "partner") return t("home.filterStore");
  return t("home.filterAll");
}

function labelForCategory(v: TaskCategory | "all") {
  return t(`filters.category.${v}`);
}

function labelForWhen(when: TimeFilter, scheduledDate: string) {
  if (when === "date" && scheduledDate) return formatDateLabel(scheduledDate);
  return t(`filters.when.${when}`);
}

function labelForDuration(v: DurationHoursFilter) {
  if (v === "all") return t("filters.duration.all");
  return `${v} ч`;
}

export function TaskFiltersCompact({
  value,
  onChange,
  resultCount,
  hideSourceFilter = false,
  compact = false,
  embedded = false,
}: TaskFiltersCompactProps) {
  const [openSheet, setOpenSheet] = useState<SheetKey | null>(null);

  const sourceOptions: { id: SourceFilter; label: string }[] = [
    { id: "all", label: t("home.filterAll") },
    { id: "person", label: t("home.filterHome") },
    { id: "partner", label: t("home.filterStore") },
  ];

  const durationOptions = DURATION_HOUR_FILTER_OPTIONS.map((id) => ({
    id,
    label: labelForDuration(id),
  }));

  const triggers: { key: SheetKey; label: string; current: string; active: boolean }[] = [
    {
      key: "category",
      label: t("filters.serviceType"),
      current: labelForCategory(value.category),
      active: value.category !== "all",
    },
    ...(hideSourceFilter
      ? []
      : [
          {
            key: "source" as const,
            label: t("filters.publisher"),
            current: labelForSource(value.source),
            active: value.source !== "all",
          },
        ]),
    {
      key: "when",
      label: t("filters.whenLabel"),
      current: labelForWhen(value.when, value.scheduledDate),
      active: value.when !== "all",
    },
    {
      key: "durationHours",
      label: t("filters.durationShort"),
      current: labelForDuration(value.durationHours),
      active: value.durationHours !== "all",
    },
  ];

  function confirm<K extends SheetKey>(key: K, selected: TaskListFilters[K]) {
    onChange({ ...value, [key]: selected });
    setOpenSheet(null);
  }

  const hasActiveFilters =
    value.search.trim().length > 0 ||
    (!hideSourceFilter && value.source !== "all") ||
    value.category !== "all" ||
    value.when !== "all" ||
    value.durationHours !== "all";

  function resetFilters() {
    onChange(
      hideSourceFilter && value.source !== "all"
        ? { ...defaultTaskListFilters, source: value.source }
        : defaultTaskListFilters
    );
  }

  const filterGridClass =
    triggers.length === 3
      ? "grid grid-cols-3 gap-2"
      : compact
        ? "filter-scroll-row"
        : "grid grid-cols-2 gap-2 sm:grid-cols-4";

  const triggerClass = compact ? "filter-trigger-compact" : "filter-trigger";

  const content = (
    <div className={embedded ? "space-y-2" : "space-y-2"}>
      <label className="block">
        <span className="sr-only">{t("filters.searchLabel")}</span>
        <input
          type="search"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          placeholder={t("filters.searchPlaceholder")}
          className={`input-field !mt-0 ${compact ? "!py-2.5 text-[16px]" : ""}`}
          autoComplete="off"
        />
      </label>

      <div className={filterGridClass}>
        {triggers.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setOpenSheet(item.key)}
            className={`${triggerClass} w-full ${item.active ? "filter-trigger-active" : ""}`}
          >
            <span className="filter-trigger-label">{item.label}</span>
            <span className="filter-trigger-value">
              <span className="filter-trigger-value-text">{item.current}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        {typeof resultCount === "number" ? (
          <p className="text-[13px] font-medium text-muted">{t("filters.results", { count: resultCount })}</p>
        ) : (
          <span />
        )}
        {hasActiveFilters ? (
          <button type="button" onClick={resetFilters} className="text-[13px] font-medium text-brand">
            {t("filters.reset")}
          </button>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      {embedded ? content : <div className="info-card p-3">{content}</div>}

      <CategoryFilterSheet
        open={openSheet === "category"}
        value={value.category}
        onClose={() => setOpenSheet(null)}
        onConfirm={(category) => confirm("category", category)}
      />
      <FilterSheet
        open={openSheet === "source"}
        title={t("filters.publisher")}
        value={value.source}
        options={sourceOptions}
        onClose={() => setOpenSheet(null)}
        onConfirm={(source) => confirm("source", source)}
      />
      <WhenFilterSheet
        open={openSheet === "when"}
        when={value.when}
        scheduledDate={value.scheduledDate}
        onClose={() => setOpenSheet(null)}
        onConfirm={(when, scheduledDate) => {
          onChange({ ...value, when, scheduledDate });
          setOpenSheet(null);
        }}
      />
      <FilterSheet
        open={openSheet === "durationHours"}
        title={t("filters.durationLabel")}
        value={value.durationHours}
        options={durationOptions}
        onClose={() => setOpenSheet(null)}
        onConfirm={(durationHours) => confirm("durationHours", durationHours)}
      />
    </>
  );
}
