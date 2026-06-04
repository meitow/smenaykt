import { normalizeRuPhone } from "@/lib/phone";
import type { Task } from "@/lib/types";

type TaskParties = {
  phone: string;
  workerPhone?: string | null;
  status?: string;
  publisherCompletedAt?: string | null;
  workerCompletedAt?: string | null;
};

export function isTaskPublisher(task: Pick<TaskParties, "phone">, phone: string) {
  const normalized = normalizeRuPhone(phone);
  return normalized !== null && normalizeRuPhone(task.phone) === normalized;
}

export function isTaskWorker(task: Pick<TaskParties, "workerPhone">, phone: string) {
  const normalized = normalizeRuPhone(phone);
  return (
    normalized !== null &&
    !!task.workerPhone &&
    normalizeRuPhone(task.workerPhone) === normalized
  );
}

export function userCanConfirmComplete(task: TaskParties, phone: string) {
  if (task.status !== "ACCEPTED") return false;
  if (isTaskPublisher(task, phone)) return !task.publisherCompletedAt;
  if (isTaskWorker(task, phone)) return !task.workerCompletedAt;
  return false;
}

export function userAwaitingCounterparty(task: TaskParties, phone: string) {
  if (task.status !== "ACCEPTED") return false;
  if (isTaskPublisher(task, phone)) {
    return !!task.publisherCompletedAt && !task.workerCompletedAt;
  }
  if (isTaskWorker(task, phone)) {
    return !!task.workerCompletedAt && !task.publisherCompletedAt;
  }
  return false;
}

export function isDualCompleteClosed(task: Pick<TaskParties, "status">) {
  return task.status === "DONE";
}

export function isVerifiedTaskReview(
  review: { reviewerPhone: string; revieweePhone: string },
  task: { status: string; phone: string; workerPhone?: string | null }
) {
  if (task.status !== "DONE") return false;

  const publisherPhone = normalizeRuPhone(task.phone);
  const workerPhone = task.workerPhone ? normalizeRuPhone(task.workerPhone) : null;
  const reviewerPhone = normalizeRuPhone(review.reviewerPhone);
  const revieweePhone = normalizeRuPhone(review.revieweePhone);

  if (!publisherPhone || !workerPhone || !reviewerPhone || !revieweePhone) return false;

  if (revieweePhone === publisherPhone) return reviewerPhone === workerPhone;
  if (revieweePhone === workerPhone) return reviewerPhone === publisherPhone;
  return false;
}

export function taskCompletionLabel(task: TaskParties) {
  if (task.status === "DONE") return "done";
  if (task.publisherCompletedAt && task.workerCompletedAt) return "done";
  if (task.publisherCompletedAt || task.workerCompletedAt) return "awaiting";
  return "accepted";
}
