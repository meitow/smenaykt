import type { Task } from "@prisma/client";
import { normalizeRuPhone } from "@/lib/phone";

export type ChatParticipantType = "user" | "partner";

export type ChatParticipant = {
  type: ChatParticipantType;
  id: string;
  role: "publisher" | "worker";
};

export type ChatAccessContext = {
  participant: ChatParticipant;
  canSend: boolean;
};

function normalizedPhone(phone: string | null | undefined) {
  return phone ? normalizeRuPhone(phone) : null;
}

export function resolveChatAccess(
  task: Task,
  input: { userPhone?: string | null; partnerStoreId?: string | null }
): ChatAccessContext | null {
  if (task.status !== "ACCEPTED" && task.status !== "DONE") {
    return null;
  }

  const userPhone = normalizedPhone(input.userPhone);
  const workerPhone = normalizedPhone(task.workerPhone);

  if (userPhone && workerPhone && userPhone === workerPhone) {
    return {
      participant: { type: "user", id: userPhone, role: "worker" },
      canSend: task.status === "ACCEPTED",
    };
  }

  if (task.source === "person") {
    const publisherPhone = normalizedPhone(task.phone);
    if (userPhone && publisherPhone && userPhone === publisherPhone) {
      return {
        participant: { type: "user", id: userPhone, role: "publisher" },
        canSend: task.status === "ACCEPTED",
      };
    }
  }

  if (task.source === "partner" && task.storeId && input.partnerStoreId === task.storeId) {
    return {
      participant: { type: "partner", id: task.storeId, role: "publisher" },
      canSend: task.status === "ACCEPTED",
    };
  }

  return null;
}

export function chatParticipantKey(type: ChatParticipantType, id: string) {
  return `${type}:${id}`;
}
