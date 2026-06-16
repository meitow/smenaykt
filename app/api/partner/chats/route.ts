import { NextRequest, NextResponse } from "next/server";
import { listPartnerChatThreads } from "@/lib/chat";
import { resolvePartnerStoreFromRequest } from "@/lib/partner-auth";

export async function GET(request: NextRequest) {
  const store = await resolvePartnerStoreFromRequest(request);
  if (!store) {
    return NextResponse.json({ error: "Нужен ключ партнёра" }, { status: 401 });
  }

  try {
    const threads = await listPartnerChatThreads(store.id);
    return NextResponse.json({ threads, store: { id: store.id, name: store.name } });
  } catch (error) {
    console.error("GET /api/partner/chats", error);
    return NextResponse.json({ error: "Не удалось загрузить чаты" }, { status: 500 });
  }
}
