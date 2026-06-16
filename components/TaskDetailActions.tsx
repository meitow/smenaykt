"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { legalDocPath } from "@/lib/legal";
import { useRouter } from "next/navigation";
import { DetailSheet } from "@/components/DetailSheet";
import { RuPhoneInput } from "@/components/RuPhoneInput";
import { formatRuPhone, isValidRuPhone, normalizeRuPhone } from "@/lib/phone";
import {
  userAwaitingCounterparty,
  userCanConfirmComplete,
} from "@/lib/task-completion";
import { PublisherTaskManage } from "@/components/PublisherTaskManage";
import { TaskReviewSheet } from "@/components/TaskReviewSheet";
import { getUserDisplayName, getUserPhone } from "@/lib/user-session";
import { t } from "@/lib/i18n";

type TaskDetailActionsProps = {
  taskId: string;
  taskTitle: string;
  publisherPhone: string;
  status: string;
  workerName?: string | null;
  workerPhone?: string | null;
  publisherCompletedAt?: string | null;
  workerCompletedAt?: string | null;
  lmkRequired?: boolean;
};

export function TaskDetailActions({
  taskId,
  taskTitle,
  publisherPhone,
  status,
  workerName,
  workerPhone,
  publisherCompletedAt,
  workerCompletedAt,
  lmkRequired = false,
}: TaskDetailActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhoneState] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [counterpartyName, setCounterpartyName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    const sync = () => {
      setUserName(getUserDisplayName());
      setUserPhoneState(getUserPhone());
    };
    sync();
    window.addEventListener("smenaykt_user_updated", sync);
    return () => window.removeEventListener("smenaykt_user_updated", sync);
  }, []);

  useEffect(() => {
    if (status !== "DONE" || !userPhone || !isValidRuPhone(userPhone)) {
      setCanReview(false);
      setAlreadyReviewed(false);
      return;
    }

    const participant =
      normalizeRuPhone(publisherPhone) === normalizeRuPhone(userPhone) ||
      (workerPhone && normalizeRuPhone(workerPhone) === normalizeRuPhone(userPhone));

    if (!participant) return;

    fetch(
      `/api/reviews?taskId=${encodeURIComponent(taskId)}&phone=${encodeURIComponent(userPhone)}`
    )
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (data: { canReview?: boolean; alreadyReviewed?: boolean; counterpartyName?: string } | null) => {
          if (!data) return;
          setCanReview(Boolean(data.canReview));
          setAlreadyReviewed(Boolean(data.alreadyReviewed));
          setCounterpartyName(data.counterpartyName ?? "");
        }
      )
      .catch(() => undefined);
  }, [status, userPhone, taskId, publisherPhone, workerPhone]);

  const profileReady =
    userName.trim() && userName.trim() !== "Гость" && isValidRuPhone(userPhone);
  const isWorker =
    workerPhone && userPhone && normalizeRuPhone(workerPhone) === normalizeRuPhone(userPhone);
  const isPublisher =
    userPhone && normalizeRuPhone(publisherPhone) === normalizeRuPhone(userPhone);
  const taskForComplete = {
    phone: publisherPhone,
    workerPhone,
    status,
    publisherCompletedAt,
    workerCompletedAt,
  };
  const canConfirmComplete = userPhone && userCanConfirmComplete(taskForComplete, userPhone);
  const awaitingCounterparty = userPhone && userAwaitingCounterparty(taskForComplete, userPhone);
  const isOpen = status === "OPEN";
  const isAccepted = status === "ACCEPTED";
  const isDone = status === "DONE";

  function closeConfirm() {
    setConfirmOpen(false);
    setTermsAccepted(false);
    setError("");
  }

  async function acceptTask() {
    if (!profileReady || loading || isPublisher || !termsAccepted) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/tasks/${taskId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerName: userName.trim(),
          workerPhone: userPhone,
        }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Ошибка");
        return;
      }

      closeConfirm();
      router.refresh();
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setLoading(false);
    }
  }

  async function submitReview() {
    if (!userPhone || !canReview) return;

    setReviewSubmitting(true);
    setReviewError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          reviewerPhone: userPhone,
          reviewerName: userName.trim(),
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
      setCanReview(false);
      setAlreadyReviewed(true);
      setReviewComment("");
      setReviewRating(5);
      router.refresh();
    } catch {
      setReviewError(t("profile.reviewError"));
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function confirmComplete() {
    if (!userPhone || completing) return;

    setError("");
    setCompleting(true);

    try {
      const res = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: userPhone }),
      });

      const data = (await res.json()) as { error?: string; waitingForCounterparty?: boolean };

      if (!res.ok) {
        setError(data.error ?? "Ошибка");
        return;
      }

      router.refresh();
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setCompleting(false);
    }
  }

  function completionStatusHint() {
    if (publisherCompletedAt && !workerCompletedAt) {
      return t("task.publisherConfirmed");
    }
    if (workerCompletedAt && !publisherCompletedAt) {
      return t("task.workerConfirmed");
    }
    return null;
  }

  const confirmPoints = [
    t("task.acceptConfirmPoint1"),
    t("task.acceptConfirmPoint2"),
    t("task.acceptConfirmPoint3"),
    t("task.acceptConfirmPoint4"),
    t("task.acceptConfirmPoint5"),
    ...(lmkRequired ? [t("task.acceptConfirmPointLmk")] : []),
  ];

  return (
    <>
      <div className="mx-auto max-w-lg space-y-2">
        {isOpen && isPublisher && (
          <>
            <div className="rounded-xl bg-page px-3 py-2.5 text-center text-[14px] text-ink">
              {t("task.ownTask")}
            </div>
            <PublisherTaskManage taskId={taskId} publisherPhone={publisherPhone} />
          </>
        )}

        {isOpen && !isPublisher && (
          <>
            {!profileReady && (
              <p className="text-center text-[14px] text-muted">
                {t("task.profileRequired")}{" "}
                <Link href="/profile" className="font-medium text-brand">
                  {t("nav.profile")}
                </Link>
              </p>
            )}
            {error && !confirmOpen && (
              <p className="text-center text-[14px] text-rose-600">{error}</p>
            )}
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={loading || !profileReady}
              className="btn-gradient disabled:opacity-50"
            >
              {t("task.take")}
            </button>
            <a href={`tel:${publisherPhone}`} className="btn-secondary block text-center">
              {t("task.call")}
            </a>
          </>
        )}

        {isAccepted && (isWorker || isPublisher) && (
          <>
            {isWorker && (
              <div className="rounded-xl bg-brand-light/50 px-3 py-2.5 text-center text-[14px] text-brand-dark">
                {t("task.youAccepted")}
              </div>
            )}
            {isPublisher && workerPhone && (
              <div className="rounded-xl bg-page px-3 py-2.5 text-center text-[14px] text-ink">
                {t("task.workerAccepted", { name: workerName ?? t("profile.guest") })}
                <span className="mt-1 block font-semibold">{formatRuPhone(workerPhone)}</span>
              </div>
            )}
            {completionStatusHint() && (
              <p className="text-center text-[14px] text-muted">{completionStatusHint()}</p>
            )}
            {awaitingCounterparty && (
              <div className="rounded-xl bg-page px-3 py-2.5 text-center text-[14px] text-muted">
                {t("profile.waitingCounterparty")}
              </div>
            )}
            {canConfirmComplete && (
              <button
                type="button"
                onClick={confirmComplete}
                disabled={completing}
                className="btn-gradient disabled:opacity-50"
              >
                {completing ? t("profile.completing") : t("task.confirmComplete")}
              </button>
            )}
            {error && <p className="text-center text-[14px] text-rose-600">{error}</p>}
            <a
              href={`tel:${isWorker ? publisherPhone : workerPhone ?? publisherPhone}`}
              className="btn-secondary block text-center"
            >
              {isWorker ? t("task.callPublisher") : t("task.callWorker")}
            </a>
          </>
        )}

        {isDone && isWorker && (
          <>
            <div className="rounded-xl bg-brand-light/50 px-3 py-2.5 text-center text-[14px] text-brand-dark">
              {t("task.taskClosed")}
            </div>
            {alreadyReviewed && (
              <p className="text-center text-[14px] text-muted">{t("task.reviewSubmitted")}</p>
            )}
            {canReview && (
              <button
                type="button"
                onClick={() => {
                  setReviewOpen(true);
                  setReviewError("");
                }}
                className="btn-secondary w-full"
              >
                {t("task.reviewPublisher")}
              </button>
            )}
            <a href={`tel:${publisherPhone}`} className="btn-gradient block text-center">
              {t("task.callPublisher")}
            </a>
          </>
        )}

        {isDone && isPublisher && workerPhone && (
          <>
            <div className="rounded-xl bg-page px-3 py-2.5 text-center text-[14px] text-ink">
              {t("task.taskClosed")}
            </div>
            {alreadyReviewed && (
              <p className="text-center text-[14px] text-muted">{t("task.reviewSubmitted")}</p>
            )}
            {canReview && (
              <button
                type="button"
                onClick={() => {
                  setReviewOpen(true);
                  setReviewError("");
                }}
                className="btn-secondary w-full"
              >
                {t("task.reviewWorker")}
              </button>
            )}
            <a href={`tel:${workerPhone}`} className="btn-gradient block text-center">
              {t("task.callWorker")}
            </a>
          </>
        )}

        {isAccepted && !isWorker && !isPublisher && (
          <div className="rounded-xl bg-page px-3 py-2.5 text-center text-[14px] text-muted">
            {t("task.alreadyTaken")}
          </div>
        )}
      </div>

      <DetailSheet
        open={confirmOpen}
        title={t("task.acceptConfirmTitle")}
        onClose={closeConfirm}
        footer={
          <div className="mt-4 space-y-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-page px-3 py-3">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-line accent-brand"
              />
              <span className="text-[14px] leading-snug text-ink">
                {t("task.acceptTermsPrefix")}{" "}
                <Link
                  href={legalDocPath("offer")}
                  className="font-semibold text-brand underline underline-offset-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {t("task.acceptTermsLink")}
                </Link>{" "}
                {t("task.acceptTermsSuffix")}
              </span>
            </label>
            {error && <p className="text-center text-[14px] text-rose-600">{error}</p>}
            <button
              type="button"
              onClick={acceptTask}
              disabled={loading || !termsAccepted}
              className="btn-gradient w-full disabled:opacity-50"
            >
              {loading ? t("task.accepting") : t("task.acceptConfirmButton")}
            </button>
            <button type="button" onClick={closeConfirm} className="btn-secondary w-full !py-3 text-[15px]">
              {t("task.acceptCancel")}
            </button>
          </div>
        }
      >
        <p className="text-[15px] leading-relaxed text-muted">{t("task.acceptConfirmIntro")}</p>
        <ul className="mt-4 space-y-3">
          {confirmPoints.map((point) => (
            <li key={point} className="flex gap-2.5 text-[14px] leading-relaxed text-ink">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </DetailSheet>

      <TaskReviewSheet
        open={reviewOpen}
        taskTitle={taskTitle}
        counterpartyName={counterpartyName}
        rating={reviewRating}
        comment={reviewComment}
        submitting={reviewSubmitting}
        error={reviewError}
        onClose={() => setReviewOpen(false)}
        onSubmit={submitReview}
        onRatingChange={setReviewRating}
        onCommentChange={setReviewComment}
      />
    </>
  );
}

export function ProfilePhoneField({
  value,
  onChange,
}: {
  value: string;
  onChange: (phone: string) => void;
}) {
  return (
    <RuPhoneInput
      value={value}
      onChange={onChange}
      label={t("profile.phoneLabel")}
      hint={t("profile.phoneHint")}
      invalidHint={t("profile.phoneInvalidSave")}
    />
  );
}
