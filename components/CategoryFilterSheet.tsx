"use client";

import { useEffect, useState } from "react";
import { SheetPortal } from "@/components/SheetPortal";
import {
  TASK_CATEGORY_GROUPS,
  categoryGroupLabelKey,
  type TaskCategory,
} from "@/lib/categories";
import { t } from "@/lib/i18n";

type CategoryFilterSheetProps = {
  open: boolean;
  value: TaskCategory | "all";
  onClose: () => void;
  onConfirm: (value: TaskCategory | "all") => void;
};

export function CategoryFilterSheet({ open, value, onClose, onConfirm }: CategoryFilterSheetProps) {
  const [draft, setDraft] = useState(value);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setDraft(value);
      setVisible(true);
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }

    const timer = setTimeout(() => setVisible(false), 220);
    return () => clearTimeout(timer);
  }, [open, value]);

  if (!visible && !open) return null;

  return (
    <SheetPortal>
    <div className={`fixed inset-0 z-[100] ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
      <button
        type="button"
        aria-label={t("filters.cancel")}
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
          <h2 className="text-[17px] font-bold text-ink">{t("filters.serviceType")}</h2>

          <ul className="mt-3 max-h-[58vh] overflow-y-auto">
            <li>
              <button
                type="button"
                onClick={() => setDraft("all")}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[16px] transition ${
                  draft === "all" ? "bg-brand-light font-semibold text-brand-dark" : "text-ink active:bg-page"
                }`}
              >
                <span>{t("filters.category.all")}</span>
                {draft === "all" && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-brand" aria-hidden>
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </li>

            {TASK_CATEGORY_GROUPS.map((group) => (
              <li key={group.id} className="mt-2">
                <p className="px-3 pb-1 pt-2 text-[12px] font-semibold uppercase tracking-wide text-muted">
                  {t(categoryGroupLabelKey(group.id))}
                </p>
                <ul>
                  {group.categories.map((id) => {
                    const selected = draft === id;
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => setDraft(id)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[16px] transition ${
                            selected ? "bg-brand-light font-semibold text-brand-dark" : "text-ink active:bg-page"
                          }`}
                        >
                          <span>{t(`filters.category.${id}`)}</span>
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
              </li>
            ))}
          </ul>

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 !py-3 text-[15px]">
              {t("filters.cancel")}
            </button>
            <button type="button" onClick={() => onConfirm(draft)} className="btn-primary flex-1 !py-3 text-[15px]">
              {t("filters.apply")}
            </button>
          </div>
        </div>
      </div>
    </div>
    </SheetPortal>
  );
}
