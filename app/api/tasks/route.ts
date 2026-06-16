import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toClientTask } from "@/lib/tasks";
import { sanitizeEmoji } from "@/lib/emoji";
import { isValidRuPhone, normalizeRuPhone } from "@/lib/phone";
import {
  combineDateAndTime,
  durationHoursFromRange,
  formatScheduleLabel,
  parseScheduledDate,
  resolveTaskDurationHours,
} from "@/lib/datetime";
import { clampDurationHours } from "@/lib/duration";
import { MAX_TASK_PAY, parseTaskPay } from "@/lib/pay";
import {
  isPartnerOnlyCategory,
  normalizeCategory,
  parsePersonPostCategory,
} from "@/lib/categories";
import {
  TIME_FILTERS,
  matchesTaskSearch,
  resolveWhenRange,
} from "@/lib/task-filters";
import { assertPhoneNotBanned } from "@/lib/ban-list";

function parseCategory(value: string | null) {
  return normalizeCategory(value ?? undefined);
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const source = params.get("source");
    const category = params.get("category");
    const when = params.get("when");
    const scheduledDate = params.get("scheduledDate");
    const durationHours = params.get("durationHours");
    const q = params.get("q")?.trim() ?? "";

    const where: Record<string, unknown> = { status: "OPEN" };

    if (source === "person" || source === "partner") {
      where.source = source;
    }

    const cat = parseCategory(category);
    if (cat) where.category = cat;

    if (when && TIME_FILTERS.includes(when as (typeof TIME_FILTERS)[number]) && when !== "all") {
      const range = resolveWhenRange(
        when as (typeof TIME_FILTERS)[number],
        scheduledDate ?? undefined
      );
      if (range) where.scheduledAt = range;
    }

    const durationFilter =
      durationHours && durationHours !== "all"
        ? clampDurationHours(Number(durationHours))
        : null;

    let rows = await prisma.task.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
    });

    if (durationFilter) {
      rows = rows.filter(
        (row) => resolveTaskDurationHours(row.timeLabel, row.durationHours) === durationFilter
      );
    }

    if (q) {
      rows = rows.filter((row) => matchesTaskSearch(row, q));
    }

    return NextResponse.json(rows.map(toClientTask));
  } catch (error) {
    console.error("GET /api/tasks", error);
    return NextResponse.json({ error: "Не удалось загрузить задания" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const place = String(body.place ?? "").trim();
    const phone = normalizeRuPhone(String(body.phone ?? "").trim()) ?? "";
    const pay = parseTaskPay(body.pay);
    const scheduledDateRaw = String(body.scheduledAt ?? "").trim();
    const timeStart = String(body.timeStart ?? "").trim();
    const timeEnd = String(body.timeEnd ?? "").trim();
    const requestedCategory = parseCategory(String(body.category ?? ""));
    if (requestedCategory && isPartnerOnlyCategory(requestedCategory)) {
      return NextResponse.json(
        {
          error:
            "Продажи и коммерческие услуги доступны только подтверждённым партнёрам. Для личной заявки выберите другой тип.",
        },
        { status: 400 }
      );
    }
    const category = parsePersonPostCategory(String(body.category ?? ""));

    let durationHours = clampDurationHours(Number(body.durationHours) || 0);
    let scheduledAt = scheduledDateRaw && timeStart ? combineDateAndTime(scheduledDateRaw, timeStart) : null;
    let timeLabel = String(body.timeLabel ?? "").trim();

    if (timeStart && timeEnd) {
      const rangeHours = durationHoursFromRange(timeStart, timeEnd);
      if (!rangeHours) {
        return NextResponse.json({ error: "Время окончания должно быть позже начала" }, { status: 400 });
      }
      durationHours = clampDurationHours(rangeHours);
      scheduledAt = combineDateAndTime(scheduledDateRaw, timeStart);
      timeLabel = formatScheduleLabel(scheduledDateRaw, timeStart, timeEnd);
    } else if (!durationHours) {
      durationHours = 2;
      scheduledAt = scheduledDateRaw ? parseScheduledDate(scheduledDateRaw) : null;
    }

    if (!title || !place || !timeLabel || !phone || pay === null) {
      return NextResponse.json(
        { error: `Заполните все поля. Оплата — от 1 до ${MAX_TASK_PAY.toLocaleString("ru-RU")} ₽` },
        { status: 400 }
      );
    }

    if (!isValidRuPhone(phone)) {
      return NextResponse.json({ error: "Введите телефон: +7 и 10 цифр" }, { status: 400 });
    }

    const bannedMessage = await assertPhoneNotBanned(phone);
    if (bannedMessage) {
      return NextResponse.json({ error: bannedMessage }, { status: 403 });
    }

    if (!scheduledAt) {
      return NextResponse.json({ error: "Укажите дату" }, { status: 400 });
    }

    const row = await prisma.task.create({
      data: {
        source: "person",
        title,
        description,
        category,
        durationHours,
        pay,
        place,
        timeLabel,
        scheduledAt,
        phone,
        emoji: sanitizeEmoji(String(body.emoji ?? "📋")),
        lmkRequired: false,
      },
    });

    return NextResponse.json(toClientTask(row), { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks", error);
    return NextResponse.json({ error: "Не удалось создать задание" }, { status: 500 });
  }
}
