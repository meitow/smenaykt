import type { Task } from "@/lib/types";

export function taskSharePath(taskId: string) {
  return `/tasks/${taskId}`;
}

export function getAppOrigin(explicitOrigin?: string) {
  if (explicitOrigin) return explicitOrigin.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function taskShareUrl(taskId: string, origin?: string) {
  return `${getAppOrigin(origin)}${taskSharePath(taskId)}`;
}

export function buildTaskShareMessage(
  task: Task,
  url: string,
  footer: string
) {
  const lines = [
    `${task.emoji} ${task.title}`,
    `${task.pay.toLocaleString("ru-RU")} ₽ · ${task.place}`,
    task.timeLabel,
  ];

  const summary = task.description?.split(/\n+/).map((line) => line.trim()).find(Boolean);
  if (summary) {
    lines.push(summary);
  }

  lines.push("", footer, url);
  return lines.join("\n");
}

export function buildWhatsAppShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function openWhatsAppShare(text: string) {
  const url = buildWhatsAppShareUrl(text);
  window.open(url, "_blank", "noopener,noreferrer");
}
