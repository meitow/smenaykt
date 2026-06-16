"use client";

import { useEffect, useState } from "react";
import { QuickActionCard } from "@/components/QuickActionCard";
import { getUserDisplayName } from "@/lib/user-session";
import { t } from "@/lib/i18n";

type HomeHeroProps = {
  taskCount?: number;
  loading?: boolean;
  compact?: boolean;
};

export function HomeHero({ taskCount, loading, compact = false }: HomeHeroProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    const sync = () => setName(getUserDisplayName());
    sync();
    window.addEventListener("smenaykt_user_updated", sync);
    return () => window.removeEventListener("smenaykt_user_updated", sync);
  }, []);

  const greetingName = name && name !== "Гость" ? name.split(" ")[0] : null;
  const title = greetingName ? `${t("home.hello")}, ${greetingName}` : t("home.greeting");

  if (compact) {
    return (
      <section className="animate-fade-up">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-hero-mesh px-3.5 py-2.5 ring-1 ring-black/[0.04]">
          <div className="min-w-0">
            <p className="truncate text-[16px] font-bold leading-tight text-ink">{title}</p>
            <p className="truncate text-[13px] text-muted">{t("home.greetingShort")}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface/95 px-2.5 py-1 text-[12px] font-semibold text-ink ring-1 ring-black/[0.04]">
            {loading ? (
              <span className="inline-block h-3 w-10 rounded-md shimmer-block" />
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-taiga" aria-hidden />
                {taskCount ?? 0}
              </>
            )}
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="animate-fade-up space-y-3">
      <div className="relative overflow-hidden rounded-2xl bg-hero-mesh px-4 py-3.5 ring-1 ring-black/[0.04]">
        <div
          className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-brand/15 blur-2xl"
          aria-hidden
        />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-brand-dark">
              {t("brand.city")}
            </p>
            <h1 className="mt-1 text-[22px] font-bold leading-tight tracking-tight text-ink">{title}</h1>
            <p className="mt-1 text-[14px] leading-snug text-muted">{t("home.nearbySubtitle")}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface/95 px-2.5 py-1.5 text-[13px] font-semibold text-ink shadow-sm ring-1 ring-black/[0.04]">
            {loading ? (
              <span className="inline-block h-3 w-12 rounded-md shimmer-block" />
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-taiga" aria-hidden />
                {taskCount ?? 0}
              </>
            )}
          </span>
        </div>
      </div>

      <div className="hidden gap-2 md:grid md:grid-cols-2">
        <QuickActionCard
          href="/post"
          title={t("home.postTask")}
          subtitle={t("home.postTaskHint")}
          emoji="✨"
          tint="blend"
          compact
        />
        <QuickActionCard
          href="/profile"
          title={t("home.profileSetup")}
          subtitle={t("home.profileShortHint")}
          emoji="👤"
          tint="blue"
          compact
        />
      </div>
    </section>
  );
}
