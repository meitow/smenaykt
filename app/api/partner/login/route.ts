import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const inviteCode = String(body.inviteCode ?? "").trim().toUpperCase();

  if (!inviteCode) {
    return NextResponse.json({ error: "Введите код" }, { status: 400 });
  }

  const store = await prisma.store.findUnique({ where: { inviteCode } });
  if (!store) {
    return NextResponse.json({ error: "Предприятие не найдено" }, { status: 404 });
  }

  return NextResponse.json({
    store: { id: store.id, name: store.name, inviteCode: store.inviteCode, phone: store.phone },
  });
}
