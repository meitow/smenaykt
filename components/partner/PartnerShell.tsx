"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { NotificationWatcher } from "@/components/NotificationWatcher";
import { PartnerHeaderActions } from "@/components/partner/PartnerHeaderActions";
import { PartnerLogoMenu } from "@/components/partner/PartnerLogoMenu";
import { isPartnerTaskChatPath } from "@/lib/route-patterns";

export function PartnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChat = isPartnerTaskChatPath(pathname);

  useEffect(() => {
    if (!isChat) return;
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
  }, [isChat]);

  if (isChat) {
    return (
      <>
        <NotificationWatcher variant="partner" />
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-page">
          {children}
        </div>
      </>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-page">
      <div className="ambient-blob -left-20 top-16 h-52 w-52 bg-brand/20" aria-hidden />
      <div className="ambient-blob -right-16 top-48 h-44 w-44 bg-taiga/15" aria-hidden />
      <NotificationWatcher variant="partner" />
      <header className="border-b border-black/5 bg-white">
        <div className="app-shell flex items-center justify-between gap-4 px-4 py-4">
          <PartnerLogoMenu />
          <PartnerHeaderActions />
        </div>
      </header>
      <main className="app-shell px-4 py-6">{children}</main>
    </div>
  );
}
