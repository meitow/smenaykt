import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeRuPhone } from "@/lib/phone";

export async function GET(request: NextRequest) {
  try {
    const excludePhone = normalizeRuPhone(request.nextUrl.searchParams.get("excludePhone") ?? "");

    const profiles = await prisma.userProfile.findMany({
      orderBy: { name: "asc" },
      take: 50,
    });

    const contractors = profiles
      .filter((row) => row.name.trim())
      .filter((row) => !excludePhone || row.phone !== excludePhone)
      .map((row) => ({
        phone: row.phone,
        name: row.name,
        avatarUrl: row.avatarUrl,
        bio: row.bio,
      }));

    return NextResponse.json({ contractors });
  } catch (error) {
    console.error("GET /api/tasks/contractors", error);
    return NextResponse.json({ error: "Не удалось загрузить исполнителей" }, { status: 500 });
  }
}
