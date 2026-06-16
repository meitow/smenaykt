import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidRuPhone, normalizeRuPhone } from "@/lib/phone";
import { serializeNotification } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  try {
    const phone = normalizeRuPhone(request.nextUrl.searchParams.get("phone") ?? "");
    if (!phone || !isValidRuPhone(phone)) {
      return NextResponse.json({ error: "Укажите телефон" }, { status: 400 });
    }

    const unreadOnly = request.nextUrl.searchParams.get("unread") !== "0";
    const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") ?? 20), 1), 50);

    const rows = await prisma.notification.findMany({
      where: {
        recipientPhone: phone,
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: { recipientPhone: phone, readAt: null },
    });

    return NextResponse.json({
      notifications: rows.map(serializeNotification),
      unreadCount,
    });
  } catch (error) {
    console.error("GET /api/notifications", error);
    return NextResponse.json({ error: "Не удалось загрузить уведомления" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = normalizeRuPhone(String(body.phone ?? "").trim());
    if (!phone || !isValidRuPhone(phone)) {
      return NextResponse.json({ error: "Укажите телефон" }, { status: 400 });
    }

    const ids = Array.isArray(body.ids)
      ? body.ids.map((id: unknown) => String(id).trim()).filter(Boolean)
      : [];

    const now = new Date();

    if (ids.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: ids }, recipientPhone: phone, readAt: null },
        data: { readAt: now },
      });
    } else {
      await prisma.notification.updateMany({
        where: { recipientPhone: phone, readAt: null },
        data: { readAt: now },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/notifications", error);
    return NextResponse.json({ error: "Не удалось обновить уведомления" }, { status: 500 });
  }
}
