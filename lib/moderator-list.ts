import { prisma } from "@/lib/prisma";
import { isValidRuPhone, normalizeRuPhone } from "@/lib/phone";

export async function ensureEnvModerators() {
  const raw = process.env.MODERATOR_PHONES?.trim();
  if (!raw) return;

  const phones = raw
    .split(",")
    .map((item) => normalizeRuPhone(item.trim()))
    .filter((phone): phone is string => Boolean(phone && isValidRuPhone(phone)));

  await Promise.all(
    phones.map((phone) =>
      prisma.moderatorPhone.upsert({
        where: { phone },
        create: { phone, name: "Env", addedBy: "env" },
        update: {},
      })
    )
  );
}

export async function isPhoneModerator(phone: string): Promise<boolean> {
  await ensureEnvModerators();

  const normalized = normalizeRuPhone(phone);
  if (!normalized) return false;

  const row = await prisma.moderatorPhone.findUnique({ where: { phone: normalized } });
  return Boolean(row);
}

export async function listModerators() {
  await ensureEnvModerators();
  return prisma.moderatorPhone.findMany({ orderBy: { createdAt: "desc" } });
}

export async function addModerator(input: { phone: string; name?: string; addedBy?: string }) {
  const normalized = normalizeRuPhone(input.phone);
  if (!normalized) {
    throw new Error("INVALID_PHONE");
  }

  return prisma.moderatorPhone.upsert({
    where: { phone: normalized },
    create: {
      phone: normalized,
      name: input.name?.trim() ?? "",
      addedBy: input.addedBy?.trim() ?? "",
    },
    update: {
      name: input.name?.trim() ?? "",
      addedBy: input.addedBy?.trim() ?? "",
    },
  });
}

export async function removeModerator(phone: string) {
  const normalized = normalizeRuPhone(phone);
  if (!normalized) {
    throw new Error("INVALID_PHONE");
  }

  await prisma.moderatorPhone.deleteMany({ where: { phone: normalized } });
}
