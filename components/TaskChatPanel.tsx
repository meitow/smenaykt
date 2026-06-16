"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ChatMessageView } from "@/lib/chat";
import { t } from "@/lib/i18n";

type TaskChatPanelProps = {
  taskId: string;
  taskTitle: string;
  backHref: string;
  authHeaders: () => HeadersInit;
};

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function TaskChatPanel({ taskId, taskTitle, backHref, authHeaders }: TaskChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [draft, setDraft] = useState("");
  const [canSend, setCanSend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/tasks/${taskId}/messages`, { headers: authHeaders() });
    const data = (await res.json()) as {
      messages?: ChatMessageView[];
      canSend?: boolean;
      error?: string;
    };

    if (!res.ok) {
      setError(data.error ?? t("chat.loadError"));
      setMessages([]);
      return;
    }

    setMessages(data.messages ?? []);
    setCanSend(Boolean(data.canSend));
    setError("");
  }, [authHeaders, taskId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();

    const timer = window.setInterval(() => {
      void load();
    }, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !canSend || sending) return;

    setSending(true);
    setError("");

    try {
      const res = await fetch(`/api/tasks/${taskId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ body }),
      });
      const data = (await res.json()) as {
        messages?: ChatMessageView[];
        canSend?: boolean;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error ?? t("chat.sendError"));
        return;
      }

      setMessages(data.messages ?? []);
      setCanSend(Boolean(data.canSend));
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col bg-page">
      <div className="sticky top-0 z-10 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href={backHref} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-page" aria-label={t("task.backToList")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M14 6L8 12l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-bold text-ink">{taskTitle}</p>
            <p className="truncate text-[13px] text-muted">{t("chat.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {loading ? (
          <p className="text-center text-[14px] text-muted">{t("profile.loadingTasks")}</p>
        ) : error && messages.length === 0 ? (
          <p className="text-center text-[14px] text-rose-600">{error}</p>
        ) : messages.length === 0 ? (
          <p className="rounded-2xl bg-surface px-4 py-3 text-[14px] text-muted ring-1 ring-black/[0.04]">
            {t("chat.empty")}
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                  message.mine
                    ? "bg-brand text-white"
                    : "bg-surface text-ink ring-1 ring-black/[0.04]"
                }`}
              >
                {!message.mine && (
                  <p className="mb-1 text-[12px] font-semibold text-brand-dark">{message.senderLabel}</p>
                )}
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.body}</p>
                <p className={`mt-1 text-[11px] ${message.mine ? "text-white/80" : "text-muted"}`}>
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-line bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {!canSend && (
          <p className="mb-2 text-center text-[13px] text-muted">{t("chat.readOnly")}</p>
        )}
        {error && messages.length > 0 && (
          <p className="mb-2 text-center text-[13px] text-rose-600">{error}</p>
        )}
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={canSend ? t("chat.placeholder") : t("chat.readOnly")}
            disabled={!canSend || sending}
            maxLength={1000}
            className="input-field !mt-0 min-w-0 flex-1 !py-2.5"
          />
          <button
            type="submit"
            disabled={!canSend || sending || !draft.trim()}
            className="btn-gradient shrink-0 !w-auto px-4 disabled:opacity-50"
          >
            {sending ? "…" : t("chat.send")}
          </button>
        </form>
      </div>
    </div>
  );
}
