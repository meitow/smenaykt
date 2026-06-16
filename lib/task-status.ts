import { taskCompletionLabel } from "@/lib/task-completion";
import { t } from "@/lib/i18n";
import type { Task } from "@/lib/types";

export type TaskStatusBadge = {
  text: string;
  className: string;
};

/** Shared status chip colors for task lists and partner cabinet. */
export function getTaskStatusBadge(task: Task): TaskStatusBadge {
  const label = taskCompletionLabel(task);

  if (label === "done") {
    return {
      text: t("profile.statusDone"),
      className: "bg-ink/10 text-ink ring-1 ring-ink/10",
    };
  }

  if (label === "awaiting") {
    return {
      text: t("profile.statusAwaitingClose"),
      className: "bg-amber-50 text-amber-900 ring-1 ring-amber-200/80",
    };
  }

  if (task.status === "ACCEPTED") {
    return {
      text: t("profile.statusAccepted"),
      className: "bg-taiga-light text-taiga-dark ring-1 ring-taiga/15",
    };
  }

  return {
    text: t("profile.statusOpen"),
    className: "bg-brand-light/80 text-brand-dark ring-1 ring-brand/15",
  };
}
