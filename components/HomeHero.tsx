"use client";

import { QuickActionCard } from "@/components/QuickActionCard";
import { t } from "@/lib/i18n";

export function HomeHero() {
  return (
    <section className="animate-fade-up grid grid-cols-2 gap-2">
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
    </section>
  );
}
