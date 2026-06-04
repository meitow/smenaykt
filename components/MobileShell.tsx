"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { NotificationWatcher } from "@/components/NotificationWatcher";

export function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDetail = /^\/tasks\/[^/]+$/.test(pathname);

  return (
    <>
      <div className="ambient-blob -left-16 top-24 h-48 w-48 bg-brand/25" aria-hidden />
      <div className="ambient-blob -right-12 top-64 h-40 w-40 bg-taiga/20" aria-hidden />

      <NotificationWatcher variant="mobile" />
      {!isDetail && <AppHeader />}
      <main className={`relative mx-auto max-w-lg ${isDetail ? "pb-0 pt-0" : "px-4 pb-28 pt-1"}`}>
        {children}
      </main>
      {!isDetail && <BottomNav />}
    </>
  );
}
