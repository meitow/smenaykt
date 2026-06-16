import { NextRequest } from "next/server";
import { isPhoneModerator } from "@/lib/moderator-list";
import { normalizeRuPhone } from "@/lib/phone";

export type AdminActor = {
  authorized: true;
  phone?: string;
  viaSecret: boolean;
};

export function moderatorPhoneFromRequest(request: NextRequest): string | null {
  const raw =
    request.headers.get("x-moderator-phone")?.trim() ||
    request.nextUrl.searchParams.get("phone")?.trim() ||
    "";
  return normalizeRuPhone(raw);
}

export function adminSecretFromRequest(request: NextRequest): string {
  return (
    request.headers.get("x-admin-secret")?.trim() ||
    request.nextUrl.searchParams.get("secret")?.trim() ||
    ""
  );
}

export function isAdminSecretAuthorized(request: NextRequest): boolean {
  const configured = process.env.ADMIN_SECRET?.trim();
  if (!configured) return false;

  const provided = adminSecretFromRequest(request);
  return provided.length > 0 && provided === configured;
}

/** @deprecated Use resolveAdminActor */
export function isAdminAuthorized(request: NextRequest): boolean {
  return isAdminSecretAuthorized(request);
}

export async function resolveAdminActor(request: NextRequest): Promise<AdminActor | null> {
  if (isAdminSecretAuthorized(request)) {
    return { authorized: true, viaSecret: true };
  }

  const phone = moderatorPhoneFromRequest(request);
  if (phone && (await isPhoneModerator(phone))) {
    return { authorized: true, phone, viaSecret: false };
  }

  return null;
}
