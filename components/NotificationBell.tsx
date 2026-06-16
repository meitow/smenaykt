"use client";

import Link from "next/link";
import { useNotifications } from "@/hooks/useNotifications";
import { t } from "@/lib/i18n";

export function NotificationBell() {
  const { unreadCount } = useNotifications({ unreadOnly: true, limit: 1 });

  return (
    <Link
      href="/notifications"
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-ink active:bg-page"
      aria-label={
        unreadCount > 0
          ? t("notifications.bellUnread", { count: unreadCount })
          : t("notifications.bell")
      }
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 4.5a4.5 4.5 0 0 0-4.5 4.5v2.8c0 .5-.2 1-.5 1.4L5.8 15.2A1.2 1.2 0 0 0 7 17h10a1.2 1.2 0 0 0 1.2-1.8l-1.2-2a2 2 0 0 1-.5-1.4V9a4.5 4.5 0 0 0-4.5-4.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M10 17a2 2 0 0 0 4 0"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      {unreadCount > 0 ? (
        <span className="absolute right-1 top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
