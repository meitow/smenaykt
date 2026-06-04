import { NextRequest, NextResponse } from "next/server";
import { toClientTask } from "@/lib/tasks";
import { isValidRuPhone, normalizeRuPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const phone = normalizeRuPhone(request.nextUrl.searchParams.get("phone") ?? "");

    if (!phone || !isValidRuPhone(phone)) {
      return NextResponse.json({ error: "Укажите телефон в профиле" }, { status: 400 });
    }

    const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") ?? 20), 1), 50);

    const [posted, accepted, postedTotal, acceptedTotal] = await Promise.all([
      prisma.task.findMany({
        where: { phone },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.task.findMany({
        where: { workerPhone: phone },
        orderBy: { acceptedAt: "desc" },
        take: limit,
      }),
      prisma.task.count({ where: { phone } }),
      prisma.task.count({ where: { workerPhone: phone } }),
    ]);

    return NextResponse.json({
      posted: posted.map(toClientTask),
      accepted: accepted.map(toClientTask),
      postedTotal,
      acceptedTotal,
      limit,
    });
  } catch (error) {
    console.error("GET /api/profile/tasks", error);
    return NextResponse.json({ error: "Не удалось загрузить задания" }, { status: 500 });
  }
}
