import { prisma } from "@/lib/prisma";
import { assertPhoneNotBanned } from "@/lib/ban-list";
import {
  assertPrivateStorageBackend,
  buildIdentityStorageKey,
  getPrivateStorageBackend,
  readPrivateFile,
  savePrivateFile,
} from "@/lib/private-storage";
import { isValidRuPhone, normalizeRuPhone } from "@/lib/phone";
import { ensureUserProfile } from "@/lib/profile";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["application/pdf", "pdf"],
]);

export type IdentityPublicStatus = "none" | "pending" | "approved" | "rejected";

export type IdentitySubmissionView = {
  id: string;
  phone: string;
  status: string;
  mimeType: string;
  fileSize: number;
  rejectReason: string;
  reviewedAt: string | null;
  createdAt: string;
  profileName: string;
};

function toPublicStatus(
  verified: boolean,
  latest: { status: string } | null
): IdentityPublicStatus {
  if (verified) return "approved";
  if (!latest) return "none";
  if (latest.status === "pending") return "pending";
  if (latest.status === "rejected") return "rejected";
  return "none";
}

export async function getIdentityStatusForPhone(phone: string) {
  const normalized = normalizeRuPhone(phone);
  if (!normalized) {
    return { status: "none" as IdentityPublicStatus };
  }

  const profile = await prisma.userProfile.findUnique({ where: { phone: normalized } });
  const latest = await prisma.identityDocument.findFirst({
    where: { phone: normalized },
    orderBy: { createdAt: "desc" },
  });

  const status = toPublicStatus(Boolean(profile?.identityVerified), latest);

  return {
    status,
    rejectReason: status === "rejected" ? latest?.rejectReason ?? "" : "",
    submittedAt: latest?.createdAt.toISOString() ?? null,
    reviewedAt: latest?.reviewedAt?.toISOString() ?? null,
  };
}

export async function submitIdentityDocument(input: {
  phone: string;
  file: File;
  consent: boolean;
}) {
  const phone = normalizeRuPhone(input.phone);
  if (!phone || !isValidRuPhone(phone)) {
    throw new Error("PHONE_REQUIRED");
  }

  const bannedMessage = await assertPhoneNotBanned(phone);
  if (bannedMessage) {
    throw new Error("BANNED");
  }

  if (!input.consent) {
    throw new Error("CONSENT_REQUIRED");
  }

  const profile = await prisma.userProfile.findUnique({ where: { phone } });
  if (profile?.identityVerified) {
    throw new Error("ALREADY_VERIFIED");
  }

  const pending = await prisma.identityDocument.findFirst({
    where: { phone, status: "pending" },
  });
  if (pending) {
    throw new Error("PENDING_EXISTS");
  }

  if (!(input.file instanceof File)) {
    throw new Error("FILE_REQUIRED");
  }

  if (input.file.size > MAX_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }

  const ext = ALLOWED_MIME.get(input.file.type);
  if (!ext) {
    throw new Error("FILE_TYPE");
  }

  const bytes = Buffer.from(await input.file.arrayBuffer());
  const storageBackend = getPrivateStorageBackend();
  const storageKey = buildIdentityStorageKey(phone, ext);

  await savePrivateFile(storageKey, bytes, storageBackend);
  await ensureUserProfile(phone);

  await prisma.identityDocument.create({
    data: {
      phone,
      storageKey,
      storageBackend,
      mimeType: input.file.type,
      fileSize: input.file.size,
      consentAt: new Date(),
      status: "pending",
    },
  });

  return getIdentityStatusForPhone(phone);
}

export async function listIdentitySubmissions(status?: string) {
  const where = status ? { status } : undefined;
  const rows = await prisma.identityDocument.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { profile: true },
  });

  return rows.map(
    (row): IdentitySubmissionView => ({
      id: row.id,
      phone: row.phone,
      status: row.status,
      mimeType: row.mimeType,
      fileSize: row.fileSize,
      rejectReason: row.rejectReason,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      profileName: row.profile.name.trim() || row.phone,
    })
  );
}

export async function reviewIdentitySubmission(input: {
  id: string;
  action: "approve" | "reject";
  reviewer: string;
  rejectReason?: string;
}) {
  const row = await prisma.identityDocument.findUnique({ where: { id: input.id } });
  if (!row) {
    throw new Error("NOT_FOUND");
  }

  if (row.status !== "pending") {
    throw new Error("NOT_PENDING");
  }

  const now = new Date();
  const reviewer = input.reviewer.trim() || "moderator";

  if (input.action === "approve") {
    await prisma.$transaction([
      prisma.identityDocument.update({
        where: { id: row.id },
        data: {
          status: "approved",
          reviewedAt: now,
          reviewedBy: reviewer,
          rejectReason: "",
        },
      }),
      prisma.userProfile.update({
        where: { phone: row.phone },
        data: {
          identityVerified: true,
          identityVerifiedAt: now,
        },
      }),
    ]);
    return { status: "approved" };
  }

  await prisma.identityDocument.update({
    where: { id: row.id },
    data: {
      status: "rejected",
      reviewedAt: now,
      reviewedBy: reviewer,
      rejectReason: String(input.rejectReason ?? "").trim(),
    },
  });

  return { status: "rejected" };
}

export async function getIdentityDocumentFile(id: string) {
  const row = await prisma.identityDocument.findUnique({ where: { id } });
  if (!row) return null;

  const bytes = await readPrivateFile(
    row.storageKey,
    assertPrivateStorageBackend(row.storageBackend)
  );
  if (!bytes) return null;

  return { bytes, mimeType: row.mimeType };
}

export async function countPendingIdentityDocuments() {
  return prisma.identityDocument.count({ where: { status: "pending" } });
}
