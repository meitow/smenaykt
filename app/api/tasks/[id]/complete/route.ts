import { NextRequest, NextResponse } from "next/server";
import { toClientTask } from "@/lib/tasks";
import { isValidRuPhone, normalizeRuPhone } from "@/lib/phone";
import { notifyAfterCompleteConfirm } from "@/lib/notifications";
import { isTaskPublisher, isTaskWorker } from "@/lib/task-completion";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const phone = normalizeRuPhone(String(body.phone ?? "").trim());

    if (!phone || !isValidRuPhone(phone)) {
      return NextResponse.json({ error: "Укажите телефон в профиле" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
    }

    if (task.status === "DONE") {
      return NextResponse.json({ error: "Задание уже завершено" }, { status: 409 });
    }

    if (task.status !== "ACCEPTED") {
      return NextResponse.json({ error: "Задание ещё не принято" }, { status: 409 });
    }

    const asPublisher = isTaskPublisher(task, phone);
    const asWorker = isTaskWorker(task, phone);

    if (!asPublisher && !asWorker) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    const now = new Date();
    const hadPublisherComplete = Boolean(task.publisherCompletedAt);
    const hadWorkerComplete = Boolean(task.workerCompletedAt);
    let publisherCompletedAt = task.publisherCompletedAt;
    let workerCompletedAt = task.workerCompletedAt;

    if (asPublisher) {
      if (publisherCompletedAt) {
        return NextResponse.json({ error: "Вы уже подтвердили выполнение" }, { status: 409 });
      }
      publisherCompletedAt = now;
    }

    if (asWorker) {
      if (workerCompletedAt) {
        return NextResponse.json({ error: "Вы уже подтвердили выполнение" }, { status: 409 });
      }
      workerCompletedAt = now;
    }

    const bothConfirmed = Boolean(publisherCompletedAt && workerCompletedAt);

    const updated = await prisma.task.update({
      where: { id },
      data: {
        publisherCompletedAt,
        workerCompletedAt,
        ...(bothConfirmed ? { status: "DONE", completedAt: now } : {}),
      },
    });

    await notifyAfterCompleteConfirm(
      task,
      asPublisher ? "publisher" : "worker",
      hadPublisherComplete,
      hadWorkerComplete,
      bothConfirmed
    );

    return NextResponse.json({
      ...toClientTask(updated),
      waitingForCounterparty: !bothConfirmed,
    });
  } catch (error) {
    console.error("POST /api/tasks/[id]/complete", error);
    return NextResponse.json({ error: "Не удалось подтвердить выполнение" }, { status: 500 });
  }
}
