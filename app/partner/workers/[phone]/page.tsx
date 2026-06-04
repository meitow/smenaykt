"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PublicProfileView } from "@/components/partner/PublicProfileView";
import { getPartnerInvite } from "@/lib/partner-session";
import type { ProfileData } from "@/lib/types";
import { t } from "@/lib/i18n";

export default function PartnerWorkerProfilePage() {
  const router = useRouter();
  const params = useParams<{ phone: string }>();
  const [backHref, setBackHref] = useState("/partner");
  const phone = decodeURIComponent(params.phone ?? "");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("from");
    if (from?.startsWith("/partner")) setBackHref(from);
  }, []);

  useEffect(() => {
    const code = getPartnerInvite();
    if (!code) {
      router.replace("/partner/login");
      return;
    }

    if (!phone) return;

    setLoading(true);
    fetch(`/api/profile?phone=${encodeURIComponent(phone)}`)
      .then((r) => r.json())
      .then((data: ProfileData & { error?: string }) => {
        if (data.error) {
          setError(data.error);
          setProfile(null);
          return;
        }
        setProfile(data);
        setError("");
      })
      .catch(() => setError(t("profile.loadError")))
      .finally(() => setLoading(false));
  }, [phone, router]);

  if (loading) {
    return <p className="text-muted">{t("profile.loadingTasks")}</p>;
  }

  if (!profile) {
    return (
      <div className="space-y-3">
        <Link href={backHref} className="text-[14px] font-medium text-brand">
          {t("partner.back")}
        </Link>
        <p className="text-rose-600">{error || t("partner.profileNotFound")}</p>
      </div>
    );
  }

  return (
    <PublicProfileView profile={profile} backHref={backHref} backLabel={t("partner.back")} />
  );
}
