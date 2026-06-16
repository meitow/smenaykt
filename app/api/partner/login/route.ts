import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePartnerAccessToken } from "@/lib/partner-token";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const accessToken = String(body.accessToken ?? body.inviteCode ?? "").trim();

  if (!accessToken) {
    return NextResponse.json({ error: "Введите ключ доступа" }, { status: 400 });
  }

  let store = await prisma.store.findUnique({ where: { accessToken } });

  if (!store && accessToken.length <= 16) {
    store = await prisma.store.findUnique({
      where: { inviteCode: accessToken.toUpperCase() },
    });
  }

  if (!store) {
    return NextResponse.json({ error: "Предприятие не найдено" }, { status: 404 });
  }

  if (!store.accessToken) {
    const token = generatePartnerAccessToken();
    store = await prisma.store.update({
      where: { id: store.id },
      data: { accessToken: token },
    });
  }

  return NextResponse.json({
    store: {
      id: store.id,
      name: store.name,
      accessToken: store.accessToken,
      phone: store.phone,
    },
  });
}
