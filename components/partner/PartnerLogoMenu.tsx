"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppLogo } from "@/components/AppLogo";
import { clearPartnerSession, getPartnerInvite } from "@/lib/partner-session";
import { t } from "@/lib/i18n";

export function PartnerLogoMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const onLoginPage = pathname === "/partner/login";
    setLoggedIn(!onLoginPage && Boolean(getPartnerInvite()));
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function logout() {
    clearPartnerSession();
    setLoggedIn(false);
    setOpen(false);
    router.replace("/partner/login");
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => loggedIn && setOpen((value) => !value)}
        className={`flex items-center gap-3 rounded-2xl text-left ${
          loggedIn ? "active:bg-page/80" : "cursor-default"
        }`}
        aria-expanded={loggedIn ? open : undefined}
        aria-haspopup={loggedIn ? "menu" : undefined}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-page">
          <AppLogo size={44} />
        </div>
        <div>
          <p className="text-lg font-bold text-ink">SmenaYKT Partner</p>
          <p className="text-sm text-muted">Кабинет для предприятий · Якутск</p>
        </div>
        {loggedIn ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className={`shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : null}
      </button>

      {loggedIn && open ? (
        <div
          role="menu"
          className="absolute left-0 top-full z-30 mt-2 min-w-[11rem] overflow-hidden rounded-xl bg-surface py-1 shadow-card ring-1 ring-black/[0.06]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className="flex w-full px-4 py-2.5 text-left text-[14px] text-muted transition active:bg-page"
          >
            {t("partner.logout")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
