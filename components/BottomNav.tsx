"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/lib/i18n";

const tabs = [
  { href: "/", label: t("nav.tasks"), icon: "tasks" },
  { href: "/post", label: t("nav.post"), icon: "post" },
  { href: "/profile", label: t("nav.profile"), icon: "profile" },
] as const;

function TabIcon({ icon, active }: { icon: string; active: boolean }) {
  const color = active ? "text-brand" : "text-muted";

  if (icon === "tasks") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={color} aria-hidden>
        <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (icon === "post") {
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        className={active ? "text-taiga" : "text-muted"}
        aria-hidden
      >
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={color} aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.5 19.5c0-3 3-5.5 6.5-5.5s6.5 2.5 6.5 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const activeIndex = tabs.findIndex((tab) => tab.href === pathname);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-line/80 bg-surface/90 backdrop-blur-md">
      <div className="relative app-shell px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
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
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative z-10 flex min-w-[5rem] flex-col items-center gap-1 py-1.5 transition duration-200 ${
                  active ? "scale-100" : "opacity-80"
                }`}
              >
                <TabIcon icon={tab.icon} active={active} />
                <span
                  className={`text-[11px] font-semibold transition-colors duration-200 ${
                    active ? "text-brand" : "text-muted"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
