"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BackButton } from "@/components/BackButton";
import type { ChatMessageView } from "@/lib/chat";
import { t } from "@/lib/i18n";

type TaskChatPanelProps = {
  taskId: string;
  taskTitle: string;
  backFallbackHref: string;
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

export function TaskChatPanel({ taskId, taskTitle, backFallbackHref, authHeaders }: TaskChatPanelProps) {
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-page">
      <header className="shrink-0 border-b border-line bg-surface px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <BackButton fallbackHref={backFallbackHref} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-bold text-ink">{taskTitle}</p>
            <p className="truncate text-[13px] text-muted">{t("chat.subtitle")}</p>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4">
        {loading ? (
          <p className="text-center text-[14px] text-muted">{t("profile.loadingTasks")}</p>
        ) : error && messages.length === 0 ? (
          <p className="text-center text-[14px] text-rose-600">{error}</p>
        ) : messages.length === 0 ? (
          <p className="rounded-2xl bg-surface px-4 py-3 text-[14px] text-muted ring-1 ring-black/[0.04]">
            {t("chat.empty")}
          </p>
        ) : (
          <div className="space-y-3">
          {messages.map((message) => (
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
          ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <footer className="shrink-0 border-t border-line bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
      </footer>
    </div>
  );
}
