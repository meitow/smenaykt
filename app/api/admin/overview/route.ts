import { NextRequest, NextResponse } from "next/server";
import { resolveAdminActor } from "@/lib/admin-auth";
import { getAdminOverview } from "@/lib/admin-overview";

export async function GET(request: NextRequest) {
  if (!(await resolveAdminActor(request))) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  try {
    const overview = await getAdminOverview();
    return NextResponse.json({ overview });
  } catch (error) {
    console.error("GET /api/admin/overview", error);
    return NextResponse.json({ error: "Не удалось загрузить сводку" }, { status: 500 });
  }
}
