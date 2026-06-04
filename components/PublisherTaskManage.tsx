"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { isValidRuPhone, normalizeRuPhone } from "@/lib/phone";
import { getUserPhone } from "@/lib/user-session";
import { t } from "@/lib/i18n";

type PublisherTaskManageProps = {
  taskId: string;
  publisherPhone: string;
};

export function PublisherTaskManage({ taskId, publisherPhone }: PublisherTaskManageProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const userPhone = getUserPhone();
  const isPublisher =
    userPhone &&
    normalizeRuPhone(publisherPhone) === normalizeRuPhone(userPhone) &&
    isValidRuPhone(userPhone);

  if (!isPublisher) return null;

  async function deleteTask() {
    if (!userPhone || !window.confirm(t("task.deleteConfirm"))) return;

    setError("");
    setDeleting(true);

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: userPhone }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Ошибка");
        return;
      }

      router.push("/profile");
      router.refresh();
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Link href={`/tasks/${taskId}/edit`} className="btn-secondary flex-1 text-center !py-3">
          {t("task.edit")}
        </Link>
        <button
          type="button"
          onClick={deleteTask}
          disabled={deleting}
          className="flex-1 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[15px] font-semibold text-rose-700 active:opacity-80 disabled:opacity-50"
        >
          {deleting ? t("task.deleting") : t("task.delete")}
        </button>
      </div>
      {error && <p className="text-center text-[14px] text-rose-600">{error}</p>}
    </div>
  );
}
