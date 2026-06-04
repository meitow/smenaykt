"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SheetPortal } from "@/components/SheetPortal";
import { t } from "@/lib/i18n";

type DetailSheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function DetailSheet({ open, title, onClose, children, footer }: DetailSheetProps) {
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setVisible(true);
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }

    const timer = setTimeout(() => setVisible(false), 280);
    return () => clearTimeout(timer);
  }, [open]);

  if (!visible && !open) return null;

  return (
    <SheetPortal>
    <div className={`fixed inset-0 z-[100] ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
      <button
        type="button"
        aria-label={t("filters.cancel")}
        onClick={onClose}
        className={`absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 ease-out ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`absolute bottom-0 left-0 right-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto max-w-lg rounded-t-3xl bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-card ring-1 ring-black/[0.06]">
          <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-line/80" />
          <h2 className="text-[17px] font-bold text-ink">{title}</h2>
          <div className="mt-3 max-h-[62vh] overflow-y-auto">{children}</div>
          {footer ?? (
            <button type="button" onClick={onClose} className="btn-secondary mt-4 w-full !py-3 text-[15px]">
              {t("task.gotIt")}
            </button>
          )}
        </div>
      </div>
    </div>
    </SheetPortal>
  );
}
