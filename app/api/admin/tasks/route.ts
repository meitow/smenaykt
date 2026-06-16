import { NextRequest, NextResponse } from "next/server";
import { deleteAdminTask, listAdminTasks, setTaskHidden } from "@/lib/admin-tasks";
import { resolveAdminActor } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  if (!(await resolveAdminActor(request))) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  try {
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? 50);
    const tasks = await listAdminTasks(limit);
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("GET /api/admin/tasks", error);
    return NextResponse.json({ error: "Не удалось загрузить задания" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await resolveAdminActor(request))) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const taskId = String(body.taskId ?? "").trim();
    const action = String(body.action ?? "").trim();

    if (!taskId) {
      return NextResponse.json({ error: "Укажите задание" }, { status: 400 });
    }

    if (action === "hide") {
      await setTaskHidden(taskId, true);
      return NextResponse.json({ ok: true });
    }

    if (action === "restore") {
      await setTaskHidden(taskId, false);
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      await deleteAdminTask(taskId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/admin/tasks", error);
    return NextResponse.json({ error: "Не удалось обновить задание" }, { status: 500 });
  }
}
