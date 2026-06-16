"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PartnerShiftManage } from "@/components/partner/PartnerShiftManage";
import { PartnerTaskActions } from "@/components/partner/PartnerTaskActions";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";
import { getTaskStatusBadge } from "@/lib/task-status";
import { formatRuPhone } from "@/lib/phone";
import type { Task } from "@/lib/types";
import { getPartnerInvite, partnerHeaders } from "@/lib/partner-session";
import { t } from "@/lib/i18n";

export default function PartnerTaskDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const taskId = params.id;
  const [task, setTask] = useState<Task | null>(null);
  const [storePhone, setStorePhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (!taskId) return;

    const code = getPartnerInvite();
    if (!code) {
      router.replace("/partner/login");
      return;
    }

    setLoading(true);
    fetch(`/api/partner/tasks/${taskId}`, { headers: partnerHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setTask(null);
          return;
        }
        setTask(data.task);
        setStorePhone(data.store?.phone ?? "");
        setError("");
      })
      .catch(() => setError(t("partner.loadError")))
      .finally(() => setLoading(false));
  }, [router, taskId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <p className="text-muted">{t("profile.loadingTasks")}</p>;
  }

  if (!task) {
    return (
      <div className="space-y-3">
        <Link href="/partner" className="text-[14px] font-medium text-brand">
          {t("partner.backToDashboard")}
        </Link>
        <p className="text-rose-600">{error || t("partner.shiftNotFound")}</p>
      </div>
    );
  }

  const badge = getTaskStatusBadge(task);

  return (
    <div className="space-y-4">
      <Link href="/partner" className="inline-block text-[14px] font-medium text-brand">
        {t("partner.backToDashboard")}
      </Link>

      <section className="info-card p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-page text-2xl">
            {task.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[20px] font-bold text-ink">{task.title}</h1>
            <p className="mt-1 text-[14px] text-muted">
              {task.place} · {t(`filters.category.${task.category}`)}
            </p>
            <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-[12px] font-semibold ${badge.className}`}>
              {badge.text}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-[14px]">
          <div className="rounded-xl bg-page px-3 py-2.5">
            <p className="text-muted">{t("task.pay")}</p>
            <p className="mt-0.5 font-semibold text-taiga">{task.pay.toLocaleString("ru-RU")} ₽</p>
          </div>
          <div className="rounded-xl bg-page px-3 py-2.5">
            <p className="text-muted">{t("post.dateLabel")}</p>
            <p className="mt-0.5 font-semibold text-ink">{task.timeLabel}</p>
          </div>
        </div>

        {task.description && (
          <div className="mt-4">
            <p className="text-[13px] font-medium text-muted">{t("post.descriptionLabel")}</p>
            <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-ink">{task.description}</p>
          </div>
        )}

        {task.lmkRequired && (
          <p className="mt-3 text-[13px] font-medium text-taiga">{t("task.lmkRequired")}</p>
        )}
      </section>

      {task.workerPhone ? (
        <section className="info-card p-4">
          <h2 className="text-[15px] font-semibold text-ink">{t("partner.worker")}</h2>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-ink">{task.workerName ?? t("profile.guest")}</p>
              <p className="text-[14px] text-muted">{formatRuPhone(task.workerPhone)}</p>
            </div>
            <Link
              href={`/partner/workers/${encodeURIComponent(task.workerPhone)}?from=${encodeURIComponent(`/partner/tasks/${task.id}`)}`}
              className="shrink-0 rounded-xl bg-brand-light px-3 py-2 text-[14px] font-semibold text-brand-dark"
            >
              {t("partner.viewProfile")}
            </Link>
          </div>
        </section>
      ) : (
        <section className="info-card px-4 py-4">
          <p className="text-[14px] text-muted">{t("partner.waitingWorker")}</p>
        </section>
      )}

      {task.status === "OPEN" && (
        <section className="info-card p-4">
          <h2 className="text-[15px] font-semibold text-ink">{t("partner.shareShift")}</h2>
          <p className="mt-1 text-[14px] text-muted">{t("share.partnerHint")}</p>
          <div className="mt-3">
            <WhatsAppShareButton task={task} />
          </div>
        </section>
      )}

      {task.status === "OPEN" && (
        <section className="info-card p-4">
          <h2 className="text-[15px] font-semibold text-ink">{t("task.manageOpen")}</h2>
          <div className="mt-3">
            <PartnerShiftManage taskId={task.id} storePhone={storePhone} onUpdated={load} />
          </div>
        </section>
      )}

      <section className="info-card p-4">
        <h2 className="text-[15px] font-semibold text-ink">{t("partner.manageShift")}</h2>
        <div className="mt-3">
          <PartnerTaskActions task={task} storePhone={storePhone} onUpdated={load} />
        </div>
      </section>
    </div>
  );
}
