"use client";

import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { t } from "@/lib/i18n";

type PullToRefreshProps = {
  onRefresh: () => void | Promise<void>;
  disabled?: boolean;
};

export function PullToRefresh({ onRefresh, disabled }: PullToRefreshProps) {
  const { pullDistance, refreshing, active, progress } = usePullToRefresh({ onRefresh, disabled });

  if (!active) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center md:hidden"
      style={{ transform: `translateY(${refreshing ? 56 : Math.min(pullDistance, 56)}px)` }}
      aria-live="polite"
      aria-busy={refreshing}
    >
      <div className="mt-2 flex items-center gap-2 rounded-full bg-surface/95 px-3 py-2 text-[13px] font-medium text-muted shadow-soft ring-1 ring-black/[0.06] backdrop-blur-md">
        <span
          className={`inline-block h-4 w-4 rounded-full border-2 border-brand/30 border-t-brand ${
            refreshing ? "animate-spin" : ""
          }`}
          style={refreshing ? undefined : { transform: `rotate(${progress * 320}deg)` }}
          aria-hidden
        />
        <span>{refreshing ? t("common.refreshing") : t("common.pullToRefresh")}</span>
      </div>
    </div>
  );
}
