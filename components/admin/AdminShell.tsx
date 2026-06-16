"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { t } from "@/lib/i18n";

export type AdminTab = "overview" | "tasks" | "bans" | "users" | "moderators" | "identity";

const TABS: { key: AdminTab; labelKey: string }[] = [
  { key: "overview", labelKey: "admin.tabOverview" },
  { key: "tasks", labelKey: "admin.tabTasks" },
  { key: "identity", labelKey: "admin.tabIdentity" },
  { key: "bans", labelKey: "admin.tabBans" },
  { key: "users", labelKey: "admin.tabUsers" },
  { key: "moderators", labelKey: "admin.tabModerators" },
];

type AdminShellProps = {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  sessionPhone: string | null;
  viaSecret: boolean;
  children: ReactNode;
};

export function AdminShell({
  activeTab,
  onTabChange,
  sessionPhone,
  viaSecret,
  children,
}: AdminShellProps) {
  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-line bg-surface/95 backdrop-blur-md">
        <div className="app-shell flex items-center justify-between gap-4 px-4 py-3">
          <div>
            <h1 className="text-[20px] font-bold text-ink md:text-[22px]">{t("admin.panelTitle")}</h1>
            <p className="mt-0.5 text-[13px] text-muted">
              {sessionPhone
                ? t("admin.sessionPhone", { phone: sessionPhone })
                : viaSecret
                  ? t("admin.sessionSecret")
                  : t("admin.sessionUnknown")}
            </p>
          </div>
          <Link href="/" className="shrink-0 text-[15px] font-medium text-brand">
            {t("admin.backToApp")}
          </Link>
        </div>
      </header>

      <div className="app-shell px-4 py-6 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8">
        <nav className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:mb-0 lg:flex-col lg:overflow-visible lg:pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`shrink-0 rounded-xl px-3.5 py-2.5 text-left text-[14px] font-semibold transition lg:w-full ${
                activeTab === tab.key
                  ? "bg-brand text-white shadow-soft"
                  : "bg-surface text-muted ring-1 ring-black/[0.05] lg:bg-transparent lg:ring-0 lg:hover:bg-surface"
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </nav>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
