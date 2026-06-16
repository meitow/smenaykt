"use client";

import Link from "next/link";
import { useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PullToRefresh } from "@/components/PullToRefresh";
import { dispatchPullRefresh } from "@/lib/app-events";
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
  canManageModerators: boolean;
  onLogout: () => void;
  children: ReactNode;
};

function AdminTabNav({
  tabs,
  activeTab,
  onTabChange,
  className,
}: {
  tabs: typeof TABS;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  className: string;
}) {
  return (
    <nav className={className}>
      {tabs.map((tab) => (
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
  );
}

export function AdminShell({
  activeTab,
  onTabChange,
  sessionPhone,
  viaSecret,
  canManageModerators,
  onLogout,
  children,
}: AdminShellProps) {
  const router = useRouter();
  const tabs = canManageModerators
    ? TABS
    : TABS.filter((tab) => tab.key !== "moderators");

  const handlePullRefresh = useCallback(async () => {
    dispatchPullRefresh();
    router.refresh();
  }, [router]);

  return (
    <div className="min-h-screen bg-page">
      <PullToRefresh onRefresh={handlePullRefresh} />

      <div className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-md">
        <header>
          <div className="app-shell flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <h1 className="truncate text-[20px] font-bold text-ink md:text-[22px]">{t("admin.panelTitle")}</h1>
              <p className="mt-0.5 truncate text-[13px] text-muted">
                {sessionPhone
                  ? t("admin.sessionPhone", { phone: sessionPhone })
                  : viaSecret
                    ? t("admin.sessionSecret")
                    : t("admin.sessionUnknown")}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={onLogout}
                className="text-[14px] font-medium text-muted transition hover:text-rose-600 sm:text-[15px]"
              >
                {t("admin.lock")}
              </button>
              <Link href="/" className="text-[14px] font-medium text-brand sm:text-[15px]">
                {t("admin.backToApp")}
              </Link>
            </div>
          </div>
        </header>

        <div className="app-shell px-4 pb-2 lg:hidden">
          <AdminTabNav
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          />
        </div>
      </div>

      <div className="app-shell px-4 py-6 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8">
        <AdminTabNav
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          className="sticky top-[8.75rem] hidden max-h-[calc(100vh-10rem)] gap-2 overflow-y-auto lg:mb-0 lg:flex lg:flex-col lg:overflow-visible lg:pb-0"
        />

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
