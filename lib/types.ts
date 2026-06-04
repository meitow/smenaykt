import type { TaskCategory } from "@/lib/categories";

export type TaskSource = "person" | "partner";

export type TaskStatus = "OPEN" | "ACCEPTED" | "DONE";

export type Task = {
  id: string;
  source: TaskSource;
  title: string;
  description: string;
  category: TaskCategory;
  durationHours: number;
  pay: number;
  place: string;
  timeLabel: string;
  scheduledAt?: string | null;
  emoji: string;
  lmkRequired: boolean;
  phone: string;
  status?: TaskStatus;
  workerName?: string | null;
  workerPhone?: string | null;
  acceptedAt?: string | null;
  publisherCompletedAt?: string | null;
  workerCompletedAt?: string | null;
  completedAt?: string | null;
};

export type ProfileStats = {
  postedTotal: number;
  acceptedTotal: number;
  completedTotal: number;
  completedAsWorker: number;
  completedAsPublisher: number;
  earnedTotal: number;
  avgRating: number | null;
  reviewCount: number;
};

export type ProfileReview = {
  id: string;
  rating: number;
  comment: string;
  reviewerName: string;
  taskTitle: string;
  createdAt: string;
};

export type ProfilePendingReview = {
  taskId: string;
  title: string;
  counterpartyName: string;
};

export type ProfileSummary = {
  name: string;
  avatarUrl: string | null;
  stats: Pick<ProfileStats, "avgRating" | "reviewCount" | "completedTotal">;
};

export type ProfileData = {
  phone: string;
  name: string;
  avatarUrl: string | null;
  bio: string;
  memberSince: string;
  stats: ProfileStats;
  posted: Task[];
  accepted: Task[];
  history: Task[];
  reviews: ProfileReview[];
  pendingReviews: ProfilePendingReview[];
  limit: number;
};

export type CreatePersonTaskInput = {
  title: string;
  description?: string;
  category?: TaskCategory;
  durationHours?: number;
  pay: number;
  place: string;
  timeLabel: string;
  scheduledAt?: string;
  phone: string;
  emoji?: string;
};

export type CreatePartnerTaskInput = {
  inviteCode: string;
  title: string;
  pay: number;
  place: string;
  timeLabel: string;
  lmkRequired?: boolean;
  emoji?: string;
  durationHours?: number;
};
