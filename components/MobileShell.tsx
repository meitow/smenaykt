"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { PageHeaderWithBack } from "@/components/PageHeaderWithBack";
import { DesktopNav } from "@/components/DesktopNav";
import { BottomNav } from "@/components/BottomNav";
import { NotificationWatcher } from "@/components/NotificationWatcher";
import { PullToRefresh } from "@/components/PullToRefresh";
import { dispatchPullRefresh } from "@/lib/app-events";
import { isMobileTaskChatPath, isMobileTaskDetailPath, isPullToRefreshPath } from "@/lib/route-patterns";
import { t } from "@/lib/i18n";

const TAB_BACK_HEADERS: Record<string, string> = {
  "/chats": "chat.inboxTitle",
  "/profile": "nav.profile",
  "/post": "personal.createTitle",
};

export function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isTaskChat = isMobileTaskChatPath(pathname);
  const isDetail = isMobileTaskDetailPath(pathname);
  const tabBackTitleKey = TAB_BACK_HEADERS[pathname];

  const handlePullRefresh = useCallback(async () => {
    dispatchPullRefresh();
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (!isTaskChat) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [isTaskChat]);

  if (isTaskChat) {
    return (
      <>
        <PullToRefresh onRefresh={handlePullRefresh} />
        <NotificationWatcher variant="mobile" />
        <main className="fixed inset-0 z-30 flex flex-col overflow-hidden bg-page">
          {children}
        </main>
      </>
    );
  }

  return (
    <>
      <PullToRefresh onRefresh={handlePullRefresh} disabled={!isPullToRefreshPath(pathname)} />
      <div className="ambient-blob -left-16 top-24 h-48 w-48 bg-brand/25" aria-hidden />
      <div className="ambient-blob -right-12 top-64 h-40 w-40 bg-taiga/20" aria-hidden />

      <NotificationWatcher variant="mobile" />
      {!isDetail &&
        (tabBackTitleKey ? (
          <PageHeaderWithBack title={t(tabBackTitleKey)} />
        ) : (
          <AppHeader />
        ))}
      {!isDetail && <DesktopNav />}
      <main
        className={`app-shell relative ${
          isDetail
            ? "pb-0 pt-0"
            : pathname === "/post"
              ? "px-4 pb-40 pt-2 md:pb-24"
              : tabBackTitleKey
                ? "px-4 pb-28 pt-2 md:pb-8"
                : "px-4 pb-28 pt-1 md:pb-8"
        }`}
      >
        {children}
      </main>
      {!isDetail && <BottomNav />}
    </>
  );
}
