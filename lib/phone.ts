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
