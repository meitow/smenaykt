export const PARTNER_INVITE_KEY = "smenaykt_partner_invite";
export const PARTNER_NAME_KEY = "smenaykt_partner_name";
export const PARTNER_PHONE_KEY = "smenaykt_partner_phone";

export function getPartnerInvite(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PARTNER_INVITE_KEY);
}

export function getPartnerPhone(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PARTNER_PHONE_KEY);
}

export function setPartnerSession(inviteCode: string, storeName: string, storePhone: string) {
  localStorage.setItem(PARTNER_INVITE_KEY, inviteCode);
  localStorage.setItem(PARTNER_NAME_KEY, storeName);
  localStorage.setItem(PARTNER_PHONE_KEY, storePhone);
}

export function clearPartnerSession() {
  localStorage.removeItem(PARTNER_INVITE_KEY);
  localStorage.removeItem(PARTNER_NAME_KEY);
  localStorage.removeItem(PARTNER_PHONE_KEY);
}

export function getPartnerName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PARTNER_NAME_KEY);
}

export function partnerHeaders(): HeadersInit {
  const inviteCode = getPartnerInvite();
  return inviteCode ? { "x-invite-code": inviteCode } : {};
}
