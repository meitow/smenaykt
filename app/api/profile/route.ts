import { NextRequest, NextResponse } from "next/server";
import {
  getProfileData,
  getProfileSummary,
  lookupUserProfile,
  serializeUserProfile,
} from "@/lib/profile";
import { saveProfilePacket } from "@/lib/profile-save";
import { assertPhoneNotBanned } from "@/lib/ban-list";
import { isValidRuPhone, normalizeRuPhone } from "@/lib/phone";

export async function GET(request: NextRequest) {
  try {
    const phone = normalizeRuPhone(request.nextUrl.searchParams.get("phone") ?? "");

    if (!phone || !isValidRuPhone(phone)) {
      return NextResponse.json({ error: "Укажите телефон в профиле" }, { status: 400 });
    }

    const lookupOnly = request.nextUrl.searchParams.get("lookup") === "1";
    const summaryOnly = request.nextUrl.searchParams.get("summary") === "1";

    if (summaryOnly) {
      const summary = await getProfileSummary(phone);
      if (!summary) {
        return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
      }
      return NextResponse.json(summary);
    }

    if (lookupOnly) {
      const profile = await lookupUserProfile(phone);
      if (!profile) {
        return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
      }
      return NextResponse.json(serializeUserProfile(profile));
    }

    const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") ?? 20), 1), 50);

    const data = await getProfileData(phone, limit);

    if (!data) {
      return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/profile", error);
    return NextResponse.json({ error: "Не удалось загрузить профиль" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = normalizeRuPhone(String(body.phone ?? "").trim());

    if (!phone || !isValidRuPhone(phone)) {
      return NextResponse.json({ error: "Укажите телефон в профиле" }, { status: 400 });
    }

    const bannedMessage = await assertPhoneNotBanned(phone);
    if (bannedMessage) {
      return NextResponse.json({ error: bannedMessage }, { status: 403 });
    }

    const updated = await saveProfilePacket({
      phone,
      name: String(body.name ?? ""),
      bio: String(body.bio ?? ""),
      avatarUrl: body.avatarUrl ? String(body.avatarUrl) : null,
    });

    const profile = serializeUserProfile(updated);

    return NextResponse.json({
      ...profile,
      saved: true,
    });
  } catch (error) {
    console.error("PATCH /api/profile", error);
    return NextResponse.json({ error: "Не удалось сохранить профиль" }, { status: 500 });
  }
}
