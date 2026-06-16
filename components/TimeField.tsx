"use client";

import { useState } from "react";
import { TimePickerSheet } from "@/components/TimePickerSheet";
import { formatTimeHm } from "@/lib/datetime";
import { t } from "@/lib/i18n";

type TimeFieldProps = {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  required?: boolean;
  placeholder?: string;
  title?: string;
};

export function TimeField({
  value,
  onChange,
  name,
  required,
  placeholder = t("post.timePlaceholder"),
  title,
}: TimeFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
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
      {name ? <input type="hidden" name={name} value={value} required={required} /> : null}
      <TimePickerSheet
        open={open}
        value={value}
        title={title}
        onClose={() => setOpen(false)}
        onConfirm={(next) => {
          onChange(next);
          setOpen(false);
        }}
      />
    </>
  );
}
