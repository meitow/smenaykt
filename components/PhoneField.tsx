"use client";

import { useEffect, useState } from "react";
import { formatRuPhone, isValidRuPhone, ruPhoneLocalPart } from "@/lib/phone";
import { t } from "@/lib/i18n";

type PhoneFieldProps = {
  name?: string;
  defaultValue?: string;
  required?: boolean;
  onValidityChange?: (valid: boolean) => void;
};

export function PhoneField({
  name = "phone",
  defaultValue = "",
  required = true,
  onValidityChange,
}: PhoneFieldProps) {
  const [local, setLocal] = useState(() => ruPhoneLocalPart(defaultValue));
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (local.length > 0 || !defaultValue) return;
    const part = ruPhoneLocalPart(defaultValue);
    if (part.length === 10 && isValidRuPhone(`+7${part}`)) {
      setLocal(part);
      onValidityChange?.(true);
    }
  }, [defaultValue, local.length, onValidityChange]);

  const full = `+7${local}`;
  const valid = local.length === 10 && isValidRuPhone(full);
  const showError = touched && !valid && local.length > 0;

  function update(next: string) {
    const digits = next.replace(/\D/g, "").slice(0, 10);
    setLocal(digits);
    onValidityChange?.(digits.length === 10 && isValidRuPhone(`+7${digits}`));
  }

  return (
    <label className="block">
      <span className="text-sm font-medium text-muted">{t("post.phoneLabel")}</span>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="input-field !mt-0 flex w-[4.5rem] shrink-0 items-center justify-center !px-0 font-semibold text-brand">
          +7
        </span>
        <input
          name={name}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required={required}
          value={local}
          onChange={(e) => update(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="9991234567"
          maxLength={10}
          pattern="[0-9]{10}"
          className="input-field !mt-0 flex-1 tracking-wide"
          aria-invalid={showError}
        />
      </div>
      <p className="mt-1 text-xs text-muted">
        {valid ? formatRuPhone(full) : t("post.phoneHint")}
      </p>
      {showError && <p className="mt-1 text-sm text-rose-600">{t("post.phoneInvalid")}</p>}
      <input type="hidden" name={`${name}Normalized`} value={valid ? `+7${local}` : ""} />
    </label>
  );
}
