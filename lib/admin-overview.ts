import { countPendingIdentityDocuments } from "@/lib/identity-documents";
import { prisma } from "@/lib/prisma";

export async function getAdminOverview() {
  const [openTasks, hiddenTasks, acceptedTasks, doneTasks, bans, moderators, pendingIdentity] =
    await Promise.all([
    prisma.task.count({ where: { status: "OPEN", hidden: false } }),
    prisma.task.count({ where: { hidden: true } }),
    prisma.task.count({ where: { status: "ACCEPTED" } }),
    prisma.task.count({ where: { status: "DONE" } }),
    prisma.bannedPhone.count(),
    prisma.moderatorPhone.count(),
    countPendingIdentityDocuments(),
  ]);

  return {
    openTasks,
    hiddenTasks,
    acceptedTasks,
    doneTasks,
    bans,
    moderators,
    pendingIdentity,
  };
}
