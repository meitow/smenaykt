"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PartnerPostForm } from "@/components/partner/PartnerPostForm";
import { getPartnerInvite, getPartnerName, partnerHeaders } from "@/lib/partner-session";
import { t } from "@/lib/i18n";

export default function PartnerPostPage() {
  const router = useRouter();
  const [defaultPlace, setDefaultPlace] = useState("");

  useEffect(() => {
    const code = getPartnerInvite();
    if (!code) {
      router.replace("/partner/login");
      return;
    }

    fetch("/api/partner/tasks", { headers: partnerHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (data.store?.name) setDefaultPlace(data.store.name);
      })
      .catch(() => undefined);
  }, [router]);

  return (
    <div className="space-y-4">
      <Link href="/partner" className="inline-block text-[14px] font-medium text-brand">
        {t("partner.backToDashboard")}
      </Link>
      <div>
        <h1 className="page-title">{t("partner.newShift")}</h1>
        <p className="mt-1 text-[15px] text-muted">{t("partner.newShiftHint")}</p>
      </div>
      <PartnerPostForm defaultPlace={defaultPlace || getPartnerName() || ""} />
    </div>
  );
}
