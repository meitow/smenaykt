"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { clearPartnerSession, getPartnerInvite } from "@/lib/partner-session";
import { t } from "@/lib/i18n";

export function PartnerHeaderActions() {
  const router = useRouter();
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const onLoginPage = pathname === "/partner/login";
    setLoggedIn(!onLoginPage && Boolean(getPartnerInvite()));
  }, [pathname]);

  function logout() {
    clearPartnerSession();
    setLoggedIn(false);
    router.replace("/partner/login");
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-2">
      <Link href="/" className="text-sm font-medium text-brand">
        {t("partner.toApp")}
      </Link>
      {loggedIn && (
        <button type="button" onClick={logout} className="text-sm font-medium text-muted active:opacity-80">
          {t("partner.logout")}
        </button>
      )}
    </div>
  );
}
