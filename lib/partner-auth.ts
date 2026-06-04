import { prisma } from "@/lib/prisma";

export async function getStoreFromInvite(inviteCode: string) {
  const code = inviteCode.trim().toUpperCase();
  if (!code) return null;
  return prisma.store.findUnique({ where: { inviteCode: code } });
}

export async function getPartnerTaskForStore(taskId: string, inviteCode: string) {
  const store = await getStoreFromInvite(inviteCode);
  if (!store) return null;

  const task = await prisma.task.findFirst({
    where: { id: taskId, storeId: store.id },
  });

  if (!task) return null;
  return { store, task };
}

export function partnerInviteFromRequest(request: Request) {
  return request.headers.get("x-invite-code")?.trim() ?? "";
}
