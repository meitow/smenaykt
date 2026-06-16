import Link from "next/link";
import { HOME_SAFETY_TIPS } from "@/lib/home-tips";
import { t } from "@/lib/i18n";

export function HomeSidebar() {
  return (
    <aside className="hidden space-y-3 lg:block">
      <section className="info-card p-4">
        <h2 className="text-[15px] font-bold text-ink">{t("home.tipsTitle")}</h2>
        <p className="mt-1 text-[14px] leading-snug text-muted">{t("home.tipsSubtitle")}</p>
        <ul className="mt-4 space-y-3">
          {HOME_SAFETY_TIPS.map((tip) => (
            <li key={tip.id} className="rounded-xl bg-page/80 px-3 py-3">
              <h3 className="text-[14px] font-semibold text-ink">{t(tip.titleKey)}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{t(tip.bodyKey)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="info-card p-4">
        <h2 className="text-[15px] font-bold text-ink">{t("home.recoTitle")}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">{t("home.recoProfile")}</p>
        <Link href="/profile" className="mt-3 inline-block text-[14px] font-semibold text-brand">
          {t("home.recoProfileAction")} →
        </Link>
      </section>
    </aside>
  );
}
