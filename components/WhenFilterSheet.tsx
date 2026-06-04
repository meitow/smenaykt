"use client";

import { useEffect, useState } from "react";
import { SheetPortal } from "@/components/SheetPortal";
import { defaultDateValue, formatDateLabel } from "@/lib/datetime";
import { TIME_FILTERS, type TimeFilter } from "@/lib/task-filters";
import { t } from "@/lib/i18n";

type WhenFilterSheetProps = {
  open: boolean;
  when: TimeFilter;
  scheduledDate: string;
  onClose: () => void;
  onConfirm: (when: TimeFilter, scheduledDate: string) => void;
};

export function WhenFilterSheet({
  open,
  when,
  scheduledDate,
  onClose,
  onConfirm,
}: WhenFilterSheetProps) {
  const [draftWhen, setDraftWhen] = useState(when);
  const [draftDate, setDraftDate] = useState(scheduledDate || defaultDateValue());
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setDraftWhen(when);
      setDraftDate(scheduledDate || defaultDateValue());
      setVisible(true);
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }

    const timer = setTimeout(() => setVisible(false), 220);
    return () => clearTimeout(timer);
  }, [open, when, scheduledDate]);

  if (!visible && !open) return null;

  const presetOptions = TIME_FILTERS.filter((id) => id !== "date").map((id) => ({
    id,
    label: t(`filters.when.${id}`),
  }));

  function apply() {
    if (draftWhen === "date" && !draftDate) return;
    onConfirm(draftWhen, draftWhen === "date" ? draftDate : "");
  }

  return (
    <SheetPortal>
    <div className={`fixed inset-0 z-[100] ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`absolute bottom-0 left-0 right-0 transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="relative z-[101] mx-auto max-w-lg rounded-t-3xl bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-card ring-1 ring-black/[0.06]">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
          <h2 className="text-[17px] font-bold text-ink">{t("filters.whenLabel")}</h2>

          <ul className="mt-3 max-h-[34vh] overflow-y-auto">
            {presetOptions.map((option) => {
              const selected = draftWhen === option.id;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => setDraftWhen(option.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[16px] transition ${
                      selected ? "bg-brand-light font-semibold text-brand-dark" : "text-ink active:bg-page"
                    }`}
                  >
                    <span>{option.label}</span>
                    {selected && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-brand" aria-hidden>
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-3 rounded-xl border border-line bg-page/40 p-3">
            <button
              type="button"
              onClick={() => setDraftWhen("date")}
              className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[16px] ${
                draftWhen === "date" ? "font-semibold text-brand-dark" : "text-ink"
              }`}
            >
              <span>{t("filters.when.date")}</span>
              {draftWhen === "date" && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-brand" aria-hidden>
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <label className="mt-2 block">
              <input
                type="date"
                value={draftDate}
                onChange={(e) => {
                  setDraftDate(e.target.value);
                  setDraftWhen("date");
                }}
                className="input-field !mt-0"
              />
              {draftDate && (
                <p className="mt-1.5 text-[13px] text-muted">{formatDateLabel(draftDate)}</p>
              )}
            </label>
          </div>

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 !py-3 text-[15px]">
              {t("filters.cancel")}
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={draftWhen === "date" && !draftDate}
              className="btn-primary flex-1 !py-3 text-[15px] disabled:opacity-50"
            >
              {t("filters.apply")}
            </button>
          </div>
        </div>
      </div>
    </div>
    </SheetPortal>
  );
}
