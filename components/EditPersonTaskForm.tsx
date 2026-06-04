"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EmojiPicker } from "@/components/EmojiPicker";
import {
  defaultTimeValue,
  durationHoursFromRange,
  formatScheduleLabel,
} from "@/lib/datetime";
import {
  LEGACY_PERSONAL_CATEGORIES,
  PERSONAL_DEFAULT_CATEGORY,
  type PersonPostCategory,
  normalizeCategory,
} from "@/lib/categories";
import { defaultTimesFromTask, scheduledDateFromIso } from "@/lib/task-mutations";
import type { Task } from "@/lib/types";
import { getUserPhone } from "@/lib/user-session";
import { t } from "@/lib/i18n";

type EditPersonTaskFormProps = {
  task: Task;
};

export function EditPersonTaskForm({ task }: EditPersonTaskFormProps) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const times = defaultTimesFromTask(task.timeLabel, task.scheduledAt);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emoji, setEmoji] = useState(task.emoji);
  const [category, setCategory] = useState<PersonPostCategory>(
    (normalizeCategory(task.category) as PersonPostCategory) ?? PERSONAL_DEFAULT_CATEGORY
  );
  const [scheduledDate, setScheduledDate] = useState(
    scheduledDateFromIso(task.scheduledAt) || scheduledDateFromIso(new Date().toISOString())
  );
  const [timeStart, setTimeStart] = useState(times.start);
  const [timeEnd, setTimeEnd] = useState(times.end);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current) return;

    const phone = getUserPhone();
    if (!phone) {
      setError(t("profile.phoneRequired"));
      return;
    }

    if (!scheduledDate) {
      setError(t("post.dateRequired"));
      return;
    }

    const durationHours = durationHoursFromRange(timeStart, timeEnd);
    if (!durationHours) {
      setError(t("post.timeRangeInvalid"));
      return;
    }

    setError("");
    const form = new FormData(e.currentTarget);
    submittingRef.current = true;
    setLoading(true);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
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
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Ошибка");
        return;
      }

      router.push(`/tasks/${task.id}`);
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
            <input
              name="title"
              required
              defaultValue={task.title}
              className="input-field"
            />
          </label>

          <label className="block">
            <span className="text-[15px] font-medium text-muted">{t("post.descriptionLabel")}</span>
            <textarea
              name="description"
              rows={5}
              required
              defaultValue={task.description}
              className="input-field resize-none"
            />
          </label>

          <label className="block">
            <span className="text-[15px] font-medium text-muted">{t("post.payLabel")}</span>
            <input
              name="pay"
              type="number"
              required
              min={100}
              max={1000000}
              defaultValue={task.pay}
              className="input-field"
            />
          </label>

          <label className="block">
            <span className="text-[15px] font-medium text-muted">{t("post.placeLabel")}</span>
            <input name="place" required defaultValue={task.place} className="input-field" />
          </label>

          <label className="block">
            <span className="text-[15px] font-medium text-muted">{t("post.categoryLabel")}</span>
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
                  type="time"
                  required
                  value={timeEnd}
                  onChange={(e) => setTimeEnd(e.target.value)}
                  className="input-field"
                />
              </label>
            </div>
          </div>
        </div>

        {error && <p className="text-[15px] text-rose-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-gradient disabled:opacity-50">
          {loading ? t("task.saving") : t("task.saveChanges")}
        </button>
      </fieldset>
    </form>
  );
}
