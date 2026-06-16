"use client";

import { useEffect, useState } from "react";
import { SourceSegment } from "@/components/SourceSegment";
import { TaskFiltersCompact } from "@/components/TaskFiltersCompact";
import { HomeHero } from "@/components/HomeHero";
import type { TaskListFilters } from "@/lib/task-filters";

type HomeExplorePanelProps = {
  filters: TaskListFilters;
  onChange: (next: TaskListFilters) => void;
  resultCount?: number;
  taskCount?: number;
  loading?: boolean;
};

export function HomeExplorePanel({
  filters,
  onChange,
  resultCount,
  taskCount,
  loading,
}: HomeExplorePanelProps) {
  const [compactChrome, setCompactChrome] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompactChrome(window.scrollY > 96);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="space-y-2">
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          compactChrome ? "max-h-0 opacity-0" : "max-h-40 opacity-100"
        }`}
        aria-hidden={compactChrome}
      >
        <HomeHero compact taskCount={taskCount} loading={loading} />
      </div>

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
