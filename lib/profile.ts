import type { UserProfile as DbUserProfile } from "@prisma/client";
import { normalizeRuPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { toClientTask } from "@/lib/tasks";
import { isVerifiedTaskReview } from "@/lib/task-completion";
import type {
  ProfileData,
  ProfileReview,
  ProfileStats,
  ProfilePendingReview,
  ProfileSummary,
} from "@/lib/types";

export async function lookupUserProfile(phone: string) {
  return prisma.userProfile.findUnique({ where: { phone } });
}

export async function ensureUserProfile(phone: string, name?: string) {
  const existing = await prisma.userProfile.findUnique({ where: { phone } });
  if (existing) {
    if (name?.trim() && !existing.name.trim()) {
      return prisma.userProfile.update({
        where: { phone },
        data: { name: name.trim() },
      });
    }
    return existing;
  }

  return prisma.userProfile.create({
    data: {
      phone,
      name: name?.trim() ?? "",
    },
  });
}

function workerPhoneMatches(workerPhone: string | null | undefined, profilePhone: string) {
  return normalizeRuPhone(workerPhone ?? "") === profilePhone;
}

/** Pay counts once worker confirmed completion (or task fully closed). */
function isWorkerEarningTask(
  task: { workerPhone: string | null; status: string; workerCompletedAt: Date | null },
  profilePhone: string
) {
  if (!workerPhoneMatches(task.workerPhone, profilePhone)) return false;
  if (task.status === "DONE") return true;
  return task.status === "ACCEPTED" && task.workerCompletedAt !== null;
}

async function sumWorkerEarned(profilePhone: string) {
  const rows = await prisma.task.findMany({
    where: {
      workerPhone: { not: null },
      OR: [
        { status: "DONE" },
        { status: "ACCEPTED", workerCompletedAt: { not: null } },
      ],
    },
    select: { pay: true, workerPhone: true, status: true, workerCompletedAt: true },
  });

  return rows
    .filter((row) => isWorkerEarningTask(row, profilePhone))
    .reduce((sum, row) => sum + row.pay, 0);
}

function toProfileReview(row: {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  reviewerPhone: string;
  task: { title: string };
  reviewerName?: string;
}): ProfileReview {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    reviewerName: row.reviewerName ?? row.reviewerPhone,
    taskTitle: row.task.title,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getProfileData(phoneInput: string, limit = 20): Promise<ProfileData | null> {
  const phone = normalizeRuPhone(phoneInput);
  if (!phone) return null;

  const profile = await ensureUserProfile(phone);

  const [
    posted,
    accepted,
    history,
    postedTotal,
    acceptedTotal,
    completedAsWorker,
    completedAsPublisher,
    earnedTotal,
    reviewsRaw,
    doneWithReviews,
  ] = await Promise.all([
    prisma.task.findMany({
      where: { phone },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.task.findMany({
      where: { workerPhone: phone },
      orderBy: { acceptedAt: "desc" },
      take: limit,
    }),
    prisma.task.findMany({
      where: {
        status: "DONE",
        OR: [{ phone }, { workerPhone: phone }],
      },
      orderBy: { completedAt: "desc" },
      take: limit,
    }),
    prisma.task.count({ where: { phone } }),
    prisma.task.count({ where: { workerPhone: phone } }),
    prisma.task.count({ where: { workerPhone: phone, status: "DONE" } }),
    prisma.task.count({ where: { phone, status: "DONE" } }),
    sumWorkerEarned(phone),
    prisma.review.findMany({
      where: {
        revieweePhone: phone,
        task: { status: "DONE" },
      },
      orderBy: { createdAt: "desc" },
      include: {
        task: { select: { title: true, phone: true, workerPhone: true, status: true } },
      },
    }),
    prisma.task.findMany({
      where: {
        status: "DONE",
        OR: [{ phone }, { workerPhone: phone }],
      },
      include: {
        reviews: {
          where: { reviewerPhone: phone },
          select: { id: true },
        },
      },
    }),
  ]);

  const verifiedReviews = reviewsRaw
    .filter((row) => isVerifiedTaskReview(row, row.task))
    .slice(0, limit);

  const reviewerPhones = [...new Set(verifiedReviews.map((r) => r.reviewerPhone))];
  const profiles =
    reviewerPhones.length > 0
      ? await prisma.userProfile.findMany({
          where: { phone: { in: reviewerPhones } },
        })
      : [];
  const nameByPhone = new Map(profiles.map((p) => [p.phone, p.name]));

  const reviewCount = verifiedReviews.length;
  const avgRating =
    reviewCount > 0
      ? Math.round(
          (verifiedReviews.reduce((sum, row) => sum + row.rating, 0) / reviewCount) * 10
        ) / 10
      : null;

  const stats: ProfileStats = {
    postedTotal,
    acceptedTotal,
    completedTotal: completedAsWorker + completedAsPublisher,
    completedAsWorker,
    completedAsPublisher,
    earnedTotal,
    avgRating,
    reviewCount,
  };

  const pendingReviews: ProfilePendingReview[] = doneWithReviews
    .filter((task) => task.reviews.length === 0)
    .map((task) => {
      const isPublisher = normalizeRuPhone(task.phone) === normalizeRuPhone(phone);
      return {
        taskId: task.id,
        title: task.title,
        counterpartyName: isPublisher
          ? task.workerName?.trim() || "Исполнитель"
          : "Заказчик",
      };
    });

  return {
    phone: profile.phone,
    name: profile.name,
    avatarUrl: profile.avatarUrl,
    bio: profile.bio,
    memberSince: profile.createdAt.toISOString(),
    stats,
    posted: posted.map(toClientTask),
    accepted: accepted.map(toClientTask),
    history: history.map(toClientTask),
    reviews: verifiedReviews.map((row) =>
      toProfileReview({
        ...row,
        reviewerName: nameByPhone.get(row.reviewerPhone) || undefined,
      })
    ),
    pendingReviews,
    limit,
  };
}

export async function getProfileSummary(phoneInput: string): Promise<ProfileSummary | null> {
  const phone = normalizeRuPhone(phoneInput);
  if (!phone) return null;

  const profile = await ensureUserProfile(phone);

  const [completedTotal, reviewsRaw] = await Promise.all([
    prisma.task.count({
      where: {
        status: "DONE",
        OR: [{ phone }, { workerPhone: phone }],
      },
    }),
    prisma.review.findMany({
      where: {
        revieweePhone: phone,
        task: { status: "DONE" },
      },
      select: {
        rating: true,
        reviewerPhone: true,
        revieweePhone: true,
        task: { select: { phone: true, workerPhone: true, status: true } },
      },
    }),
  ]);

  const verifiedReviews = reviewsRaw.filter((row) => isVerifiedTaskReview(row, row.task));
  const reviewCount = verifiedReviews.length;
  const avgRating =
    reviewCount > 0
      ? Math.round(
          (verifiedReviews.reduce((sum, row) => sum + row.rating, 0) / reviewCount) * 10
        ) / 10
      : null;

  return {
    name: profile.name,
    avatarUrl: profile.avatarUrl,
    stats: { avgRating, reviewCount, completedTotal },
  };
}

export function serializeUserProfile(row: DbUserProfile) {
  return {
    phone: row.phone,
    name: row.name,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
    memberSince: row.createdAt.toISOString(),
  };
}
