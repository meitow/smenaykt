import { NextRequest, NextResponse } from "next/server";
import { getPartnerTaskFromRequest, resolvePartnerStoreFromRequest } from "@/lib/partner-auth";
import { prisma } from "@/lib/prisma";
import { toClientTask } from "@/lib/tasks";
import {
  assertTaskOpen,
  parsePartnerTaskBody,
  TASK_MUTATION_ERRORS,
} from "@/lib/task-mutations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const store = await resolvePartnerStoreFromRequest(request);
  if (!store) {
    return NextResponse.json({ error: "Нужен ключ партнёра" }, { status: 401 });
  }

  const { id } = await params;
  const result = await getPartnerTaskFromRequest(request, id);

  if (!result) {
    return NextResponse.json({ error: "Смена не найдена" }, { status: 404 });
  }

  return NextResponse.json({
    store: { id: result.store.id, name: result.store.name, phone: result.store.phone },
    task: toClientTask(result.task),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const store = await resolvePartnerStoreFromRequest(request);
    if (!store) {
      return NextResponse.json({ error: "Нужен ключ партнёра" }, { status: 401 });
    }

    const { id } = await params;
    const result = await getPartnerTaskFromRequest(request, id);
    if (!result) {
      return NextResponse.json({ error: TASK_MUTATION_ERRORS.NOT_FOUND }, { status: 404 });
    }

    try {
      assertTaskOpen(result.task);
    } catch {
      return NextResponse.json({ error: TASK_MUTATION_ERRORS.NOT_OPEN }, { status: 409 });
    }

    const body = await request.json();
    const parsed = parsePartnerTaskBody(body, result.store.name);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const row = await prisma.task.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(toClientTask(row));
  } catch (error) {
    console.error("PATCH /api/partner/tasks/[id]", error);
    return NextResponse.json({ error: "Не удалось обновить смену" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const store = await resolvePartnerStoreFromRequest(request);
    if (!store) {
      return NextResponse.json({ error: "Нужен ключ партнёра" }, { status: 401 });
    }

    const { id } = await params;
    const result = await getPartnerTaskFromRequest(request, id);
    if (!result) {
      return NextResponse.json({ error: TASK_MUTATION_ERRORS.NOT_FOUND }, { status: 404 });
    }

    try {
      assertTaskOpen(result.task);
    } catch {
      return NextResponse.json({ error: TASK_MUTATION_ERRORS.NOT_OPEN }, { status: 409 });
    }

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/partner/tasks/[id]", error);
    return NextResponse.json({ error: "Не удалось удалить смену" }, { status: 500 });
  }
}
