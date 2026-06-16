"use client";

import { useCallback, useEffect, useState } from "react";
import { isValidRuPhone } from "@/lib/phone";
import { getUserPhone } from "@/lib/user-session";

export type AppNotification = {
  id: string;
  taskId: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

type UseNotificationsOptions = {
  unreadOnly?: boolean;
  limit?: number;
  enabled?: boolean;
};

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { unreadOnly = false, limit = 30, enabled = true } = options;
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const phone = getUserPhone();
    if (!phone || !isValidRuPhone(phone)) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({
        phone,
        limit: String(limit),
        unread: unreadOnly ? "1" : "0",
      });
      const res = await fetch(`/api/notifications?${params.toString()}`);
      if (!res.ok) return;

      const data = (await res.json()) as {
        notifications?: AppNotification[];
        unreadCount?: number;
      };
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [enabled, limit, unreadOnly]);

  useEffect(() => {
    void refresh();
    const onRefresh = () => void refresh();
    window.addEventListener("smenaykt_user_updated", onRefresh);
    window.addEventListener("smenaykt_notifications_updated", onRefresh);
    return () => {
      window.removeEventListener("smenaykt_user_updated", onRefresh);
      window.removeEventListener("smenaykt_notifications_updated", onRefresh);
    };
  }, [refresh]);

  return { notifications, unreadCount, loading, refresh };
}

export async function markNotificationsRead(ids?: string[]) {
  const phone = getUserPhone();
  if (!phone || !isValidRuPhone(phone)) return false;

  const res = await fetch("/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, ids: ids ?? [] }),
  }).catch(() => null);

  if (res?.ok) {
    window.dispatchEvent(new Event("smenaykt_notifications_updated"));
    return true;
  }

  return false;
}
