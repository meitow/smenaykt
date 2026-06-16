"use client";

import { useRef } from "react";
import { formatTimeHm } from "@/lib/datetime";
import { t } from "@/lib/i18n";

type TimeFieldProps = {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  required?: boolean;
  placeholder?: string;
};

export function TimeField({
  value,
  onChange,
  name,
  required,
  placeholder = t("post.timePlaceholder"),
}: TimeFieldProps) {
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
        <span className={value ? "font-medium tabular-nums text-ink" : "text-muted"}>
          {value ? formatTimeHm(value) : placeholder}
        </span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 text-muted" aria-hidden>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 8v4l2.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      <input
        ref={inputRef}
        type="time"
        name={name}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        tabIndex={-1}
        aria-hidden
        lang="ru-RU"
      />
    </div>
  );
}
