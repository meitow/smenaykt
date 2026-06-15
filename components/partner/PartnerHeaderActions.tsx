"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { clearPartnerSession } from "@/lib/partner-session";
import { t } from "@/lib/i18n";

export function PartnerHeaderActions() {
  const router = useRouter();

  function logout() {
    clearPartnerSession();
    router.replace("/partner/login");
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-2">
      <Link href="/" className="text-sm font-medium text-brand">
        {t("partner.toApp")}
      </Link>
      <button type="button" onClick={logout} className="text-sm font-medium text-muted active:opacity-80">
        {t("partner.logout")}
      </button>
    </div>
  );
}
