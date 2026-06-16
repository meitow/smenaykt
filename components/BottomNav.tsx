"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavTabIcon } from "@/components/nav/NavTabIcon";
import { APP_NAV_TABS } from "@/lib/app-nav";
import { t } from "@/lib/i18n";

export function BottomNav() {
  const pathname = usePathname();
  const activeIndex = APP_NAV_TABS.findIndex((tab) => tab.href === pathname);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 border-t border-line/80 bg-surface/90 backdrop-blur-md md:hidden"
      aria-label={t("nav.main")}
    >
      <div className="relative app-shell px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        {activeIndex >= 0 && (
          <div
            className="absolute top-2 h-12 rounded-2xl bg-brand-light/50 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              width: "calc(33.333% - 0.35rem)",
              left: `calc(${activeIndex * 33.333}% + 0.2rem)`,
            }}
            aria-hidden
          />
        )}
        <div className="relative flex items-center justify-around">
          {APP_NAV_TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative z-10 flex min-w-[5rem] flex-col items-center gap-1 py-1.5 transition duration-200 ${
                  active ? "scale-100" : "opacity-80"
                }`}
              >
                <NavTabIcon icon={tab.icon} active={active} />
                <span
                  className={`text-[12px] font-semibold transition-colors duration-200 ${
                    active ? "text-brand" : "text-muted"
                  }`}
                >
                  {t(tab.labelKey)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
