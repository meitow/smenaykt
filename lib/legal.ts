export const LEGAL_DOCS = [
  {
    slug: "offer",
    titleKey: "legal.offerTitle",
    placeholderKey: "legal.offerPlaceholder",
    sections: ["legal.offerSection1", "legal.offerSection2", "legal.offerSection3"],
  },
  {
    slug: "privacy",
    titleKey: "legal.privacyTitle",
    placeholderKey: "legal.privacyPlaceholder",
    sections: ["legal.privacySection1", "legal.privacySection2", "legal.privacySection3"],
  },
  {
    slug: "terms",
    titleKey: "legal.termsTitle",
    placeholderKey: "legal.termsPlaceholder",
    sections: ["legal.termsSection1", "legal.termsSection2"],
  },
] as const;

export type LegalDocSlug = (typeof LEGAL_DOCS)[number]["slug"];

export function legalDocPath(slug: LegalDocSlug): string {
  return `/legal/${slug}`;
}
