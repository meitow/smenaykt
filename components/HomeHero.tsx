"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QuickActionCard } from "@/components/QuickActionCard";
import { getUserDisplayName } from "@/lib/user-session";
import { t } from "@/lib/i18n";

type HomeHeroProps = {
  taskCount?: number;
  loading?: boolean;
};

export function HomeHero({ taskCount, loading }: HomeHeroProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    const sync = () => setName(getUserDisplayName());
    sync();
    window.addEventListener("smenaykt_user_updated", sync);
    return () => window.removeEventListener("smenaykt_user_updated", sync);
  }, []);

  const greetingName = name && name !== "Гость" ? name.split(" ")[0] : null;

  return (
    <section className="animate-fade-up space-y-4">
      <div className="relative overflow-hidden rounded-3xl bg-hero-mesh p-5 ring-1 ring-black/[0.04]">
        <div
          className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-brand/20 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-taiga/15 blur-2xl"
          aria-hidden
        />

        <div className="relative">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-brand-dark/80">
            {t("brand.city")} · {t("brand.tagline")}
          </p>
          <h1 className="mt-2 text-[26px] font-bold leading-tight tracking-tight text-ink">
            {greetingName ? (
              <>
                {t("home.hello")}, {greetingName}
                <span className="block text-[17px] font-semibold text-muted">
                  {t("home.greeting")}
                </span>
              </>
            ) : (
              t("home.greeting")
            )}
          </h1>
          <p className="mt-2 max-w-[18rem] text-[15px] leading-relaxed text-muted">
            {t("home.nearbySubtitle")}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1.5 text-[13px] font-semibold text-ink shadow-sm ring-1 ring-black/[0.04]">
              {loading ? (
                <span className="inline-block h-3 w-16 rounded-md shimmer-block" />
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-taiga" aria-hidden />
                  {t("home.tasksAvailable", { count: taskCount ?? 0 })}
                </>
              )}
            </span>
            <span className="inline-flex rounded-full bg-brand-light/80 px-3 py-1.5 text-[13px] font-semibold text-brand-dark">
              {t("home.filterHome")} + {t("home.filterStore")}
            </span>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 px-0.5 text-[13px] font-semibold uppercase tracking-wide text-muted">
          {t("home.quickActions")}
        </p>
        <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-3 min-[400px]:gap-2.5">
          <QuickActionCard
            href="/post"
            title={t("home.postTask")}
            subtitle={t("home.postTaskHint")}
            emoji="✨"
            tint="blend"
          />
          <QuickActionCard
            href="/profile"
            title={t("home.profileSetup")}
            subtitle={t("home.profileShortHint")}
            emoji="👤"
            tint="blue"
          />
          <QuickActionCard
            href="/?source=partner"
            title={t("home.partnerQuickTitle")}
            subtitle={t("home.partnerQuickHint")}
            emoji="🤝"
            tint="green"
          />
        </div>
      </div>

      <Link
        href="/profile"
        className="info-card group flex items-center gap-3 p-4 transition duration-300 hover:ring-brand/15"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-lg text-white shadow-soft transition duration-300 group-hover:scale-105">
          ★
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">{t("home.profilePromoTitle")}</p>
          <p className="mt-0.5 text-[14px] leading-snug text-muted">{t("home.profilePromoDesc")}</p>
        </div>
        <span className="shrink-0 text-brand transition duration-200 group-hover:translate-x-0.5">
          →
        </span>
      </Link>
    </section>
  );
}
