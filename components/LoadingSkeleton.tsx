"use client";

type LoadingSkeletonProps = {
  count?: number;
  variant?: "task" | "card";
};

function TaskRowSkeleton({ delayClass }: { delayClass?: string }) {
  return (
    <div
      className={`task-tile overflow-hidden opacity-0 animate-fade-up ${delayClass ?? ""}`}
      aria-hidden
    >
      <div className="flex gap-3 p-3">
        <div className="h-11 w-11 shrink-0 rounded-xl shimmer-block" />
        <div className="min-w-0 flex-1 space-y-2 py-0.5">
          <div className="h-4 w-[72%] rounded-lg shimmer-block" />
          <div className="h-3 w-[48%] rounded-md shimmer-block" />
        </div>
      </div>
      <div className="mx-3 border-t border-line/60" />
      <div className="flex justify-between px-3 py-2.5">
        <div className="space-y-2">
          <div className="h-3.5 w-24 rounded-md shimmer-block" />
          <div className="h-3 w-14 rounded-md shimmer-block" />
        </div>
        <div className="space-y-2 text-right">
          <div className="ml-auto h-4 w-16 rounded-md shimmer-block" />
          <div className="ml-auto h-3 w-12 rounded-md shimmer-block" />
        </div>
      </div>
    </div>
  );
}

export function LoadingSkeleton({ count = 4, variant = "task" }: LoadingSkeletonProps) {
  if (variant === "card") {
    return (
      <div className="info-card p-8">
        <div className="mx-auto flex flex-col items-center gap-4">
          <div className="h-14 w-14 rounded-2xl shimmer-block" />
          <div className="h-4 w-40 rounded-lg shimmer-block" />
          <div className="h-3 w-56 rounded-md shimmer-block" />
        </div>
      </div>
    );
  }

  const delays = ["stagger-1", "stagger-2", "stagger-3", "stagger-4", "stagger-5", "stagger-6"];

  return (
    <div className="task-grid" role="status" aria-label="Загрузка">
      <div className="flex items-center justify-center gap-2 py-2">
        <span className="inline-flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-brand animate-pulse-soft"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
        <span className="text-[14px] font-medium text-muted">Загружаем задания…</span>
      </div>
      {Array.from({ length: count }, (_, i) => (
        <TaskRowSkeleton key={i} delayClass={delays[i % delays.length]} />
      ))}
    </div>
  );
}
