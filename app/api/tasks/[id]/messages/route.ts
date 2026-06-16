import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveChatAccess } from "@/lib/chat-participants";
import { listTaskMessages, markTaskChatRead, sendTaskMessage } from "@/lib/chat";
import { normalizeRuPhone } from "@/lib/phone";
import { resolvePartnerStoreFromRequest } from "@/lib/partner-auth";

function userPhoneFromRequest(request: NextRequest) {
  return normalizeRuPhone(request.headers.get("x-user-phone") ?? "");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
    }

    const store = await resolvePartnerStoreFromRequest(request);
    const access = resolveChatAccess(task, {
      userPhone: userPhoneFromRequest(request),
      partnerStoreId: store?.id ?? null,
    });

    if (!access) {
      return NextResponse.json({ error: "Нет доступа к чату" }, { status: 403 });
    }

    const messages = await listTaskMessages(id, access.participant);
    await markTaskChatRead(id, access.participant);

    return NextResponse.json({
      messages,
      canSend: access.canSend,
      role: access.participant.role,
    });
  } catch (error) {
    console.error("GET /api/tasks/[id]/messages", error);
    return NextResponse.json({ error: "Не удалось загрузить сообщения" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const text = String(body.body ?? "").trim();

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: "Задание не найдено" }, { status: 404 });
    }

    const store = await resolvePartnerStoreFromRequest(request);
    const access = resolveChatAccess(task, {
      userPhone: userPhoneFromRequest(request),
      partnerStoreId: store?.id ?? null,
    });

    if (!access) {
      return NextResponse.json({ error: "Нет доступа к чату" }, { status: 403 });
    }

    if (!access.canSend) {
      return NextResponse.json({ error: "Чат закрыт — задание завершено" }, { status: 409 });
    }

    let notifyRecipientPhone: string | null = null;
    if (access.participant.role === "worker") {
      notifyRecipientPhone = task.source === "person" ? task.phone : null;
    } else if (access.participant.role === "publisher") {
      notifyRecipientPhone = task.workerPhone;
    }

    await sendTaskMessage({
      taskId: id,
      sender: access.participant,
      body: text,
      taskTitle: task.title,
      notifyRecipientPhone,
    });

    const messages = await listTaskMessages(id, access.participant);
    await markTaskChatRead(id, access.participant);

    return NextResponse.json({ messages, canSend: access.canSend });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "EMPTY_MESSAGE") {
        return NextResponse.json({ error: "Введите сообщение" }, { status: 400 });
      }
      if (error.message === "MESSAGE_TOO_LONG") {
        return NextResponse.json({ error: "Слишком длинное сообщение" }, { status: 400 });
      }
      if (error.message === "BANNED") {
        return NextResponse.json({ error: "Номер заблокирован" }, { status: 403 });
      }
    }
    console.error("POST /api/tasks/[id]/messages", error);
    return NextResponse.json({ error: "Не удалось отправить сообщение" }, { status: 500 });
  }
}
