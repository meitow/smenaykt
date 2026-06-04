"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { EditPartnerTaskForm } from "@/components/EditPartnerTaskForm";
import type { Task } from "@/lib/types";
import { getPartnerInvite, partnerHeaders } from "@/lib/partner-session";
import { t } from "@/lib/i18n";

export default function EditPartnerTaskPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const taskId = params.id;
  const [task, setTask] = useState<Task | null>(null);
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!taskId) return;

    const code = getPartnerInvite();
    if (!code) {
      router.replace("/partner/login");
      return;
    }

    setLoading(true);
    fetch(`/api/partner/tasks/${taskId}`, { headers: partnerHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (data.error || data.task?.status !== "OPEN") {
          setTask(null);
          return;
        }
        setTask(data.task);
        setStoreName(data.store?.name ?? "");
      })
      .catch(() => setTask(null))
      .finally(() => setLoading(false));
  }, [router, taskId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <p className="text-muted">{t("profile.loadingTasks")}</p>;
  }

  if (!task) {
    return (
      <div className="space-y-3">
        <Link href="/partner" className="text-[14px] font-medium text-brand">
          {t("partner.backToDashboard")}
        </Link>
        <p className="text-rose-600">{t("partner.shiftNotFound")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href={`/partner/tasks/${task.id}`} className="inline-block text-[14px] font-medium text-brand">
        {t("partner.backToDashboard")}
      </Link>
      <h1 className="text-[22px] font-bold text-ink">{t("task.edit")}</h1>
      <EditPartnerTaskForm task={task} defaultPlace={storeName} />
    </div>
  );
}
