const RU_PHONE_DIGITS = 11;

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Normalize to +7XXXXXXXXXX or null if invalid. */
export function normalizeRuPhone(input: string): string | null {
  let digits = digitsOnly(input);

  if (digits.startsWith("8") && digits.length === 11) {
    digits = `7${digits.slice(1)}`;
  }

  if (digits.length === 10 && digits.startsWith("9")) {
    digits = `7${digits}`;
  }

  if (digits.length !== RU_PHONE_DIGITS || !digits.startsWith("7")) {
    return null;
  }

  return `+${digits}`;
}

export function formatRuPhone(phone: string): string {
  const normalized = normalizeRuPhone(phone);
  if (!normalized) return phone;

  const digits = normalized.slice(1);
  return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}

/** Ten digits after +7 for the input field. */
export function ruPhoneLocalPart(input: string): string {
  let digits = digitsOnly(input);

  if (digits.startsWith("7") || digits.startsWith("8")) {
    digits = digits.slice(1);
  }

  return digits.slice(0, 10);
}

export function isValidRuPhone(input: string): boolean {
  return normalizeRuPhone(input) !== null;
}

/** Format partial or full local digits (0–10) for a single-line phone input. */
export function formatRuPhoneInput(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 10);
  if (d.length === 0) return "+7 ";

  let formatted = "+7";
  if (d.length > 0) formatted += ` ${d.slice(0, 3)}`;
  if (d.length > 3) formatted += ` ${d.slice(3, 6)}`;
  if (d.length > 6) formatted += ` ${d.slice(6, 8)}`;
  if (d.length > 8) formatted += ` ${d.slice(8, 10)}`;

  return formatted;
}

/** Extract up to 10 national digits from free-form phone input. */
export function extractRuPhoneDigits(input: string): string {
  let digits = digitsOnly(input);

  if (digits.startsWith("7") || digits.startsWith("8")) {
    digits = digits.slice(1);
  }

  return digits.slice(0, 10);
}

export function phoneFromLocalDigits(digits: string): string {
  if (digits.length === 0) return "";
  if (digits.length === 10 && isValidRuPhone(`+7${digits}`)) {
    return `+7${digits}`;
  }
  return `+7${digits}`;
}
