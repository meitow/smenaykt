import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { toClientTask } from "@/lib/tasks";

import { isValidRuPhone, normalizeRuPhone } from "@/lib/phone";

import { assertTaskOpen, parsePersonTaskBody, TASK_MUTATION_ERRORS } from "@/lib/task-mutations";



export async function GET(

  _request: NextRequest,

  { params }: { params: Promise<{ id: string }> }

) {

  const { id } = await params;

  const row = await prisma.task.findUnique({ where: { id } });



  if (!row) {

    return NextResponse.json({ error: TASK_MUTATION_ERRORS.NOT_FOUND }, { status: 404 });

  }



  return NextResponse.json(toClientTask(row));

}



export async function PATCH(

  request: NextRequest,

  { params }: { params: Promise<{ id: string }> }

) {

  try {

    const { id } = await params;

    const body = await request.json();

    const phone = normalizeRuPhone(String(body.phone ?? "").trim()) ?? "";



    if (!phone || !isValidRuPhone(phone)) {

      return NextResponse.json({ error: "Укажите телефон в профиле" }, { status: 400 });

    }



    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {

      return NextResponse.json({ error: TASK_MUTATION_ERRORS.NOT_FOUND }, { status: 404 });

    }



    if (normalizeRuPhone(task.phone) !== phone) {

      return NextResponse.json({ error: TASK_MUTATION_ERRORS.FORBIDDEN }, { status: 403 });

    }



    try {

      assertTaskOpen(task);

    } catch {

      return NextResponse.json({ error: TASK_MUTATION_ERRORS.NOT_OPEN }, { status: 409 });

    }



    const parsed = parsePersonTaskBody(body);

    if ("error" in parsed) {

      return NextResponse.json({ error: parsed.error }, { status: 400 });

    }



    const row = await prisma.task.update({

      where: { id },

      data: parsed.data,

    });



    return NextResponse.json(toClientTask(row));

  } catch (error) {

    console.error("PATCH /api/tasks/[id]", error);

    return NextResponse.json({ error: "Не удалось обновить задание" }, { status: 500 });

  }

}



export async function DELETE(

  request: NextRequest,

  { params }: { params: Promise<{ id: string }> }

) {

  try {

    const { id } = await params;

    const body = await request.json().catch(() => ({}));

    const phone = normalizeRuPhone(String(body.phone ?? "").trim()) ?? "";



    if (!phone || !isValidRuPhone(phone)) {

      return NextResponse.json({ error: "Укажите телефон в профиле" }, { status: 400 });

    }



    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {

      return NextResponse.json({ error: TASK_MUTATION_ERRORS.NOT_FOUND }, { status: 404 });

    }



    if (normalizeRuPhone(task.phone) !== phone) {

      return NextResponse.json({ error: TASK_MUTATION_ERRORS.FORBIDDEN }, { status: 403 });

    }



    try {

      assertTaskOpen(task);

    } catch {

      return NextResponse.json({ error: TASK_MUTATION_ERRORS.NOT_OPEN }, { status: 409 });

    }



    await prisma.task.delete({ where: { id } });

    return NextResponse.json({ ok: true });

  } catch (error) {

    console.error("DELETE /api/tasks/[id]", error);

    return NextResponse.json({ error: "Не удалось удалить задание" }, { status: 500 });

  }

}


