import { prisma } from "@/lib/prisma";

export async function getStoreFromAccessToken(accessToken: string) {
  const token = accessToken.trim();
  if (!token) return null;
  return prisma.store.findUnique({ where: { accessToken: token } });
}

/** @deprecated Legacy short invite codes */
export async function getStoreFromInvite(inviteCode: string) {
  const code = inviteCode.trim().toUpperCase();
  if (!code) return null;
  return prisma.store.findUnique({ where: { inviteCode: code } });
}

export async function getPartnerTaskForStore(taskId: string, storeId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, storeId },
  });

  if (!task) return null;

  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) return null;

  return { store, task };
}

export function partnerTokenFromRequest(request: Request) {
  return request.headers.get("x-partner-token")?.trim() ?? "";
}

/** @deprecated */
export function partnerInviteFromRequest(request: Request) {
  return request.headers.get("x-invite-code")?.trim() ?? "";
}

export async function resolvePartnerStoreFromRequest(request: Request) {
  const token = partnerTokenFromRequest(request);
  if (token) {
    const store = await getStoreFromAccessToken(token);
    if (store) return store;
  }

  const inviteCode = partnerInviteFromRequest(request);
  if (inviteCode) {
    return getStoreFromInvite(inviteCode);
  }

  return null;
}

export async function getPartnerTaskFromRequest(request: Request, taskId: string) {
  const store = await resolvePartnerStoreFromRequest(request);
  if (!store) return null;
  return getPartnerTaskForStore(taskId, store.id);
}
