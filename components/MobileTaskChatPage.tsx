"use client";

import { useCallback } from "react";
import { TaskChatPanel } from "@/components/TaskChatPanel";
import { getUserPhone } from "@/lib/user-session";

type MobileTaskChatPageProps = {
  taskId: string;
  taskTitle: string;
};

export function MobileTaskChatPage({ taskId, taskTitle }: MobileTaskChatPageProps) {
  const authHeaders = useCallback((): HeadersInit => {
    const phone = getUserPhone();
    return phone ? { "x-user-phone": phone } : {};
  }, []);

  return (
    <TaskChatPanel
      taskId={taskId}
      taskTitle={taskTitle}
      backHref={`/tasks/${taskId}`}
      authHeaders={authHeaders}
    />
  );
}
