"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { APP_UPDATES } from "@/lib/app-updates";
import { formatDateLabel, formatRelativeTime } from "@/lib/datetime";
import { markNotificationsRead, useNotifications } from "@/hooks/useNotifications";
import { isValidRuPhone } from "@/lib/phone";
import { getUserPhone } from "@/lib/user-session";
import { t } from "@/lib/i18n";

function updateTagLabel(tag: (typeof APP_UPDATES)[number]["tag"]) {
  if (tag === "feature") return t("notifications.updatesTagFeature");
  if (tag === "improvement") return t("notifications.updatesTagImprovement");
  return t("notifications.updatesTagInfo");
}

export function NotificationsPanel() {
  const router = useRouter();
  const { notifications, unreadCount, loading } = useNotifications({ limit: 40 });
  const hasPhone = (() => {
    const phone = getUserPhone();
    return Boolean(phone && isValidRuPhone(phone));
  })();

  const markAllRead = useCallback(async () => {
    await markNotificationsRead();
  }, []);

  useEffect(() => {
    if (unreadCount > 0) {
      void markAllRead();
    }
  }, [markAllRead, unreadCount]);

  async function openNotification(taskId: string, id: string) {
    await markNotificationsRead([id]);
    router.push(`/tasks/${taskId}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-[17px] font-bold text-ink">{t("notifications.sectionTasks")}</h2>
            <p className="mt-0.5 text-[14px] text-muted">{t("notifications.sectionTasksHint")}</p>
          </div>
        </div>

        {!hasPhone ? (
          <div className="info-card px-4 py-5 text-center">
            <p className="text-[15px] font-medium text-ink">{t("notifications.needPhoneTitle")}</p>
            <p className="mt-1 text-[14px] text-muted">{t("notifications.needPhoneHint")}</p>
            <Link href="/profile" className="mt-4 inline-block text-[15px] font-semibold text-brand">
              {t("notifications.needPhoneAction")} →
            </Link>
          </div>
        ) : loading ? (
          <div className="info-card px-4 py-8 text-center text-[14px] text-muted">
            {t("notifications.loading")}
          </div>
        ) : notifications.length === 0 ? (
          <div className="info-card px-4 py-8 text-center">
            <p className="text-[15px] font-medium text-ink">{t("notifications.emptyTitle")}</p>
            <p className="mt-1 text-[14px] text-muted">{t("notifications.emptyHint")}</p>
          </div>
        ) : (
          <ul className="info-card divide-y divide-line">
            {notifications.map((note) => (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => openNotification(note.taskId, note.id)}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left active:bg-page/70"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      note.readAt ? "bg-line" : "bg-brand"
                    }`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-[15px] font-semibold text-ink">{note.title}</span>
                      <span className="shrink-0 text-[12px] text-muted">
                        {formatRelativeTime(note.createdAt)}
                      </span>
                    </span>
                    <span className="mt-1 block text-[14px] leading-snug text-muted">{note.body}</span>
                    <span className="mt-2 inline-block text-[13px] font-medium text-brand">
                      {t("notifications.openTask")}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-[17px] font-bold text-ink">{t("notifications.sectionUpdates")}</h2>
          <p className="mt-0.5 text-[14px] text-muted">{t("notifications.sectionUpdatesHint")}</p>
        </div>

        <ul className="space-y-3">
          {APP_UPDATES.map((item) => (
            <li key={item.id} className="info-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                {item.tag ? (
                  <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-dark">
                    {updateTagLabel(item.tag)}
                  </span>
                ) : null}
                <time className="text-[12px] text-muted" dateTime={item.date}>
                  {formatDateLabel(item.date)}
                </time>
              </div>
              <h3 className="mt-2 text-[15px] font-semibold text-ink">{item.title}</h3>
              <p className="mt-1 text-[14px] leading-relaxed text-muted">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
