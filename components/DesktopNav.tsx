"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavTabIcon } from "@/components/nav/NavTabIcon";
import { APP_NAV_TABS } from "@/lib/app-nav";
import { t } from "@/lib/i18n";

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav
      className="hidden border-b border-line/80 bg-surface/90 backdrop-blur-md md:block"
      aria-label={t("nav.main")}
    >
      <div className="app-shell flex items-center gap-1 px-4 py-2">
        {APP_NAV_TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-[14px] font-semibold transition ${
                active
                  ? "bg-brand-light text-brand-dark"
                  : "text-muted hover:bg-page hover:text-ink"
              }`}
            >
              <NavTabIcon icon={tab.icon} active={active} />
              {t(tab.labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
