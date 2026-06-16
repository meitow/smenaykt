import { NextRequest, NextResponse } from "next/server";
import { resolveAdminActor } from "@/lib/admin-auth";
import { isPhoneBanned } from "@/lib/ban-list";
import { getProfileSummary } from "@/lib/profile";
import { isValidRuPhone, normalizeRuPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  if (!(await resolveAdminActor(request))) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  try {
    const phone = normalizeRuPhone(request.nextUrl.searchParams.get("phone") ?? "");
    if (!phone || !isValidRuPhone(phone)) {
      return NextResponse.json({ error: "Укажите корректный телефон" }, { status: 400 });
    }

    const [summary, profile, postedCount, acceptedCount, banned] = await Promise.all([
      getProfileSummary(phone),
      prisma.userProfile.findUnique({ where: { phone } }),
      prisma.task.count({ where: { phone } }),
      prisma.task.count({ where: { workerPhone: phone } }),
      isPhoneBanned(phone),
    ]);

    return NextResponse.json({
      phone,
      profile: profile
        ? {
            name: profile.name,
            bio: profile.bio,
            avatarUrl: profile.avatarUrl,
            createdAt: profile.createdAt.toISOString(),
          }
        : null,
      stats: summary?.stats ?? null,
      postedCount,
      acceptedCount,
      banned,
    });
  } catch (error) {
    console.error("GET /api/admin/users", error);
    return NextResponse.json({ error: "Не удалось найти пользователя" }, { status: 500 });
  }
}
