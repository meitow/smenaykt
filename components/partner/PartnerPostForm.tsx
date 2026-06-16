"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EmojiPicker } from "@/components/EmojiPicker";
import { TimeField } from "@/components/TimeField";
import {
  combineDateAndTime,
  defaultDateValue,
  defaultTimeValue,
  durationHoursFromRange,
  formatScheduleLabel,
} from "@/lib/datetime";
import {
  PARTNER_DEFAULT_CATEGORY,
  PARTNER_TASK_CATEGORY_GROUPS,
  type PartnerOnlyCategory,
} from "@/lib/categories";
import { getPartnerInvite, partnerHeaders } from "@/lib/partner-session";
import { t } from "@/lib/i18n";

type PartnerPostFormProps = {
  defaultPlace?: string;
};

export function PartnerPostForm({ defaultPlace = "" }: PartnerPostFormProps) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emoji, setEmoji] = useState("🛒");
  const [category, setCategory] = useState<PartnerOnlyCategory>(PARTNER_DEFAULT_CATEGORY);
  const [lmkRequired, setLmkRequired] = useState(true);
  const [scheduledDate, setScheduledDate] = useState(defaultDateValue);
  const [timeStart, setTimeStart] = useState(defaultTimeValue(9));
  const [timeEnd, setTimeEnd] = useState(defaultTimeValue(18));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current) return;

    const inviteCode = getPartnerInvite();
    if (!inviteCode) {
      router.replace("/partner/login");
      return;
    }

    setError("");
    const form = new FormData(e.currentTarget);

    if (!scheduledDate) {
      setError(t("post.dateRequired"));
      return;
    }

    const durationHours = durationHoursFromRange(timeStart, timeEnd);
    if (!durationHours) {
      setError(t("post.timeRangeInvalid"));
      return;
    }

    submittingRef.current = true;
    setLoading(true);

    try {
      const res = await fetch("/api/partner/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...partnerHeaders(),
        },
        body: JSON.stringify({
          inviteCode,
          title: form.get("title"),
          description: form.get("description"),
          pay: form.get("pay"),
          place: form.get("place"),
          scheduledAt: scheduledDate,
          timeStart,
          timeEnd,
          timeLabel: formatScheduleLabel(scheduledDate, timeStart, timeEnd),
          durationHours,
          emoji,
          category,
          lmkRequired,
        }),
      });

      const data = (await res.json()) as { id?: string; error?: string };

      if (!res.ok || !data.id) {
        setError(data.error ?? "Ошибка");
        return;
      }

      router.push(`/partner/tasks/${data.id}`);
    } catch {
      setError(t("partner.postError"));
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <fieldset disabled={loading} className="space-y-5 disabled:opacity-60">
        <div className="info-card p-4">
          <EmojiPicker value={emoji} onChange={setEmoji} />
        </div>

        <div className="info-card space-y-5 p-4">
          <label className="block">
            <span className="text-[15px] font-medium text-muted">{t("partner.postTitleLabel")}</span>
            <input
              name="title"
              required
              placeholder={t("partner.postTitlePlaceholder")}
              className="input-field"
            />
          </label>

          <label className="block">
            <span className="text-[15px] font-medium text-muted">{t("post.descriptionLabel")}</span>
            <textarea
              name="description"
              rows={4}
              required
              placeholder={t("partner.postDescriptionPlaceholder")}
              className="input-field resize-none"
            />
          </label>

          <label className="block">
            <span className="text-[15px] font-medium text-muted">{t("post.categoryLabel")}</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PartnerOnlyCategory)}
              className="input-field"
            >
              {PARTNER_TASK_CATEGORY_GROUPS.map((group) => (
                <optgroup key={group.id} label={t(`filters.categoryGroup.${group.id}`)}>
                  {group.categories.map((id) => (
                    <option key={id} value={id}>
                      {t(`filters.category.${id}`)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[15px] font-medium text-muted">{t("post.payLabel")}</span>
            <input name="pay" type="number" required min={100} max={1000000} placeholder="3200" className="input-field" />
          </label>

          <label className="block">
            <span className="text-[15px] font-medium text-muted">{t("post.placeLabel")}</span>
            <input
              name="place"
              required
              defaultValue={defaultPlace}
              placeholder={t("partner.postPlacePlaceholder")}
              className="input-field"
            />
          </label>

          <div className="space-y-3">
            <label className="block">
              <span className="text-[15px] font-medium text-muted">{t("post.dateLabel")}</span>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="input-field"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[15px] font-medium text-muted">{t("post.timeStartLabel")}</span>
                <TimeField required value={timeStart} onChange={setTimeStart} />
              </label>
              <label className="block">
                <span className="text-[15px] font-medium text-muted">{t("post.timeEndLabel")}</span>
                <TimeField required value={timeEnd} onChange={setTimeEnd} />
              </label>
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-xl bg-page px-3 py-3">
            <input
              type="checkbox"
              checked={lmkRequired}
              onChange={(e) => setLmkRequired(e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded border-line accent-taiga"
            />
            <span className="text-[14px] leading-snug text-ink">{t("partner.lmkRequired")}</span>
          </label>
        </div>

        {error && <p className="text-[15px] text-rose-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-gradient disabled:opacity-50">
          {loading ? t("post.publishing") : t("partner.publishShift")}
        </button>
      </fieldset>
    </form>
  );
}
