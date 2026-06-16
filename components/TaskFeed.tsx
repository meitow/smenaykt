"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { HomeHero } from "@/components/HomeHero";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { SourceSegment } from "@/components/SourceSegment";
import { TaskCard } from "@/components/TaskCard";
import { TaskFiltersCompact } from "@/components/TaskFiltersCompact";
import type { Task } from "@/lib/types";
import {
  buildTasksQuery,
  defaultTaskListFilters,
  type SourceFilter,
  type TaskListFilters,
} from "@/lib/task-filters";
import { t } from "@/lib/i18n";

function isTaskArray(value: unknown): value is Task[] {
  return Array.isArray(value);
}

type TaskFeedProps = {
  fixedSource?: Exclude<SourceFilter, "all">;
  emptyTitleKey?: string;
  emptyHintKey?: string;
  showHero?: boolean;
  initialSource?: SourceFilter;
};

export function TaskFeed({
  fixedSource,
  emptyTitleKey = "home.noTasks",
  emptyHintKey = "home.noTasksHint",
  showHero = false,
  initialSource,
}: TaskFeedProps) {
  const [filters, setFilters] = useState<TaskListFilters>(() => {
    const base = fixedSource
      ? { ...defaultTaskListFilters, source: fixedSource }
      : defaultTaskListFilters;
    if (initialSource && !fixedSource) {
      return { ...base, source: initialSource };
    }
    return base;
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const res = await fetch(`/api/tasks${buildTasksQuery(filters)}`);

      let data: unknown;
      try {
        data = await res.json();
      } catch {
        setLoadError("Ошибка сервера");
        setTasks([]);
        return;
      }

      if (!res.ok || !isTaskArray(data)) {
        const message =
          data && typeof data === "object" && "error" in data
            ? String((data as { error: unknown }).error)
            : "Не удалось загрузить задания";
        setLoadError(message);
        setTasks([]);
        return;
      }

      setTasks(data);
    } catch {
      setLoadError("Нет связи с сервером");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  function handleFiltersChange(next: TaskListFilters) {
    setFilters(fixedSource ? { ...next, source: fixedSource } : next);
  }

  return (
    <div className="space-y-3">
      {showHero && (
        <HomeHero taskCount={loading ? undefined : tasks.length} loading={loading} />
      )}

      {!fixedSource && showHero && (
        <SourceSegment
          value={filters.source}
          onChange={(source) => handleFiltersChange({ ...filters, source })}
        />
      )}

      <div className="animate-fade-in opacity-0" style={{ animationDelay: "80ms" }}>
        <TaskFiltersCompact
          value={filters}
          onChange={handleFiltersChange}
          resultCount={loading ? undefined : tasks.length}
          hideSourceFilter={Boolean(fixedSource) || showHero}
        />
      </div>

      {loadError ? (
        <div className="info-card animate-scale-in p-5 text-center opacity-0">
          <p className="text-sm text-rose-600">{loadError}</p>
          <button type="button" onClick={load} className="btn-soft mt-3 !py-2.5">
            Повторить
          </button>
        </div>
      ) : loading ? (
        <LoadingSkeleton count={4} />
      ) : tasks.length === 0 ? (
        <div className="animate-fade-up opacity-0">
          <EmptyState title={t(emptyTitleKey)} hint={t(emptyHintKey)} />
        </div>
      ) : (
        <ul className="space-y-2.5">
          {tasks.map((task, index) => (
            <li
              key={task.id}
              className="opacity-0 animate-fade-up"
              style={{ animationDelay: `${120 + index * 50}ms` }}
            >
              <TaskCard task={task} index={index} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
