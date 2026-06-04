"use client";

import { DetailSheet } from "@/components/DetailSheet";
import { StarRating } from "@/components/StarRating";
import { t } from "@/lib/i18n";

type TaskReviewSheetProps = {
  open: boolean;
  taskTitle: string;
  counterpartyName: string;
  rating: number;
  comment: string;
  submitting: boolean;
  error: string;
  onClose: () => void;
  onSubmit: () => void;
  onRatingChange: (value: number) => void;
  onCommentChange: (value: string) => void;
};

export function TaskReviewSheet({
  open,
  taskTitle,
  counterpartyName,
  rating,
  comment,
  submitting,
  error,
  onClose,
  onSubmit,
  onRatingChange,
  onCommentChange,
}: TaskReviewSheetProps) {
  return (
    <DetailSheet
      open={open}
      title={t("profile.reviewSheetTitle")}
      onClose={onClose}
      footer={
        <div className="mt-4 space-y-3">
          {error && <p className="text-center text-[14px] text-rose-600">{error}</p>}
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || rating < 1}
            className="btn-gradient w-full disabled:opacity-50"
          >
            {submitting ? t("profile.reviewSubmitting") : t("profile.reviewSubmit")}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary w-full !py-3 text-[15px]">
            {t("task.acceptCancel")}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="font-medium text-ink">{taskTitle}</p>
          <p className="mt-1 text-[14px] text-muted">{t("profile.reviewFor", { name: counterpartyName })}</p>
        </div>
        <div>
          <p className="text-[15px] font-medium text-muted">{t("profile.reviewRatingLabel")}</p>
          <StarRating value={rating} onChange={onRatingChange} className="mt-2" />
        </div>
        <label className="block">
          <span className="text-[15px] font-medium text-muted">{t("profile.reviewCommentLabel")}</span>
          <textarea
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder={t("profile.reviewCommentPlaceholder")}
            rows={4}
            maxLength={500}
            className="input-field resize-none"
          />
        </label>
      </div>
    </DetailSheet>
  );
}
