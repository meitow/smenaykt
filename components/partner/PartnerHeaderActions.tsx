"use client";

import Link from "next/link";
import { t } from "@/lib/i18n";

export function PartnerHeaderActions() {
  return (
    <Link
      href="/"
      className="shrink-0 rounded-full bg-brand-light/60 px-3.5 py-2 text-[14px] font-semibold text-brand-dark transition active:bg-brand-light"
    >
      {t("partner.toApp")}
    </Link>
  );
}
