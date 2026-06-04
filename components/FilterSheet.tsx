"use client";

import { useEffect, useState } from "react";
import { SheetPortal } from "@/components/SheetPortal";
import { t } from "@/lib/i18n";

type FilterSheetProps<T extends string> = {
  open: boolean;
  title: string;
  value: T;
  options: { id: T; label: string }[];
  onClose: () => void;
  onConfirm: (value: T) => void;
};

export function FilterSheet<T extends string>({
  open,
  title,
  value,
  options,
  onClose,
  onConfirm,
}: FilterSheetProps<T>) {
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
        aria-label="Закрыть"
        onClick={onClose}
        className={`absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 ease-out ${
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
          <h2 className="text-[17px] font-bold text-ink">{title}</h2>
          <ul className="mt-3 max-h-[50vh] overflow-y-auto">
            {options.map((option) => {
              const selected = draft === option.id;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => setDraft(option.id)}
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
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 !py-3 text-[15px]">
              {t("filters.cancel")}
            </button>
            <button
              type="button"
              onClick={() => onConfirm(draft)}
              className="btn-primary flex-1 !py-3 text-[15px]"
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
