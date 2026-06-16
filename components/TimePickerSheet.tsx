"use client";

import { useEffect, useRef, useState } from "react";
import { SheetPortal } from "@/components/SheetPortal";
import { defaultTimeValue, formatTimeHm, parseTimeHm } from "@/lib/datetime";
import { t } from "@/lib/i18n";

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);
const ITEM_HEIGHT = 44;
const PICKER_PADDING = ITEM_HEIGHT * 2;

type TimePickerSheetProps = {
  open: boolean;
  value: string;
  title?: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
};

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function TimePickerColumn({
  values,
  selected,
  onSelect,
  format,
}: {
  values: number[];
  selected: number;
  onSelect: (value: number) => void;
  format: (value: number) => string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const index = values.indexOf(selected);
    if (index < 0) return;
    list.scrollTop = index * ITEM_HEIGHT;
  }, [selected, values]);

  function syncFromScroll() {
    const list = listRef.current;
    if (!list) return;
    const index = Math.round(list.scrollTop / ITEM_HEIGHT);
    const next = values[Math.min(Math.max(index, 0), values.length - 1)];
    if (next !== selected) onSelect(next);
  }

  return (
    <div
      ref={listRef}
      className="h-[220px] flex-1 overflow-y-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      onScroll={() => window.requestAnimationFrame(syncFromScroll)}
    >
      <div style={{ paddingTop: PICKER_PADDING, paddingBottom: PICKER_PADDING }}>
        {values.map((item) => {
          const active = item === selected;
          return (
            <button
              key={item}
              type="button"
              onClick={() => {
                onSelect(item);
                listRef.current?.scrollTo({ top: values.indexOf(item) * ITEM_HEIGHT, behavior: "smooth" });
              }}
              className={`flex h-11 w-full items-center justify-center text-[22px] tabular-nums transition ${
                active ? "font-bold text-brand-dark" : "text-muted"
              }`}
            >
              {format(item)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TimePickerSheet({ open, value, title, onClose, onConfirm }: TimePickerSheetProps) {
  const parsed = parseTimeHm(value) ?? parseTimeHm(defaultTimeValue(10))!;
  const [draftHours, setDraftHours] = useState(parsed.hours);
  const [draftMinutes, setDraftMinutes] = useState(parsed.minutes);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      const next = parseTimeHm(value) ?? parseTimeHm(defaultTimeValue(10))!;
      setDraftHours(next.hours);
      setDraftMinutes(next.minutes);
      setVisible(true);
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }

    const timer = window.setTimeout(() => setVisible(false), 220);
    return () => window.clearTimeout(timer);
  }, [open, value]);

  if (!visible && !open) return null;

  function apply() {
    onConfirm(formatTimeHm(`${draftHours}:${draftMinutes}`));
  }

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
          aria-label={title ?? t("post.timePickerTitle")}
          className={`absolute bottom-0 left-0 right-0 transition-transform duration-300 ease-out ${
            open ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="relative z-[101] mx-auto max-w-lg rounded-t-3xl bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-card ring-1 ring-black/[0.06]">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
            <h2 className="text-[17px] font-bold text-ink">{title ?? t("post.timePickerTitle")}</h2>
            <p className="mt-1 text-[14px] text-muted">{t("post.timePickerHint")}</p>

            <div className="relative mt-4">
              <div
                className="pointer-events-none absolute inset-x-8 top-1/2 z-10 h-11 -translate-y-1/2 rounded-xl bg-brand-light/50 ring-1 ring-brand/15"
                aria-hidden
              />
              <div className="relative flex items-stretch gap-2">
                <TimePickerColumn
                  values={HOURS}
                  selected={draftHours}
                  onSelect={setDraftHours}
                  format={pad2}
                />
                <div className="flex items-center pb-1 text-[24px] font-bold text-ink">:</div>
                <TimePickerColumn
                  values={MINUTES}
                  selected={draftMinutes}
                  onSelect={setDraftMinutes}
                  format={pad2}
                />
              </div>
            </div>

            <p className="mt-3 text-center text-[15px] font-semibold tabular-nums text-ink">
              {formatTimeHm(`${draftHours}:${draftMinutes}`)}
            </p>

            <div className="mt-4 flex gap-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 !py-3 text-[15px]">
                {t("filters.cancel")}
              </button>
              <button type="button" onClick={apply} className="btn-primary flex-1 !py-3 text-[15px]">
                {t("filters.apply")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SheetPortal>
  );
}
