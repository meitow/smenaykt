import { isValidRuPhone } from "@/lib/phone";

export function profileCompletionPercent(
  name: string,
  phone: string,
  avatarUrl?: string,
  bio?: string
): number {
  let score = 0;
  if (name.trim() && name.trim() !== "Гость") score += 25;
  if (isValidRuPhone(phone)) score += 25;
  if (avatarUrl?.trim()) score += 25;
  if (bio?.trim()) score += 25;
  return score;
}

export function anketaCompletionPercent(name: string, avatarUrl?: string, bio?: string): number {
  let score = 0;
  if (name.trim() && name.trim() !== "Гость") score += 34;
  if (avatarUrl?.trim()) score += 33;
  if (bio?.trim()) score += 33;
  return score;
}

export function contactsCompletionPercent(phone: string): number {
  return isValidRuPhone(phone) ? 100 : 0;
}

export function isProfileIncomplete(
  name: string,
  phone: string,
  avatarUrl?: string,
  bio?: string
): boolean {
  return profileCompletionPercent(name, phone, avatarUrl, bio) < 100;
}
