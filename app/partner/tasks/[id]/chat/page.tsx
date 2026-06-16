"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PartnerTaskChatPage } from "@/components/partner/PartnerTaskChatPage";
import { getPartnerToken, partnerHeaders } from "@/lib/partner-session";
import { t } from "@/lib/i18n";

export default function PartnerTaskChatRoute() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getPartnerToken();
    if (!token) {
      router.replace("/partner/login");
      return;
    }

    fetch(`/api/partner/tasks/${params.id}`, { headers: partnerHeaders() })
      .then(async (res) => {
        const data = (await res.json()) as { task?: { title?: string }; error?: string };
        if (!res.ok) {
          setError(data.error ?? t("partner.shiftNotFound"));
          return;
        }
        setTitle(data.task?.title ?? t("chat.subtitle"));
      })
      .catch(() => setError(t("partner.loadError")));
  }, [params.id, router]);

  if (error) {
    return (
      <p className="flex flex-1 items-center justify-center px-4 text-[14px] text-rose-600">{error}</p>
    );
  }

  if (!title) {
    return (
      <p className="flex flex-1 items-center justify-center px-4 text-[14px] text-muted">{t("profile.loadingTasks")}</p>
    );
  }

  return <PartnerTaskChatPage taskId={params.id} taskTitle={title} />;
}
