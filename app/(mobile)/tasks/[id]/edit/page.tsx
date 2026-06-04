import Link from "next/link";
import { notFound } from "next/navigation";
import { EditPersonTaskForm } from "@/components/EditPersonTaskForm";
import { getTaskById } from "@/lib/tasks";
import { t } from "@/lib/i18n";

type EditTaskPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPersonTaskPage({ params }: EditTaskPageProps) {
  const { id } = await params;
  const task = await getTaskById(id);

  if (!task || task.source !== "person") {
    notFound();
  }

  if (task.status !== "OPEN") {
    notFound();
  }

  return (
    <div className="space-y-4 pb-8">
      <Link href={`/tasks/${task.id}`} className="inline-block text-[14px] font-medium text-brand">
        {t("task.backToList")}
      </Link>
      <h1 className="page-title">{t("task.edit")}</h1>
      <EditPersonTaskForm task={task} />
    </div>
  );
}
