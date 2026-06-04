"use client";

import Link from "next/link";
import type { Task } from "@/lib/types";
import { taskCompletionLabel } from "@/lib/task-completion";
import { formatHourlyRate } from "@/lib/pay";
import { formatDuration } from "@/lib/task-filters";
import { t } from "@/lib/i18n";

function statusBadge(task: Task) {
  const label = taskCompletionLabel(task);
  if (label === "done") return { text: t("profile.statusDone"), className: "bg-taiga-light text-taiga-dark" };
  if (label === "awaiting") return { text: t("profile.statusAwaitingClose"), className: "bg-page text-ink" };
  if (task.status === "ACCEPTED") return { text: t("profile.statusAccepted"), className: "bg-brand-light text-brand-dark" };
  return { text: t("profile.statusOpen"), className: "bg-page text-muted" };
}

type PartnerTaskCardProps = {
  task: Task;
};

export function PartnerTaskCard({ task }: PartnerTaskCardProps) {
  const badge = statusBadge(task);
  const workerPhone = task.workerPhone;

  return (
    <article className="task-tile">
      <Link href={`/partner/tasks/${task.id}`} className="block active:opacity-95">
        <div className="flex gap-2.5 px-3 pb-2 pt-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-base leading-none">
            {task.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[15px] font-semibold leading-snug text-ink">{task.title}</h3>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}>
                {badge.text}
              </span>
            </div>
            <p className="mt-0.5 line-clamp-1 text-[13px] text-muted">
              {task.place} · {t(`filters.category.${task.category}`)}
            </p>
          </div>
        </div>

        <div className="mx-3 border-t border-line" />

        <div className="flex items-end justify-between gap-3 px-3 py-2">
          <div>
            <p className="text-[14px] font-semibold leading-none text-ink">{task.timeLabel}</p>
            <p className="mt-1 text-[12px] leading-none text-muted">
              {formatDuration(task.durationHours)}
              {task.lmkRequired ? ` · ${t("task.lmkRequired")}` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[15px] font-bold leading-none text-taiga">
              {task.pay.toLocaleString("ru-RU")} ₽
            </p>
            <p className="mt-1 text-[11px] leading-none text-muted">
              {formatHourlyRate(task.pay, task.durationHours)}
            </p>
          </div>
        </div>
      </Link>

      {workerPhone && (
        <div className="border-t border-line px-3 py-2.5">
          <Link
            href={`/partner/workers/${encodeURIComponent(workerPhone)}?from=${encodeURIComponent(`/partner/tasks/${task.id}`)}`}
            className="flex items-center justify-between text-[14px] active:opacity-90"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-muted">
              {t("partner.worker")}: <span className="font-medium text-ink">{task.workerName ?? t("profile.guest")}</span>
            </span>
            <span className="font-medium text-brand">{t("partner.viewProfile")} ›</span>
          </Link>
        </div>
      )}
    </article>
  );
}
