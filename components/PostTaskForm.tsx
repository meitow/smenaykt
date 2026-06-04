"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EmojiPicker } from "@/components/EmojiPicker";
import { PhoneField } from "@/components/PhoneField";
import {
  combineDateAndTime,
  defaultDateValue,
  defaultTimeValue,
  durationHoursFromRange,
  formatScheduleLabel,
} from "@/lib/datetime";
import { isValidRuPhone, normalizeRuPhone } from "@/lib/phone";
import { getUserPhone, setUserPhone } from "@/lib/user-session";
import {
  LEGACY_PERSONAL_CATEGORIES,
  PERSONAL_DEFAULT_CATEGORY,
  type PersonPostCategory,
} from "@/lib/categories";
import { t } from "@/lib/i18n";

export function PostTaskForm() {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emoji, setEmoji] = useState("❄️");
  const [category, setCategory] = useState<PersonPostCategory>(PERSONAL_DEFAULT_CATEGORY);
  const [phoneValid, setPhoneValid] = useState(false);
  const [profilePhone, setProfilePhone] = useState("");
  const [scheduledDate, setScheduledDate] = useState(defaultDateValue);
  const [timeStart, setTimeStart] = useState(defaultTimeValue(10));
  const [timeEnd, setTimeEnd] = useState(defaultTimeValue(12));

  useEffect(() => {
    setProfilePhone(getUserPhone());
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current) return;

    setError("");
    const form = new FormData(e.currentTarget);
    const phoneRaw = String(form.get("phoneNormalized") ?? "");
    const phone = normalizeRuPhone(phoneRaw);

    if (!phone || !isValidRuPhone(phone)) {
      setError(t("post.phoneInvalid"));
      return;
    }

    if (!scheduledDate) {
      setError(t("post.dateRequired"));
      return;
    }

    const durationHours = durationHoursFromRange(timeStart, timeEnd);
    const scheduledAt = combineDateAndTime(scheduledDate, timeStart);

    if (!durationHours || !scheduledAt) {
      setError(t("post.timeRangeInvalid"));
      return;
    }

    submittingRef.current = true;
    setLoading(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          description: form.get("description"),
          pay: form.get("pay"),
          place: form.get("place"),
          scheduledAt: scheduledDate,
          timeStart,
          timeEnd,
          timeLabel: formatScheduleLabel(scheduledDate, timeStart, timeEnd),
          durationHours,
          phone,
          emoji,
          category,
        }),
      });

      const data = (await res.json()) as { id?: string; error?: string };

      if (!res.ok || !data.id) {
        setError(data.error ?? "Ошибка");
        return;
      }

      setUserPhone(phone);
      router.push(`/tasks/${data.id}`);
      router.refresh();
    } catch {
      setError("Нет связи с сервером");
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
            <span className="text-[15px] font-medium text-muted">{t("post.titleLabel")}</span>
            <input name="title" required placeholder={t("post.titlePlaceholder")} className="input-field" />
          </label>

          <label className="block">
            <span className="text-[15px] font-medium text-muted">{t("post.descriptionLabel")}</span>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{t("post.descriptionHint")}</p>
            <textarea
              name="description"
              rows={5}
              required
              placeholder={t("post.descriptionPlaceholder")}
              className="input-field resize-none"
            />
          </label>

          <label className="block">
            <span className="text-[15px] font-medium text-muted">{t("post.payLabel")}</span>
            <input name="pay" type="number" required min={100} max={1000000} placeholder="2500" className="input-field" />
          </label>

          <label className="block">
            <span className="text-[15px] font-medium text-muted">{t("post.placeLabel")}</span>
            <input name="place" required placeholder={t("post.placePlaceholder")} className="input-field" />
          </label>

          <label className="block">
            <span className="text-[15px] font-medium text-muted">{t("post.categoryLabel")}</span>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{t("post.categoryHint")}</p>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PersonPostCategory)}
              className="input-field"
            >
              <option value={PERSONAL_DEFAULT_CATEGORY}>{t("filters.category.personal")}</option>
              <optgroup label={t("post.categoryOptionalGroup")}>
                {LEGACY_PERSONAL_CATEGORIES.map((id) => (
                  <option key={id} value={id}>
                    {t(`filters.category.${id}`)}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>

          <div className="space-y-3">
            <label className="block">
              <span className="text-[15px] font-medium text-muted">{t("post.dateLabel")}</span>
              <input
                name="scheduledAt"
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
                <input
                  name="timeStart"
                  type="time"
                  required
                  value={timeStart}
                  onChange={(e) => setTimeStart(e.target.value)}
                  className="input-field"
                />
              </label>
              <label className="block">
                <span className="text-[15px] font-medium text-muted">{t("post.timeEndLabel")}</span>
                <input
                  name="timeEnd"
                  type="time"
                  required
                  value={timeEnd}
                  onChange={(e) => setTimeEnd(e.target.value)}
                  className="input-field"
                />
              </label>
            </div>
          </div>

          <PhoneField defaultValue={profilePhone} onValidityChange={setPhoneValid} />
        </div>

        {error && <p className="text-[15px] text-rose-600">{error}</p>}
        <button type="submit" disabled={loading || !phoneValid} className="btn-gradient disabled:opacity-50">
          {loading ? t("post.publishing") : t("actions.postHelp")}
        </button>
      </fieldset>
    </form>
  );
}
