"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarIcon, ClockIcon } from "@/components/InfoRow";
import { DetailSheet } from "@/components/DetailSheet";
import { PressableRow } from "@/components/PressableRow";
import { TaskDetailActions } from "@/components/TaskDetailActions";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";
import { formatHourlyRate } from "@/lib/pay";
import { build2GisPlaceUrl, build2GisRouteUrl } from "@/lib/maps";
import { formatRuPhone } from "@/lib/phone";
import { formatDuration } from "@/lib/task-filters";
import type { Task } from "@/lib/types";
import { t } from "@/lib/i18n";

type SheetKey = "pay" | "payout" | "whatToDo" | "contact" | "partner" | null;

type TaskDetailViewProps = {
  task: Task;
};

function descriptionLines(text: string) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function TaskDetailView({ task }: TaskDetailViewProps) {
  const [sheet, setSheet] = useState<SheetKey>(null);
  const isPartner = task.source === "partner";
  const lines = task.description ? descriptionLines(task.description) : [];
  const hourlyRate = Math.round(task.pay / Math.max(task.durationHours, 1));
  const mapUrl = build2GisPlaceUrl(task.place, t("brand.city"));
  const routeUrl = build2GisRouteUrl(task.place, t("brand.city"));

  const accentClass = isPartner ? "text-taiga" : "text-brand";

  return (
    <>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface/95 px-4 py-3 backdrop-blur-sm">
        <Link
          href="/"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-page"
          aria-label={t("task.backToList")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M14 6L8 12l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div className="flex items-center gap-2">
          <WhatsAppShareButton task={task} variant="icon" />
          <a
            href={`tel:${task.phone}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-page text-ink"
            aria-label={t("task.call")}
          >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 8a2 2 0 0 1 2-2h2.5l1 3.5-1.5 1.2a9 9 0 0 0 4 4L13 14l3.5 1H18a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2A12 12 0 0 1 4 8z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
          </a>
        </div>
      </div>

      <div className="px-4 pb-28 pt-4">
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${isPartner ? "badge-partner" : "badge-person"}`}>
            {t(`filters.category.${task.category}`)}
          </span>
          {task.lmkRequired && (
            <span className="rounded-full bg-page px-2.5 py-0.5 text-[11px] font-semibold text-ink">
              {t("task.lmkRequired")}
            </span>
          )}
        </div>

        <h1 className="page-title mt-3">{task.title}</h1>

        <div className="mt-4 overflow-hidden rounded-2xl bg-surface ring-1 ring-black/[0.04]">
          <PressableRow
            href={mapUrl}
            leading={
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-page text-xl leading-none">
                {task.emoji}
              </div>
            }
            title={task.place}
            subtitle={t("task.openIn2GisHint")}
          />
          <div className="mx-4 border-t border-line" />
          <PressableRow href={routeUrl} title={t("task.routeIn2Gis")} subtitle={t("brand.city")} />
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl bg-surface ring-1 ring-black/[0.04]">
          <PressableRow
            icon={<CalendarIcon />}
            title={task.timeLabel}
            subtitle={t("brand.city")}
            showChevron={false}
          />
          <div className="mx-4 border-t border-line" />
          <PressableRow
            icon={<ClockIcon />}
            title={formatDuration(task.durationHours)}
            subtitle={formatHourlyRate(task.pay, task.durationHours)}
            showChevron={false}
          />
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl bg-surface ring-1 ring-black/[0.04]">
          <PressableRow
            onClick={() => setSheet("pay")}
            title={t("task.pay")}
            value={`${task.pay.toLocaleString("ru-RU")} ₽`}
            valueClassName={accentClass}
          />
          <div className="mx-4 border-t border-line" />
          <PressableRow
            onClick={() => setSheet("payout")}
            title={t("task.payout")}
            subtitle={t("task.payoutHint")}
          />
        </div>

        {lines.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-2xl bg-surface ring-1 ring-black/[0.04]">
            <PressableRow onClick={() => setSheet("whatToDo")} title={t("task.whatToDo")} subtitle={t("task.whatToDoHint")} />
          </div>
        )}

        <div className="mt-3 overflow-hidden rounded-2xl bg-surface ring-1 ring-black/[0.04]">
          {isPartner && (
            <>
              <PressableRow
                onClick={() => setSheet("partner")}
                title={t("task.aboutPartner")}
                subtitle={t("home.fromPartner")}
              />
              <div className="mx-4 border-t border-line" />
            </>
          )}
          <PressableRow
            onClick={() => setSheet("contact")}
            title={t("task.contact")}
            subtitle={formatRuPhone(task.phone)}
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-line bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <TaskDetailActions
          taskId={task.id}
          taskTitle={task.title}
          publisherPhone={task.phone}
          status={task.status ?? "OPEN"}
          workerName={task.workerName}
          workerPhone={task.workerPhone}
          publisherCompletedAt={task.publisherCompletedAt}
          workerCompletedAt={task.workerCompletedAt}
          lmkRequired={task.lmkRequired}
        />
      </div>

      <DetailSheet open={sheet === "pay"} title={t("task.payBreakdown")} onClose={() => setSheet(null)}>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-ink">{formatDuration(task.durationHours)}</p>
              <p className="mt-0.5 text-[14px] text-muted">{t("task.durationLabel")}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-ink">{task.pay.toLocaleString("ru-RU")} ₽</p>
              <p className="mt-0.5 text-[14px] text-muted">
                {task.durationHours} ч × {hourlyRate.toLocaleString("ru-RU")} ₽/ч
              </p>
            </div>
          </div>
          <div className="border-t border-line pt-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink">{t("task.pay")}</p>
              <p className={`text-[18px] font-bold ${accentClass}`}>{task.pay.toLocaleString("ru-RU")} ₽</p>
            </div>
          </div>
        </div>
      </DetailSheet>

      <DetailSheet open={sheet === "payout"} title={t("task.payout")} onClose={() => setSheet(null)}>
        <ol className="space-y-4">
          {[
            { title: t("task.payoutStep1"), hint: t("task.payoutStep1Hint") },
            { title: t("task.payoutStep2"), hint: t("task.payoutStep2Hint") },
            { title: t("task.payoutStep3"), hint: t("task.payoutStep3Hint") },
          ].map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-page text-[13px] font-semibold text-ink">
                {index + 1}
              </span>
              <div>
                <p className="font-medium text-ink">{step.title}</p>
                <p className="mt-0.5 text-[14px] text-muted">{step.hint}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-[13px] text-muted">{t("task.payoutNote")}</p>
      </DetailSheet>

      <DetailSheet open={sheet === "whatToDo"} title={t("task.whatToDo")} onClose={() => setSheet(null)}>
        <ul className="space-y-3 text-[15px] leading-relaxed text-ink">
          {lines.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-muted">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </DetailSheet>

      <DetailSheet open={sheet === "partner"} title={t("task.aboutPartner")} onClose={() => setSheet(null)}>
        <p className="text-[15px] leading-relaxed text-ink">{t("task.partnerHint")}</p>
        <p className="mt-3 text-[14px] text-muted">{task.place}</p>
      </DetailSheet>

      <DetailSheet open={sheet === "contact"} title={t("task.contact")} onClose={() => setSheet(null)}>
        <p className="text-[20px] font-semibold text-ink">{formatRuPhone(task.phone)}</p>
        <p className="mt-2 text-[14px] text-muted">{t("task.contactHint")}</p>
        <a href={`tel:${task.phone}`} className="btn-gradient mt-4 block text-center text-[15px]">
          {t("task.call")}
        </a>
      </DetailSheet>
    </>
  );
}
