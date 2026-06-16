"use client";

import { SourceSegment } from "@/components/SourceSegment";
import { TaskFiltersCompact } from "@/components/TaskFiltersCompact";
import { HomeHero } from "@/components/HomeHero";
import type { TaskListFilters } from "@/lib/task-filters";

type HomeExplorePanelProps = {
  filters: TaskListFilters;
  onChange: (next: TaskListFilters) => void;
  resultCount?: number;
};

export function HomeExplorePanel({ filters, onChange, resultCount }: HomeExplorePanelProps) {
  return (
    <div className="space-y-2">
      <HomeHero />

      <div className="sticky top-[3.15rem] z-10 -mx-4 border-b border-line/70 bg-page/92 px-4 py-2 backdrop-blur-md md:top-[6.6rem]">
        <div className="info-card space-y-2.5 p-3">
          <SourceSegment
            value={filters.source}
            onChange={(source) => onChange({ ...filters, source })}
          />
          <TaskFiltersCompact
            compact
            embedded
            value={filters}
            onChange={onChange}
            resultCount={resultCount}
            hideSourceFilter
          />
        </div>
      </div>
    </div>
  );
}
