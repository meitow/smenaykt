import { NextRequest, NextResponse } from "next/server";
import { resolveAdminActor } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const actor = await resolveAdminActor(request);
  if (!actor) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    phone: actor.phone ?? null,
    viaSecret: actor.viaSecret,
    canManageModerators: actor.viaSecret,
  });
}
