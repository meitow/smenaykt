import { NextRequest, NextResponse } from "next/server";
import { banPhone, listBannedPhones, unbanPhone } from "@/lib/ban-list";
import { resolveAdminActor } from "@/lib/admin-auth";
import { isValidRuPhone, normalizeRuPhone } from "@/lib/phone";

function unauthorized() {
  return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
}

async function requireAdmin(request: NextRequest) {
  const actor = await resolveAdminActor(request);
  if (!actor) return null;
  return actor;
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return unauthorized();
  }

  try {
    const bans = await listBannedPhones();
    return NextResponse.json({ bans });
  } catch (error) {
    console.error("GET /api/admin/bans", error);
    return NextResponse.json({ error: "Не удалось загрузить список" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const actor = await requireAdmin(request);
  if (!actor) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const phone = String(body.phone ?? "").trim();
    const reason = String(body.reason ?? "").trim();
    const bannedBy = String(body.bannedBy ?? "").trim() || actor.phone || "moderator";

    if (!isValidRuPhone(phone)) {
      return NextResponse.json({ error: "Укажите корректный телефон" }, { status: 400 });
    }

    const row = await banPhone({ phone, reason, bannedBy });
    return NextResponse.json({ ban: row }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/bans", error);
    return NextResponse.json({ error: "Не удалось заблокировать номер" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return unauthorized();
  }

  try {
    const body = await request.json().catch(() => ({}));
    const phone =
      normalizeRuPhone(String(body.phone ?? request.nextUrl.searchParams.get("phone") ?? "").trim()) ??
      "";

    if (!phone || !isValidRuPhone(phone)) {
      return NextResponse.json({ error: "Укажите корректный телефон" }, { status: 400 });
    }

    await unbanPhone(phone);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/bans", error);
    return NextResponse.json({ error: "Не удалось снять блокировку" }, { status: 500 });
  }
}
