import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TaskDetailView } from "@/components/TaskDetailView";
import { getTaskById } from "@/lib/tasks";

type TaskDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: TaskDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const task = await getTaskById(id);

  if (!task) {
    return { title: "SmenaYKT" };
  }

  return {
    title: `${task.emoji} ${task.title} · SmenaYKT`,
    description: `${task.pay.toLocaleString("ru-RU")} ₽ · ${task.place} · ${task.timeLabel}`,
  };
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {  const { id } = await params;
  const task = await getTaskById(id);

  if (!task) {
    notFound();
  }

  return <TaskDetailView task={task} />;
}
