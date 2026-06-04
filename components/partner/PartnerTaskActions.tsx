"use client";

import { useEffect, useState } from "react";
import { DetailSheet } from "@/components/DetailSheet";
import { StarRating } from "@/components/StarRating";
import {
  userAwaitingCounterparty,
  userCanConfirmComplete,
} from "@/lib/task-completion";
import type { Task } from "@/lib/types";
import { getPartnerPhone } from "@/lib/partner-session";
import { t } from "@/lib/i18n";

type PartnerTaskActionsProps = {
  task: Task;
  storePhone: string;
  onUpdated: () => void;
};

export function PartnerTaskActions({ task, storePhone, onUpdated }: PartnerTaskActionsProps) {
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [pendingReview, setPendingReview] = useState(false);

  const phone = storePhone || getPartnerPhone() || task.phone;
  const taskParties = {
    phone: task.phone,
    workerPhone: task.workerPhone,
    status: task.status ?? "OPEN",
    publisherCompletedAt: task.publisherCompletedAt,
    workerCompletedAt: task.workerCompletedAt,
  };

  const canComplete = userCanConfirmComplete(taskParties, phone);
  const awaitingCounterparty = userAwaitingCounterparty(taskParties, phone);
  const isDone = task.status === "DONE";
  const hasWorker = Boolean(task.workerPhone);

  useEffect(() => {
    if (!isDone || !phone) return;

    fetch(`/api/profile?phone=${encodeURIComponent(phone)}&limit=20`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { pendingReviews?: { taskId: string }[] } | null) => {
        if (!data) return;
        setPendingReview((data.pendingReviews ?? []).some((item) => item.taskId === task.id));
      })
      .catch(() => setPendingReview(false));
  }, [isDone, phone, task.id]);

  async function confirmComplete() {
    setError("");
    setCompleting(true);

    try {
      const res = await fetch(`/api/tasks/${task.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Ошибка");
        return;
      }

      onUpdated();
    } catch {
      setError(t("profile.completeError"));
    } finally {
      setCompleting(false);
    }
  }

  async function submitReview() {
    if (!task.workerPhone) return;

    setReviewSubmitting(true);
    setReviewError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          reviewerPhone: phone,
          reviewerName: t("partner.storeReviewer"),
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setReviewError(data.error ?? "Ошибка");
        return;
      }

      setReviewOpen(false);
      setPendingReview(false);
      onUpdated();
    } catch {
      setReviewError(t("profile.reviewError"));
    } finally {
      setReviewSubmitting(false);
    }
  }

  if (!hasWorker && task.status === "OPEN") {
    return (
      <div className="rounded-xl bg-page px-4 py-3 text-[14px] text-muted">
        {t("partner.waitingWorker")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {task.status === "ACCEPTED" && (
        <>
          {task.publisherCompletedAt && !task.workerCompletedAt && (
            <p className="text-[14px] text-muted">{t("task.publisherConfirmed")}</p>
          )}
          {task.workerCompletedAt && !task.publisherCompletedAt && (
            <p className="text-[14px] text-muted">{t("task.workerConfirmed")}</p>
          )}
          {awaitingCounterparty && (
            <div className="rounded-xl bg-page px-4 py-3 text-center text-[14px] text-muted">
              {t("profile.waitingCounterparty")}
            </div>
          )}
          {canComplete && (
            <button
              type="button"
              onClick={confirmComplete}
              disabled={completing}
              className="btn-gradient disabled:opacity-50"
            >
              {completing ? t("profile.completing") : t("task.confirmComplete")}
            </button>
          )}
        </>
      )}

      {isDone && (
        <div className="rounded-xl bg-taiga-light/40 px-4 py-3 text-center text-[14px] text-taiga-dark">
          {t("task.taskClosed")}
        </div>
      )}

      {isDone && task.workerPhone && pendingReview && (
        <button type="button" onClick={() => setReviewOpen(true)} className="btn-secondary">
          {t("partner.reviewWorker")}
        </button>
      )}

      {error && <p className="text-[14px] text-rose-600">{error}</p>}

      <DetailSheet
        open={reviewOpen}
        title={t("partner.reviewWorkerTitle")}
        onClose={() => setReviewOpen(false)}
        footer={
          <div className="mt-4 space-y-3">
            {reviewError && <p className="text-center text-[14px] text-rose-600">{reviewError}</p>}
            <button
              type="button"
              onClick={submitReview}
              disabled={reviewSubmitting}
              className="btn-gradient w-full disabled:opacity-50"
            >
              {reviewSubmitting ? t("profile.reviewSubmitting") : t("profile.reviewSubmit")}
            </button>
            <button type="button" onClick={() => setReviewOpen(false)} className="btn-secondary w-full !py-3">
              {t("task.acceptCancel")}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-[15px] text-ink">
            {t("partner.reviewWorkerHint", { name: task.workerName ?? t("profile.guest") })}
          </p>
          <div>
            <p className="text-[15px] font-medium text-muted">{t("profile.reviewRatingLabel")}</p>
            <StarRating value={reviewRating} onChange={setReviewRating} className="mt-2" />
          </div>
          <label className="block">
            <span className="text-[15px] font-medium text-muted">{t("profile.reviewCommentLabel")}</span>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder={t("partner.reviewWorkerPlaceholder")}
              className="input-field resize-none"
            />
          </label>
        </div>
      </DetailSheet>
    </div>
  );
}
