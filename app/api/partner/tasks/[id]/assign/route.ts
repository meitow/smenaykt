import { NextRequest, NextResponse } from "next/server";
import { getPartnerTaskFromRequest, resolvePartnerStoreFromRequest } from "@/lib/partner-auth";
import { ensureUserProfile } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { toClientTask } from "@/lib/tasks";
import { assertPhoneNotBanned } from "@/lib/ban-list";
import { isValidRuPhone, normalizeRuPhone } from "@/lib/phone";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const store = await resolvePartnerStoreFromRequest(request);
    if (!store) {
      return NextResponse.json({ error: "Нужен ключ партнёра" }, { status: 401 });
    }

    const { id } = await params;
    const result = await getPartnerTaskFromRequest(request, id);

    if (!result) {
      return NextResponse.json({ error: "Смена не найдена" }, { status: 404 });
    }

    const task = result.task;

    if (task.source !== "partner") {
      return NextResponse.json({ error: "Некорректный тип смены" }, { status: 400 });
    }

    if (task.status !== "OPEN") {
      return NextResponse.json({ error: "Смена уже занята" }, { status: 409 });
    }

    const body = await request.json();
    const workerPhone = normalizeRuPhone(String(body.workerPhone ?? "").trim()) ?? "";

    if (!workerPhone || !isValidRuPhone(workerPhone)) {
      return NextResponse.json({ error: "Выберите исполнителя" }, { status: 400 });
    }

    const bannedMessage = await assertPhoneNotBanned(workerPhone);
    if (bannedMessage) {
      return NextResponse.json({ error: bannedMessage }, { status: 403 });
    }

    const storePhone = normalizeRuPhone(result.store.phone);
    if (storePhone && storePhone === workerPhone) {
      return NextResponse.json({ error: "Нельзя назначить номер предприятия" }, { status: 400 });
    }

    const workerProfile = await ensureUserProfile(workerPhone);
    const workerName = workerProfile.name.trim() || "Исполнитель";

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
    console.error("POST /api/partner/tasks/[id]/assign", error);
    return NextResponse.json({ error: "Не удалось назначить исполнителя" }, { status: 500 });
  }
}
