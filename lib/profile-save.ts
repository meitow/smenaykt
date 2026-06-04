import { prisma } from "@/lib/prisma";
import { normalizeRuPhone } from "@/lib/phone";

function stripAvatarVersion(avatarUrl: string) {
  return avatarUrl.split("?")[0] ?? avatarUrl;
}

export type SaveProfileInput = {
  phone: string;
  name: string;
  bio: string;
  avatarUrl?: string | null;
};

export async function saveProfilePacket(input: SaveProfileInput) {
  const phone = normalizeRuPhone(input.phone);
  if (!phone) throw new Error("INVALID_PHONE");

  const name = input.name.trim().slice(0, 32);
  const bio = input.bio.trim().slice(0, 280);
  const avatarUrl = input.avatarUrl ? stripAvatarVersion(input.avatarUrl) : null;

  return prisma.userProfile.upsert({
    where: { phone },
    create: {
      phone,
      name,
      bio,
      avatarUrl,
    },
    update: {
      name,
      bio,
      avatarUrl,
    },
  });
}
