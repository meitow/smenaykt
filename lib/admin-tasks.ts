import { prisma } from "@/lib/prisma";
import { toClientTask } from "@/lib/tasks";

export async function listAdminTasks(limit = 50) {
  const rows = await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 100),
  });

  return rows.map((row) => ({
    ...toClientTask(row),
    hidden: row.hidden,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function setTaskHidden(taskId: string, hidden: boolean) {
  return prisma.task.update({
    where: { id: taskId },
    data: { hidden },
  });
}

export async function deleteAdminTask(taskId: string) {
  await prisma.task.delete({ where: { id: taskId } });
}
