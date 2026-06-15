import Link from "next/link";
import { LEGAL_DOCS, type LegalDocSlug, legalDocPath } from "@/lib/legal";
import { t } from "@/lib/i18n";

type LegalDocPageProps = {
  slug: LegalDocSlug;
  backHref?: string;
};

export function LegalDocPage({ slug, backHref = "/profile" }: LegalDocPageProps) {
  const doc = LEGAL_DOCS.find((item) => item.slug === slug);
  if (!doc) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link href={backHref} className="text-[15px] font-medium text-brand">
        {t("legal.back")}
      </Link>

      <article className="info-card mt-4 p-5">
        <h1 className="text-[22px] font-bold leading-tight text-ink">{t(doc.titleKey)}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">{t(doc.placeholderKey)}</p>

        <div className="mt-6 space-y-4">
          {doc.sections.map((sectionKey) => (
            <section key={sectionKey} className="rounded-2xl border border-dashed border-line bg-page/60 px-4 py-4">
              <h2 className="text-[15px] font-semibold text-ink">{t(sectionKey)}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{t("legal.sectionEmpty")}</p>
            </section>
          ))}
        </div>
      </article>

      <nav className="mt-4 info-card divide-y divide-line">
        <p className="px-4 py-3 text-[13px] font-semibold uppercase tracking-wide text-muted">
          {t("legal.otherDocs")}
        </p>
        {LEGAL_DOCS.filter((item) => item.slug !== slug).map((item) => (
          <Link
            key={item.slug}
            href={legalDocPath(item.slug)}
            className="block px-4 py-3.5 text-[15px] font-medium text-brand active:opacity-80"
          >
            {t(item.titleKey)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
