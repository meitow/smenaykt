import { NextRequest, NextResponse } from "next/server";
import { listUserChatThreads } from "@/lib/chat";
import { isValidRuPhone, normalizeRuPhone } from "@/lib/phone";

export async function GET(request: NextRequest) {
  const phone = normalizeRuPhone(request.headers.get("x-user-phone") ?? "");
  if (!phone || !isValidRuPhone(phone)) {
    return NextResponse.json({ error: "Укажите телефон" }, { status: 400 });
  }

  try {
    const threads = await listUserChatThreads(phone);
    return NextResponse.json({ threads });
  } catch (error) {
    console.error("GET /api/chats", error);
    return NextResponse.json({ error: "Не удалось загрузить чаты" }, { status: 500 });
  }
}
