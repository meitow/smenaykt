import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toClientTask } from "@/lib/tasks";
import { isValidRuPhone, normalizeRuPhone } from "@/lib/phone";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const workerName = String(body.workerName ?? "").trim();
    const workerPhone = normalizeRuPhone(String(body.workerPhone ?? "").trim()) ?? "";

    if (!workerName) {
      return NextResponse.json({ error: "Укажите имя в профиле" }, { status: 400 });
    }

    if (!workerPhone || !isValidRuPhone(workerPhone)) {
      return NextResponse.json({ error: "Укажите телефон в профиле" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
    }

    if (task.status !== "OPEN") {
      return NextResponse.json({ error: "Задание уже занято" }, { status: 409 });
    }

    const publisherPhone = normalizeRuPhone(task.phone);
    if (publisherPhone && publisherPhone === workerPhone) {
      return NextResponse.json({ error: "Нельзя взять своё задание" }, { status: 400 });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: "ACCEPTED",
        workerName,
        workerPhone,
        acceptedAt: new Date(),
      },
    });

    return NextResponse.json(toClientTask(updated));
  } catch (error) {
    console.error("POST /api/tasks/[id]/accept", error);
    return NextResponse.json({ error: "Не удалось принять задание" }, { status: 500 });
  }
}
