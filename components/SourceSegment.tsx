"use client";

import type { SourceFilter } from "@/lib/task-filters";
import { t } from "@/lib/i18n";

const OPTIONS: SourceFilter[] = ["all", "person", "partner"];

type SourceSegmentProps = {
  value: SourceFilter;
  onChange: (value: SourceFilter) => void;
};

function labelFor(value: SourceFilter) {
  if (value === "person") return t("home.filterHome");
  if (value === "partner") return t("home.filterStore");
  return t("home.filterAll");
}

export function SourceSegment({ value, onChange }: SourceSegmentProps) {
  const index = Math.max(0, OPTIONS.indexOf(value));
  const segmentWidth = 100 / OPTIONS.length;

  return (
    <div
      className="relative flex rounded-2xl bg-page/80 p-1 ring-1 ring-black/[0.04]"
      role="tablist"
      aria-label={t("filters.publisher")}
    >
      <div
        className="absolute inset-y-1 rounded-xl bg-surface shadow-card ring-1 ring-black/[0.05] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          width: `calc(${segmentWidth}% - 0.25rem)`,
          left: `calc(${index * segmentWidth}% + 0.125rem)`,
        }}
        aria-hidden
      />
      {OPTIONS.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option)}
            className={`relative z-10 flex-1 rounded-xl px-2 py-2 text-center text-[14px] font-semibold transition-colors duration-200 ${
              active ? "text-ink" : "text-muted"
            }`}
          >
            {labelFor(option)}
          </button>
        );
      })}
    </div>
  );
}
