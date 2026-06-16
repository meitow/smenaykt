import { notFound } from "next/navigation";
import { MobileTaskChatPage } from "@/components/MobileTaskChatPage";
import { getTaskById } from "@/lib/tasks";

type TaskChatPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TaskChatPage({ params }: TaskChatPageProps) {
  const { id } = await params;
  const task = await getTaskById(id);

  if (!task) {
    notFound();
  }

  return <MobileTaskChatPage taskId={task.id} taskTitle={task.title} />;
}
