"use client";

import { useEffect, useState } from "react";
import {
  extractRuPhoneDigits,
  formatRuPhone,
  formatRuPhoneInput,
  isValidRuPhone,
  phoneFromLocalDigits,
  ruPhoneLocalPart,
} from "@/lib/phone";

type RuPhoneInputProps = {
  value: string;
  onChange: (phone: string) => void;
  onValidityChange?: (valid: boolean) => void;
  label: string;
  hint?: string;
  invalidHint?: string;
  required?: boolean;
  className?: string;
};

export function RuPhoneInput({
  value,
  onChange,
  onValidityChange,
  label,
  hint,
  invalidHint,
  required,
  className = "mt-4",
}: RuPhoneInputProps) {
  const [localDigits, setLocalDigits] = useState(() => ruPhoneLocalPart(value));
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setLocalDigits(ruPhoneLocalPart(value));
  }, [value]);

  const displayValue = formatRuPhoneInput(localDigits);
  const full = localDigits.length === 10 ? `+7${localDigits}` : "";
  const valid = localDigits.length === 10 && isValidRuPhone(full);
  const showError = touched && !valid && localDigits.length > 0;

  function update(next: string) {
    const digits = extractRuPhoneDigits(next);
    setLocalDigits(digits);
    const phone = phoneFromLocalDigits(digits);
    onChange(phone);
    onValidityChange?.(digits.length === 10 && isValidRuPhone(phone));
  }

  return (
    <label className={`block text-left ${className}`}>
      <span className="field-label">{label}</span>
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required={required}
        value={displayValue}
        onChange={(e) => update(e.target.value)}
        onBlur={() => setTouched(true)}
        onFocus={(e) => {
          const input = e.currentTarget;
          window.requestAnimationFrame(() => {
            input.setSelectionRange(input.value.length, input.value.length);
          });
        }}
        placeholder="+7 999 123 45 67"
        className="input-field tracking-wide"
        aria-invalid={showError}
      />
      <p className="mt-1 text-[13px] text-muted">
        {valid ? formatRuPhone(full) : hint}
      </p>
      {showError && invalidHint ? (
        <p className="mt-1 text-[13px] text-rose-600">{invalidHint}</p>
      ) : null}
    </label>
  );
}
