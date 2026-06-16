import { prisma } from "@/lib/prisma";
import { assertPhoneNotBanned } from "@/lib/ban-list";
import type { ChatParticipant } from "@/lib/chat-participants";
import { chatParticipantKey } from "@/lib/chat-participants";
import { createNotification } from "@/lib/notifications";
import { normalizeRuPhone } from "@/lib/phone";

const MAX_MESSAGE_LENGTH = 1000;

export type ChatMessageView = {
  id: string;
  taskId: string;
  senderType: "user" | "partner";
  senderId: string;
  senderLabel: string;
  body: string;
  createdAt: string;
  mine: boolean;
};

export async function listTaskMessages(taskId: string, viewer: ChatParticipant) {
  const rows = await prisma.taskMessage.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  const labels = await resolveSenderLabels(rows);

  return rows.map((row) => ({
    id: row.id,
    taskId: row.taskId,
    senderType: row.senderType as "user" | "partner",
    senderId: row.senderId,
    senderLabel: labels.get(chatParticipantKey(row.senderType as "user" | "partner", row.senderId)) ?? "Участник",
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    mine:
      row.senderType === viewer.type &&
      row.senderId === viewer.id,
  }));
}

async function resolveSenderLabels(
  rows: { senderType: string; senderId: string }[]
) {
  const labels = new Map<string, string>();
  const phones = new Set<string>();
  const storeIds = new Set<string>();

  for (const row of rows) {
    if (row.senderType === "user") phones.add(row.senderId);
    if (row.senderType === "partner") storeIds.add(row.senderId);
  }

  if (phones.size > 0) {
    const profiles = await prisma.userProfile.findMany({
      where: { phone: { in: [...phones] } },
    });
    for (const profile of profiles) {
      const name = profile.name.trim();
      labels.set(chatParticipantKey("user", profile.phone), name || profile.phone);
    }
    for (const phone of phones) {
      const key = chatParticipantKey("user", phone);
      if (!labels.has(key)) labels.set(key, phone);
    }
  }

  if (storeIds.size > 0) {
    const stores = await prisma.store.findMany({
      where: { id: { in: [...storeIds] } },
    });
    for (const store of stores) {
      labels.set(chatParticipantKey("partner", store.id), store.name);
    }
  }

  return labels;
}

export async function sendTaskMessage(input: {
  taskId: string;
  sender: ChatParticipant;
  body: string;
  taskTitle: string;
  notifyRecipientPhone?: string | null;
  notifyRecipientLabel?: string;
}) {
  const body = input.body.trim();
  if (!body) {
    throw new Error("EMPTY_MESSAGE");
  }
  if (body.length > MAX_MESSAGE_LENGTH) {
    throw new Error("MESSAGE_TOO_LONG");
  }

  if (input.sender.type === "user") {
    const bannedMessage = await assertPhoneNotBanned(input.sender.id);
    if (bannedMessage) {
      throw new Error("BANNED");
    }
  }

  const message = await prisma.taskMessage.create({
    data: {
      taskId: input.taskId,
      senderType: input.sender.type,
      senderId: input.sender.id,
      body,
    },
  });

  if (input.notifyRecipientPhone) {
    const recipientPhone = normalizeRuPhone(input.notifyRecipientPhone);
    if (recipientPhone) {
      await createNotification({
        recipientPhone,
        taskId: input.taskId,
        type: "chat_message",
        title: "Новое сообщение",
        body: `«${input.taskTitle}»: ${body.slice(0, 120)}`,
      });
    }
  }

  return message;
}

export async function markTaskChatRead(taskId: string, participant: ChatParticipant) {
  await prisma.taskChatReadState.upsert({
    where: {
      taskId_participantType_participantId: {
        taskId,
        participantType: participant.type,
        participantId: participant.id,
      },
    },
    create: {
      taskId,
      participantType: participant.type,
      participantId: participant.id,
      lastReadAt: new Date(),
    },
    update: {
      lastReadAt: new Date(),
    },
  });
}

export async function countUnreadForUser(phone: string) {
  const threads = await listUserChatThreads(phone);
  return threads.filter((thread) => thread.unread).length;
}

export async function listUserChatThreads(phone: string) {
  const normalized = normalizeRuPhone(phone);
  if (!normalized) return [];

  const tasks = await prisma.task.findMany({
    where: {
      status: { in: ["ACCEPTED", "DONE"] },
      OR: [{ workerPhone: normalized }, { source: "person", phone: normalized }],
    },
    orderBy: { acceptedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      store: true,
    },
  });

  const reads = await prisma.taskChatReadState.findMany({
    where: {
      participantType: "user",
      participantId: normalized,
      taskId: { in: tasks.map((task) => task.id) },
    },
  });
  const readMap = new Map(reads.map((row) => [row.taskId, row.lastReadAt]));

  return tasks.map((task) => {
    const lastMessage = task.messages[0] ?? null;
    const lastRead = readMap.get(task.id) ?? new Date(0);
    const isWorker = Boolean(task.workerPhone && normalizeRuPhone(task.workerPhone) === normalized);
    const counterparty = isWorker
      ? task.source === "partner"
        ? task.store?.name ?? "Предприятие"
        : "Заказчик"
      : task.workerName?.trim() || "Исполнитель";

    return {
      taskId: task.id,
      title: task.title,
      status: task.status,
      counterpartyLabel: counterparty,
      lastMessage: lastMessage
        ? {
            body: lastMessage.body,
            createdAt: lastMessage.createdAt.toISOString(),
          }
        : null,
      unread: Boolean(
        lastMessage &&
          !(lastMessage.senderType === "user" && lastMessage.senderId === normalized) &&
          lastMessage.createdAt > lastRead
      ),
    };
  });
}

export async function listPartnerChatThreads(storeId: string) {
  const tasks = await prisma.task.findMany({
    where: {
      storeId,
      status: { in: ["ACCEPTED", "DONE"] },
    },
    orderBy: { acceptedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const reads = await prisma.taskChatReadState.findMany({
    where: {
      participantType: "partner",
      participantId: storeId,
      taskId: { in: tasks.map((task) => task.id) },
    },
  });
  const readMap = new Map(reads.map((row) => [row.taskId, row.lastReadAt]));

  return tasks.map((task) => {
    const lastMessage = task.messages[0] ?? null;
    const lastRead = readMap.get(task.id) ?? new Date(0);

    return {
      taskId: task.id,
      title: task.title,
      status: task.status,
      counterpartyLabel: task.workerName?.trim() || task.workerPhone || "Исполнитель",
      lastMessage: lastMessage
        ? {
            body: lastMessage.body,
            createdAt: lastMessage.createdAt.toISOString(),
          }
        : null,
      unread: Boolean(
        lastMessage &&
          !(lastMessage.senderType === "partner" && lastMessage.senderId === storeId) &&
          lastMessage.createdAt > lastRead
      ),
    };
  });
}
