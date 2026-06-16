import { NextRequest, NextResponse } from "next/server";
import { resolveAdminActor } from "@/lib/admin-auth";
import { listIdentitySubmissions } from "@/lib/identity-documents";

function unauthorized() {
  return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const actor = await resolveAdminActor(request);
  if (!actor) return unauthorized();

  try {
    const status = request.nextUrl.searchParams.get("status")?.trim() || "pending";
    const submissions = await listIdentitySubmissions(status === "all" ? undefined : status);
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("GET /api/admin/identity", error);
    return NextResponse.json({ error: "Не удалось загрузить очередь" }, { status: 500 });
  }
}
