"use client";

import { useRef } from "react";
import { formatDateLabel, formatDateNumeric } from "@/lib/datetime";
import { t } from "@/lib/i18n";

type DateFieldProps = {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  required?: boolean;
  min?: string;
};

export function DateField({ value, onChange, name, required, min }: DateFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    const input = inputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.click();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={openPicker}
        className="input-field flex w-full items-center justify-between text-left"
      >
        <span className={value ? "font-medium text-ink" : "text-muted"}>
          {value ? formatDateNumeric(value) : t("post.datePlaceholder")}
        </span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 text-muted" aria-hidden>
          <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      {value ? (
        <p className="mt-1.5 text-[13px] text-muted">{formatDateLabel(value)}</p>
      ) : null}
      <input
        ref={inputRef}
        type="date"
        name={name}
        required={required}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        tabIndex={-1}
        aria-hidden
      />
    </div>
  );
}
