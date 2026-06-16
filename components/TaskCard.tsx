import Link from "next/link";
import type { Task } from "@/lib/types";
import { formatHourlyRate } from "@/lib/pay";
import { formatDuration } from "@/lib/task-filters";
import { t } from "@/lib/i18n";

type TaskCardProps = {
  task: Task;
  index?: number;
};

export function TaskCard({ task }: TaskCardProps) {
  const isPartner = task.source === "partner";
  const publisher = isPartner ? t("home.fromPartner") : t("home.fromPerson");

  return (
    <article className="task-tile group">
      <Link href={`/tasks/${task.id}`} className="block active:opacity-95">
        <div
          className={`h-0.5 w-full ${isPartner ? "bg-gradient-to-r from-taiga/80 to-taiga/20" : "bg-gradient-to-r from-brand/80 to-brand/20"}`}
          aria-hidden
        />
        <div className="flex items-start gap-2.5 px-3 pb-2 pt-2.5">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg leading-none transition duration-300 group-hover:scale-105 ${
              isPartner
                ? "border-taiga/20 bg-taiga-light/50"
                : "border-brand/20 bg-brand-light/50"
            }`}
          >
            {task.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[15px] font-semibold leading-snug text-ink transition-colors group-hover:text-brand-dark">
                {task.title}
              </h3>
              <p className="shrink-0 text-[17px] font-bold leading-none text-taiga">
                {task.pay.toLocaleString("ru-RU")} ₽
              </p>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-[14px] text-muted">
                {publisher} · {task.place}
              </p>
              <p className="shrink-0 text-[13px] font-medium leading-none text-muted">
                {formatHourlyRate(task.pay, task.durationHours)}
              </p>
            </div>
          </div>
        </div>

        <div className="mx-3 border-t border-line/80" />

        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <p className="text-[14px] font-semibold leading-none text-ink">{task.timeLabel}</p>
          <p className="text-[14px] leading-none text-muted">{formatDuration(task.durationHours)}</p>
        </div>
      </Link>
    </article>
  );
}
