import { NextRequest, NextResponse } from "next/server";
import { getStoreFromInvite, partnerInviteFromRequest } from "@/lib/partner-auth";
import { prisma } from "@/lib/prisma";
import { toClientTask } from "@/lib/tasks";
import { sanitizeEmoji } from "@/lib/emoji";
import { MAX_TASK_PAY, parseTaskPay } from "@/lib/pay";
import {
  combineDateAndTime,
  durationHoursFromRange,
  formatScheduleLabel,
} from "@/lib/datetime";
import {
  PARTNER_DEFAULT_CATEGORY,
  parsePartnerCategory,
} from "@/lib/categories";

export async function GET(request: NextRequest) {
  const inviteCode = partnerInviteFromRequest(request);
  if (!inviteCode) {
    return NextResponse.json({ error: "Нужен код партнёра" }, { status: 401 });
  }

  const store = await getStoreFromInvite(inviteCode);
  if (!store) {
    return NextResponse.json({ error: "Неверный код" }, { status: 401 });
  }

  const rows = await prisma.task.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    store: { id: store.id, name: store.name, phone: store.phone },
    tasks: rows.map(toClientTask),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const inviteCode = String(body.inviteCode ?? request.headers.get("x-invite-code") ?? "").trim();

  const store = await getStoreFromInvite(inviteCode);
  if (!store) {
    return NextResponse.json({ error: "Неверный код партнёра" }, { status: 401 });
  }

  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const place = String(body.place ?? store.name).trim();
  const scheduledDateRaw = String(body.scheduledAt ?? "").trim();
  const timeStart = String(body.timeStart ?? "").trim();
  const timeEnd = String(body.timeEnd ?? "").trim();
  const pay = parseTaskPay(body.pay);

  let timeLabel = String(body.timeLabel ?? "").trim();
  let durationHours = Math.min(12, Math.max(1, Number(body.durationHours) || 8));
  let scheduledAt =
    scheduledDateRaw && timeStart ? combineDateAndTime(scheduledDateRaw, timeStart) : null;

  if (timeStart && timeEnd && scheduledDateRaw) {
    const rangeHours = durationHoursFromRange(timeStart, timeEnd);
    if (!rangeHours) {
      return NextResponse.json({ error: "Время окончания должно быть позже начала" }, { status: 400 });
    }
    durationHours = rangeHours;
    scheduledAt = combineDateAndTime(scheduledDateRaw, timeStart);
    timeLabel = formatScheduleLabel(scheduledDateRaw, timeStart, timeEnd);
  }

  if (!title || !timeLabel || pay === null) {
    return NextResponse.json(
      { error: `Заполните все поля. Оплата — до ${MAX_TASK_PAY.toLocaleString("ru-RU")} ₽` },
      { status: 400 }
    );
  }

  if (!scheduledAt) {
    return NextResponse.json({ error: "Укажите дату и время" }, { status: 400 });
  }

  const category =
    parsePartnerCategory(String(body.category ?? "")) ?? PARTNER_DEFAULT_CATEGORY;

  const row = await prisma.task.create({
    data: {
      source: "partner",
      storeId: store.id,
      title,
      description,
      pay,
      place,
      timeLabel,
      scheduledAt,
      phone: store.phone,
      emoji: sanitizeEmoji(String(body.emoji ?? "🛒")),
      category,
      durationHours,
      lmkRequired: Boolean(body.lmkRequired),
    },
  });

  return NextResponse.json(toClientTask(row), { status: 201 });
}