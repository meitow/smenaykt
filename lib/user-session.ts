const NAME_KEY = "smenaykt_user_name";
const PHONE_KEY = "smenaykt_user_phone";
const AVATAR_KEY = "smenaykt_user_avatar";

export function getUserDisplayName(): string {
  if (typeof window === "undefined") return "Гость";
  return localStorage.getItem(NAME_KEY)?.trim() || "Гость";
}

export function setUserDisplayName(name: string) {
  if (typeof window === "undefined") return;
  const trimmed = name.trim();
  if (trimmed) {
    localStorage.setItem(NAME_KEY, trimmed);
  } else {
    localStorage.removeItem(NAME_KEY);
  }
  window.dispatchEvent(new Event("smenaykt_user_updated"));
}

export function getUserPhone(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(PHONE_KEY)?.trim() || "";
}

export function setUserPhone(phone: string) {
  if (typeof window === "undefined") return;
  const trimmed = phone.trim();
  if (trimmed) {
    localStorage.setItem(PHONE_KEY, trimmed);
  } else {
    localStorage.removeItem(PHONE_KEY);
  }
  window.dispatchEvent(new Event("smenaykt_user_updated"));
}

export function getUserAvatarUrl(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(AVATAR_KEY)?.trim() || "";
}

export function setUserAvatarUrl(url: string) {
  if (typeof window === "undefined") return;
  const trimmed = url.trim();
  if (trimmed) {
    localStorage.setItem(AVATAR_KEY, trimmed);
  } else {
    localStorage.removeItem(AVATAR_KEY);
  }
  window.dispatchEvent(new Event("smenaykt_user_updated"));
}

export function profileCompletionPercent(
  name: string,
  phone: string,
  avatarUrl?: string,
  bio?: string
): number {
  let score = 0;
  if (name.trim() && name.trim() !== "Гость") score += 25;
  if (phone.trim().length >= 12) score += 25;
  if (avatarUrl?.trim()) score += 25;
  if (bio?.trim()) score += 25;
  return score;
}
