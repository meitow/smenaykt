import { NextRequest } from "next/server";

export function adminSecretFromRequest(request: NextRequest): string {
  return (
    request.headers.get("x-admin-secret")?.trim() ||
    request.nextUrl.searchParams.get("secret")?.trim() ||
    ""
  );
}

export function isAdminAuthorized(request: NextRequest): boolean {
  const configured = process.env.ADMIN_SECRET?.trim();
  if (!configured) return false;

  const provided = adminSecretFromRequest(request);
  return provided.length > 0 && provided === configured;
}
