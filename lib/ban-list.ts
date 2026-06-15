import { prisma } from "@/lib/prisma";
import { normalizeRuPhone } from "@/lib/phone";

export const BANNED_PHONE_MESSAGE =
  "Этот номер заблокирован. Если это ошибка — напишите в поддержку SmenaYKT.";

export async function isPhoneBanned(phone: string): Promise<boolean> {
  const normalized = normalizeRuPhone(phone);
  if (!normalized) return false;

  const row = await prisma.bannedPhone.findUnique({ where: { phone: normalized } });
  return Boolean(row);
}

export async function assertPhoneNotBanned(phone: string): Promise<string | null> {
  if (await isPhoneBanned(phone)) {
    return BANNED_PHONE_MESSAGE;
  }
  return null;
}

export async function listBannedPhones() {
  return prisma.bannedPhone.findMany({ orderBy: { createdAt: "desc" } });
}

export async function banPhone(input: {
  phone: string;
  reason?: string;
  bannedBy?: string;
}) {
  const normalized = normalizeRuPhone(input.phone);
  if (!normalized) {
    throw new Error("INVALID_PHONE");
  }

  return prisma.bannedPhone.upsert({
    where: { phone: normalized },
    create: {
      phone: normalized,
      reason: input.reason?.trim() ?? "",
      bannedBy: input.bannedBy?.trim() ?? "",
    },
    update: {
      reason: input.reason?.trim() ?? "",
      bannedBy: input.bannedBy?.trim() ?? "",
    },
  });
}

export async function unbanPhone(phone: string) {
  const normalized = normalizeRuPhone(phone);
  if (!normalized) {
    throw new Error("INVALID_PHONE");
  }

  await prisma.bannedPhone.deleteMany({ where: { phone: normalized } });
}
