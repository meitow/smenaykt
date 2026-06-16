"use client";

import { useEffect, useState } from "react";
import { RuPhoneInput } from "@/components/RuPhoneInput";
import { isValidRuPhone, ruPhoneLocalPart } from "@/lib/phone";
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
  const [phone, setPhone] = useState(() => {
    const digits = ruPhoneLocalPart(defaultValue);
    return digits.length === 10 ? `+7${digits}` : "";
  });

  useEffect(() => {
    if (phone || !defaultValue) return;
    const digits = ruPhoneLocalPart(defaultValue);
    if (digits.length === 10 && isValidRuPhone(`+7${digits}`)) {
      setPhone(`+7${digits}`);
      onValidityChange?.(true);
    }
  }, [defaultValue, onValidityChange, phone]);

  const valid = isValidRuPhone(phone);

  return (
    <>
      <RuPhoneInput
        value={phone}
        onChange={setPhone}
        onValidityChange={onValidityChange}
        label={t("post.phoneLabel")}
        hint={t("post.phoneHint")}
        invalidHint={t("post.phoneInvalid")}
        required={required}
        className=""
      />
      <input type="hidden" name={name} value={phone} />
      <input type="hidden" name={`${name}Normalized`} value={valid ? phone : ""} />
    </>
  );
}
