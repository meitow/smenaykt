import { prisma } from "@/lib/prisma";

export async function getAdminOverview() {
  const [openTasks, hiddenTasks, acceptedTasks, doneTasks, bans, moderators] = await Promise.all([
    prisma.task.count({ where: { status: "OPEN", hidden: false } }),
    prisma.task.count({ where: { hidden: true } }),
    prisma.task.count({ where: { status: "ACCEPTED" } }),
    prisma.task.count({ where: { status: "DONE" } }),
    prisma.bannedPhone.count(),
    prisma.moderatorPhone.count(),
  ]);

  return {
    openTasks,
    hiddenTasks,
    acceptedTasks,
    doneTasks,
    bans,
    moderators,
  };
}
