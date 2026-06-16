import { NextRequest, NextResponse } from "next/server";
import { resolveAdminActor } from "@/lib/admin-auth";
import { getIdentityDocumentFile } from "@/lib/identity-documents";

function unauthorized() {
  return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveAdminActor(request);
  if (!actor) return unauthorized();

  try {
    const { id } = await params;
    const file = await getIdentityDocumentFile(id);
    if (!file) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(file.bytes), {
      headers: {
        "Content-Type": file.mimeType,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/admin/identity/[id]/file", error);
    return NextResponse.json({ error: "Не удалось открыть файл" }, { status: 500 });
  }
}
