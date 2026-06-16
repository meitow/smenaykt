import { NextRequest, NextResponse } from "next/server";
import { resolveAdminActor } from "@/lib/admin-auth";
import { reviewIdentitySubmission } from "@/lib/identity-documents";

function unauthorized() {
  return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveAdminActor(request);
  if (!actor) return unauthorized();

  try {
    const { id } = await params;
    const body = await request.json();
    const action = body.action === "reject" ? "reject" : "approve";
    const reviewer = actor.phone ?? (actor.viaSecret ? "owner" : "moderator");

    const result = await reviewIdentitySubmission({
      id,
      action,
      reviewer,
      rejectReason: String(body.rejectReason ?? ""),
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
      }
      if (error.message === "NOT_PENDING") {
        return NextResponse.json({ error: "Заявка уже обработана" }, { status: 409 });
      }
    }
    console.error("POST /api/admin/identity/[id]/review", error);
    return NextResponse.json({ error: "Не удалось обновить статус" }, { status: 500 });
  }
}
