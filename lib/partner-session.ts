export const PARTNER_TOKEN_KEY = "smenaykt_partner_token";
export const PARTNER_STORE_ID_KEY = "smenaykt_partner_store_id";
export const PARTNER_NAME_KEY = "smenaykt_partner_name";
export const PARTNER_PHONE_KEY = "smenaykt_partner_phone";

/** @deprecated */
export const PARTNER_INVITE_KEY = "smenaykt_partner_invite";

export function getPartnerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PARTNER_TOKEN_KEY);
}

export function getPartnerStoreId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PARTNER_STORE_ID_KEY);
}

/** @deprecated */
export function getPartnerInvite(): string | null {
  return getPartnerToken();
}

export function getPartnerPhone(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PARTNER_PHONE_KEY);
}

export function setPartnerSession(input: {
  storeId: string;
  accessToken: string;
  storeName: string;
  storePhone: string;
}) {
  localStorage.setItem(PARTNER_STORE_ID_KEY, input.storeId);
  localStorage.setItem(PARTNER_TOKEN_KEY, input.accessToken);
  localStorage.setItem(PARTNER_NAME_KEY, input.storeName);
  localStorage.setItem(PARTNER_PHONE_KEY, input.storePhone);
  localStorage.removeItem(PARTNER_INVITE_KEY);
}

export function clearPartnerSession() {
  localStorage.removeItem(PARTNER_STORE_ID_KEY);
  localStorage.removeItem(PARTNER_TOKEN_KEY);
  localStorage.removeItem(PARTNER_NAME_KEY);
  localStorage.removeItem(PARTNER_PHONE_KEY);
  localStorage.removeItem(PARTNER_INVITE_KEY);
}

export function getPartnerName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PARTNER_NAME_KEY);
}

export function partnerHeaders(): HeadersInit {
  const token = getPartnerToken();
  return token ? { "x-partner-token": token } : {};
}
