import { NextRequest, NextResponse } from "next/server";
import { ensureUserProfile } from "@/lib/profile";
import { isTaskPublisher, isTaskWorker, isVerifiedTaskReview } from "@/lib/task-completion";
import { assertPhoneNotBanned } from "@/lib/ban-list";
import { isValidRuPhone, normalizeRuPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const taskId = String(request.nextUrl.searchParams.get("taskId") ?? "").trim();
    const phone = normalizeRuPhone(request.nextUrl.searchParams.get("phone") ?? "");

    if (!taskId) {
      return NextResponse.json({ error: "Задание не указано" }, { status: 400 });
    }

    if (!phone || !isValidRuPhone(phone)) {
      return NextResponse.json({ error: "Укажите телефон в профиле" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });

    if (!task) {
      return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
    }

    const existing = await prisma.review.findUnique({
      where: { taskId_reviewerPhone: { taskId, reviewerPhone: phone } },
    });

    const isParticipant =
      isTaskPublisher(task, phone) || isTaskWorker(task, phone);
    const dualClosed =
      task.status === "DONE" && task.publisherCompletedAt && task.workerCompletedAt;

    const asPublisher = isTaskPublisher(task, phone);
    const counterpartyName = asPublisher
      ? task.workerName?.trim() || "Исполнитель"
      : "Заказчик";

    return NextResponse.json({
      canReview: Boolean(isParticipant && dualClosed && !existing),
      alreadyReviewed: Boolean(existing),
      counterpartyName,
    });
  } catch (error) {
    console.error("GET /api/reviews", error);
    return NextResponse.json({ error: "Не удалось проверить отзыв" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const reviewerPhone = normalizeRuPhone(String(body.reviewerPhone ?? "").trim());
    const taskId = String(body.taskId ?? "").trim();
    const rating = Number(body.rating);
    const comment = String(body.comment ?? "").trim().slice(0, 500);

    if (!reviewerPhone || !isValidRuPhone(reviewerPhone)) {
      return NextResponse.json({ error: "Укажите телефон в профиле" }, { status: 400 });
    }

    const bannedMessage = await assertPhoneNotBanned(reviewerPhone);
    if (bannedMessage) {
      return NextResponse.json({ error: bannedMessage }, { status: 403 });
    }

    if (!taskId) {
      return NextResponse.json({ error: "Задание не указано" }, { status: 400 });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Оценка от 1 до 5" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });

    if (!task) {
      return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
    }

    if (task.status !== "DONE" || !task.publisherCompletedAt || !task.workerCompletedAt) {
      return NextResponse.json(
        { error: "Отзыв можно оставить после подтверждения обеими сторонами" },
        { status: 409 }
      );
    }

    const publisherPhone = normalizeRuPhone(task.phone);
    const workerPhone = task.workerPhone ? normalizeRuPhone(task.workerPhone) : null;

    let revieweePhone: string | null = null;

    if (publisherPhone === reviewerPhone && workerPhone) {
      revieweePhone = workerPhone;
    } else if (workerPhone === reviewerPhone && publisherPhone) {
      revieweePhone = publisherPhone;
    }

    if (!revieweePhone) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    if (
      !isVerifiedTaskReview(
        { reviewerPhone, revieweePhone },
        { status: task.status, phone: task.phone, workerPhone: task.workerPhone }
      )
    ) {
      return NextResponse.json({ error: "Отзыв только для участников задания" }, { status: 403 });
    }

    const existing = await prisma.review.findUnique({
      where: {
        taskId_reviewerPhone: { taskId, reviewerPhone },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Вы уже оставили отзыв" }, { status: 409 });
    }

    await ensureUserProfile(reviewerPhone, String(body.reviewerName ?? "").trim() || undefined);

    const review = await prisma.review.create({
      data: {
        taskId,
        reviewerPhone,
        revieweePhone,
        rating,
        comment,
      },
      include: { task: { select: { title: true } } },
    });

    return NextResponse.json({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      taskTitle: review.task.title,
      createdAt: review.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("POST /api/reviews", error);
    return NextResponse.json({ error: "Не удалось сохранить отзыв" }, { status: 500 });
  }
}
