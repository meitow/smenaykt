import type { Task } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeRuPhone } from "@/lib/phone";

export type NotificationRow = {
  id: string;
  recipientPhone: string;
  taskId: string;
  type: string;
  title: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
};

export async function createNotification(input: {
  recipientPhone: string;
  taskId: string;
  type: "counterparty_completed" | "task_closed";
  title: string;
  body: string;
}) {
  const recipientPhone = normalizeRuPhone(input.recipientPhone);
  if (!recipientPhone) return null;

  return prisma.notification.create({
    data: {
      recipientPhone,
      taskId: input.taskId,
      type: input.type,
      title: input.title,
      body: input.body,
    },
  });
}

export async function notifyAfterCompleteConfirm(
  task: Task,
  role: "publisher" | "worker",
  hadPublisherComplete: boolean,
  hadWorkerComplete: boolean,
  bothConfirmed: boolean
) {
  const publisherPhone = normalizeRuPhone(task.phone);
  const workerPhone = task.workerPhone ? normalizeRuPhone(task.workerPhone) : null;
  const title = task.title.trim() || "Задание";
  const publisherLabel = task.source === "partner" ? "Предприятие" : "Заказчик";
  const workerLabel = task.workerName?.trim() || "Исполнитель";

  if (role === "publisher" && !hadPublisherComplete && workerPhone && !hadWorkerComplete) {
    await createNotification({
      recipientPhone: workerPhone,
      taskId: task.id,
      type: "counterparty_completed",
      title: "Подтвердите выполнение",
      body: `${publisherLabel} отметил выполнение «${title}». Подтвердите с вашей стороны.`,
    });
  }

  if (role === "worker" && !hadWorkerComplete && publisherPhone && !hadPublisherComplete) {
    await createNotification({
      recipientPhone: publisherPhone,
      taskId: task.id,
      type: "counterparty_completed",
      title: "Подтвердите выполнение",
      body: `${workerLabel} отметил выполнение «${title}». Подтвердите с вашей стороны.`,
    });
  }

  if (!bothConfirmed) return;

  if (role === "publisher" && hadWorkerComplete && workerPhone) {
    await createNotification({
      recipientPhone: workerPhone,
      taskId: task.id,
      type: "task_closed",
      title: "Задание закрыто",
      body: `«${title}» завершено обеими сторонами.`,
    });
  }

  if (role === "worker" && hadPublisherComplete && publisherPhone) {
    await createNotification({
      recipientPhone: publisherPhone,
      taskId: task.id,
      type: "task_closed",
      title: "Задание закрыто",
      body: `«${title}» завершено обеими сторонами.`,
    });
  }
}

export function serializeNotification(row: NotificationRow) {
  return {
    id: row.id,
    taskId: row.taskId,
    type: row.type,
    title: row.title,
    body: row.body,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
