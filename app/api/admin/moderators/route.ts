import { NextRequest, NextResponse } from "next/server";
import { resolveAdminActor, isAdminSecretAuthorized } from "@/lib/admin-auth";
import { addModerator, listModerators, removeModerator } from "@/lib/moderator-list";
import { isValidRuPhone, normalizeRuPhone } from "@/lib/phone";

export async function GET(request: NextRequest) {
  if (!(await resolveAdminActor(request))) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  try {
    const moderators = await listModerators();
    return NextResponse.json({ moderators });
  } catch (error) {
    console.error("GET /api/admin/moderators", error);
    return NextResponse.json({ error: "Не удалось загрузить модераторов" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminSecretAuthorized(request)) {
    return NextResponse.json({ error: "Только владелец с ключом может добавлять модераторов" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const phone = String(body.phone ?? "").trim();
    const name = String(body.name ?? "").trim();

    if (!isValidRuPhone(phone)) {
      return NextResponse.json({ error: "Укажите корректный телефон" }, { status: 400 });
    }

    const row = await addModerator({ phone, name, addedBy: "owner" });
    return NextResponse.json({ moderator: row }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/moderators", error);
    return NextResponse.json({ error: "Не удалось добавить модератора" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminSecretAuthorized(request)) {
    return NextResponse.json({ error: "Только владелец с ключом может удалять модераторов" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const phone =
      normalizeRuPhone(String(body.phone ?? request.nextUrl.searchParams.get("phone") ?? "").trim()) ?? "";

    if (!phone || !isValidRuPhone(phone)) {
      return NextResponse.json({ error: "Укажите корректный телефон" }, { status: 400 });
    }

    await removeModerator(phone);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/moderators", error);
    return NextResponse.json({ error: "Не удалось удалить модератора" }, { status: 500 });
  }
}
