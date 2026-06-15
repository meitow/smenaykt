import { normalizeRuPhone } from "@/lib/phone";

const NAME_KEY = "smenaykt_user_name";
const PHONE_KEY = "smenaykt_user_phone";
const AVATAR_KEY = "smenaykt_user_avatar";
const ACCOUNTS_KEY = "smenaykt_saved_accounts";
const MAX_SAVED_ACCOUNTS = 5;

export type SavedAccount = {
  phone: string;
  name: string;
  avatarUrl?: string;
};

function dispatchUserUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("smenaykt_user_updated"));
}

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
  dispatchUserUpdated();
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
  dispatchUserUpdated();
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
  dispatchUserUpdated();
}

export function getSavedAccounts(): SavedAccount[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as SavedAccount[];
    if (!Array.isArray(parsed)) return [];

    const seen = new Set<string>();
    const accounts: SavedAccount[] = [];

    for (const item of parsed) {
      const phone = normalizeRuPhone(String(item.phone ?? ""));
      if (!phone || seen.has(phone)) continue;
      seen.add(phone);
      accounts.push({
        phone,
        name: String(item.name ?? "").trim() || "Гость",
        avatarUrl: item.avatarUrl ? String(item.avatarUrl) : undefined,
      });
    }

    return accounts.slice(0, MAX_SAVED_ACCOUNTS);
  } catch {
    return [];
  }
}

export function rememberAccount(account: SavedAccount) {
  if (typeof window === "undefined") return;

  const phone = normalizeRuPhone(account.phone);
  if (!phone) return;

  const next: SavedAccount = {
    phone,
    name: account.name.trim() || "Гость",
    avatarUrl: account.avatarUrl?.trim() || undefined,
  };

  const accounts = getSavedAccounts().filter((item) => item.phone !== phone);
  accounts.unshift(next);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts.slice(0, MAX_SAVED_ACCOUNTS)));
}

export function removeSavedAccount(phone: string) {
  if (typeof window === "undefined") return;

  const normalized = normalizeRuPhone(phone);
  if (!normalized) return;

  const accounts = getSavedAccounts().filter((item) => item.phone !== normalized);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function clearUserSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(NAME_KEY);
  localStorage.removeItem(PHONE_KEY);
  localStorage.removeItem(AVATAR_KEY);
  dispatchUserUpdated();
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
