"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatRelativeTime } from "@/lib/datetime";
import { isValidRuPhone } from "@/lib/phone";
import { getUserPhone } from "@/lib/user-session";
import { t } from "@/lib/i18n";

type ChatThread = {
  taskId: string;
  title: string;
  status: string;
  counterpartyLabel: string;
  lastMessage: { body: string; createdAt: string } | null;
  unread: boolean;
};

export function ChatsInbox() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");

  const load = useCallback(async () => {
    const userPhone = getUserPhone();
    setPhone(userPhone);

    if (!userPhone || !isValidRuPhone(userPhone)) {
      setThreads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/chats", {
        headers: { "x-user-phone": userPhone },
      });
      const data = (await res.json()) as { threads?: ChatThread[] };
      setThreads(data.threads ?? []);
    } catch {
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const onUserUpdate = () => void load();
    window.addEventListener("smenaykt_user_updated", onUserUpdate);
    return () => window.removeEventListener("smenaykt_user_updated", onUserUpdate);
  }, [load]);

  const hasPhone = Boolean(phone && isValidRuPhone(phone));

  if (!hasPhone) {
    return (
      <div className="info-card px-4 py-8 text-center">
        <p className="text-[15px] font-medium text-ink">{t("chat.needPhone")}</p>
        <p className="mt-1 text-[14px] text-muted">{t("chat.needPhoneHint")}</p>
        <Link href="/profile" className="mt-4 inline-block text-[15px] font-semibold text-brand">
          {t("chat.needPhoneAction")} →
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="info-card px-4 py-8 text-center text-[14px] text-muted">
        {t("profile.loadingTasks")}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="info-card px-4 py-8 text-center">
        <p className="text-[15px] font-medium text-ink">{t("chat.inboxEmpty")}</p>
        <p className="mt-1 text-[14px] text-muted">{t("chat.inboxEmptyHint")}</p>
      </div>
    );
  }

  return (
    <ul className="info-card divide-y divide-line">
      {threads.map((thread) => (
        <li key={thread.taskId}>
          <Link
            href={`/tasks/${thread.taskId}/chat`}
            className="flex items-start gap-3 px-4 py-3.5 active:bg-page/70"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-light text-[15px] font-bold text-brand-dark">
              {thread.counterpartyLabel.trim().charAt(0).toUpperCase() || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate font-semibold text-ink">{thread.title}</p>
                {thread.lastMessage && (
                  <span className="shrink-0 text-[12px] text-muted">
                    {formatRelativeTime(thread.lastMessage.createdAt)}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-[13px] text-muted">{thread.counterpartyLabel}</p>
              {thread.lastMessage ? (
                <p className="mt-1 truncate text-[14px] text-muted">{thread.lastMessage.body}</p>
              ) : (
                <p className="mt-1 text-[14px] text-muted">{t("chat.empty")}</p>
              )}
            </div>
            {thread.unread && (
              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand" aria-label={t("chat.unread")} />
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
