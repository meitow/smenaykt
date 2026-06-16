"use client";

import { useCallback } from "react";
import { TaskChatPanel } from "@/components/TaskChatPanel";
import { partnerHeaders } from "@/lib/partner-session";

type PartnerTaskChatPageProps = {
  taskId: string;
  taskTitle: string;
};

export function PartnerTaskChatPage({ taskId, taskTitle }: PartnerTaskChatPageProps) {
  const authHeaders = useCallback((): HeadersInit => partnerHeaders(), []);

  return (
    <TaskChatPanel
      taskId={taskId}
      taskTitle={taskTitle}
      backFallbackHref={`/partner/tasks/${taskId}`}
      authHeaders={authHeaders}
    />
  );
}
