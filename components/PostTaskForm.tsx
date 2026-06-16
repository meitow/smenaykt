"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DateField } from "@/components/DateField";
import { TimeField } from "@/components/TimeField";
import { EmojiPicker } from "@/components/EmojiPicker";
import { PhoneField } from "@/components/PhoneField";
import { StickyActionBar } from "@/components/StickyActionBar";
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

const FORM_ID = "post-task-form";

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
    <>
      <form id={FORM_ID} onSubmit={onSubmit} className="space-y-5 pb-36">
        <fieldset disabled={loading} className="space-y-5 disabled:opacity-60">
          <div className="info-card p-4">
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>

          <div className="info-card space-y-5 p-4">
            <label className="block">
              <span className="field-label">{t("post.titleLabel")}</span>
              <input
                name="title"
                required
                placeholder={t("post.titlePlaceholder")}
                className="input-field"
                autoComplete="off"
              />
            </label>

            <label className="block">
              <span className="field-label">{t("post.descriptionLabel")}</span>
              <p className="field-hint">{t("post.descriptionHint")}</p>
              <textarea
                name="description"
                rows={6}
                required
                placeholder={t("post.descriptionPlaceholder")}
                className="input-field min-h-[9.5rem] resize-y"
              />
            </label>

            <label className="block">
              <span className="field-label">{t("post.payLabel")}</span>
              <input
                name="pay"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                minLength={3}
                maxLength={7}
                placeholder="2500"
                className="input-field"
                autoComplete="off"
              />
            </label>

            <label className="block">
              <span className="field-label">{t("post.placeLabel")}</span>
              <input
                name="place"
                required
                placeholder={t("post.placePlaceholder")}
                className="input-field"
                autoComplete="street-address"
              />
            </label>

            <label className="block">
              <span className="field-label">{t("post.categoryLabel")}</span>
              <p className="field-hint">{t("post.categoryHint")}</p>
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
              <div className="block">
                <span className="field-label">{t("post.dateLabel")}</span>
                <DateField
                  name="scheduledAt"
                  required
                  value={scheduledDate}
                  onChange={setScheduledDate}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="field-label">{t("post.timeStartLabel")}</span>
                  <TimeField
                    name="timeStart"
                    required
                    value={timeStart}
                    onChange={setTimeStart}
                    title={t("post.timeStartLabel")}
                  />
                </label>
                <label className="block">
                  <span className="field-label">{t("post.timeEndLabel")}</span>
                  <TimeField
                    name="timeEnd"
                    required
                    value={timeEnd}
                    onChange={setTimeEnd}
                    title={t("post.timeEndLabel")}
                  />
                </label>
              </div>
            </div>

            <PhoneField defaultValue={profilePhone} onValidityChange={setPhoneValid} />
          </div>
        </fieldset>
      </form>

      <StickyActionBar>
        {error ? <p className="mb-2 text-[14px] leading-snug text-rose-600">{error}</p> : null}
        <button
          type="submit"
          form={FORM_ID}
          disabled={loading || !phoneValid}
          className="btn-gradient disabled:opacity-50"
        >
          {loading ? t("post.publishing") : t("actions.postHelp")}
        </button>
      </StickyActionBar>
    </>
  );
}
