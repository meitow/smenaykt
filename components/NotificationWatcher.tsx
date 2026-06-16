"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { isValidRuPhone } from "@/lib/phone";
import { getPartnerPhone } from "@/lib/partner-session";
import { getUserPhone } from "@/lib/user-session";
import { t } from "@/lib/i18n";

type AppNotification = {
  id: string;
  taskId: string;
  type: string;
  title: string;
  body: string;
  createdAt: string;
};

type NotificationWatcherProps = {
  variant: "mobile" | "partner";
};

const POLL_MS = 20_000;

function taskHref(taskId: string, variant: NotificationWatcherProps["variant"]) {
  return variant === "partner" ? `/partner/tasks/${taskId}` : `/tasks/${taskId}`;
}

export function NotificationWatcher({ variant }: NotificationWatcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<AppNotification[]>([]);
  const shownIdsRef = useRef<Set<string>>(new Set());
  const phoneRef = useRef("");

  const resolvePhone = useCallback(() => {
    const phone = variant === "partner" ? getPartnerPhone() : getUserPhone();
    return phone && isValidRuPhone(phone) ? phone : "";
  }, [variant]);

  const markRead = useCallback(async (ids: string[]) => {
    const phone = phoneRef.current;
    if (!phone || ids.length === 0) return;

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, ids }),
    }).catch(() => undefined);
    window.dispatchEvent(new Event("smenaykt_notifications_updated"));
  }, []);

  const poll = useCallback(async () => {
    const phone = resolvePhone();
    phoneRef.current = phone;
    if (!phone) {
      setItems([]);
      return;
    }

    try {
      const res = await fetch(
        `/api/notifications?phone=${encodeURIComponent(phone)}&unread=1&limit=10`
      );
      if (!res.ok) return;

      const data = (await res.json()) as { notifications?: AppNotification[] };
      const incoming = data.notifications ?? [];

      for (const note of incoming) {
        if (shownIdsRef.current.has(note.id)) continue;
        shownIdsRef.current.add(note.id);

        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          try {
            const browserNote = new Notification(note.title, {
              body: note.body,
              tag: note.id,
            });
            browserNote.onclick = () => {
              window.focus();
              router.push(taskHref(note.taskId, variant));
            };
          } catch {
            // ignore
          }
        }
      }

      setItems(incoming);
    } catch {
      // ignore
    }
  }, [resolvePhone, router, variant]);

  useEffect(() => {
    if (variant === "mobile" && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => undefined);
      }
    }
  }, [variant]);

  useEffect(() => {
    poll();
    const timer = window.setInterval(poll, POLL_MS);
    const onUserUpdated = () => poll();
    window.addEventListener("smenaykt_user_updated", onUserUpdated);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("smenaykt_user_updated", onUserUpdated);
    };
  }, [poll, pathname]);

  async function dismiss(note: AppNotification) {
    setItems((prev) => prev.filter((item) => item.id !== note.id));
    await markRead([note.id]);
  }

  async function openNote(note: AppNotification) {
    await dismiss(note);
    router.push(taskHref(note.taskId, variant));
    router.refresh();
  }

  if (items.length === 0) return null;

  return (
    <div
      className={
        variant === "partner"
          ? "fixed left-0 right-0 top-0 z-50 flex flex-col gap-2 p-3"
          : "fixed left-0 right-0 top-0 z-50 mx-auto flex max-w-lg flex-col gap-2 p-3"
      }
      role="region"
      aria-label={t("notifications.regionLabel")}
    >
      {items.map((note) => (
        <div
          key={note.id}
          className="flex items-start gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-lg ring-1 ring-black/10"
        >
          <button
            type="button"
            onClick={() => openNote(note)}
            className="min-w-0 flex-1 text-left active:opacity-90"
          >
            <p className="text-[14px] font-semibold">{note.title}</p>
            <p className="mt-0.5 text-[13px] leading-snug text-white/85">{note.body}</p>
            <span className="mt-2 inline-block text-[13px] font-medium text-brand-light">
              {t("notifications.openTask")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => dismiss(note)}
            className="shrink-0 rounded-lg px-2 py-1 text-[13px] font-medium text-white/70 active:bg-white/10"
            aria-label={t("notifications.dismiss")}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
