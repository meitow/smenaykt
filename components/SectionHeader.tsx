import Link from "next/link";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
};

export function SectionHeader({ title, subtitle, href, linkLabel }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {href && linkLabel && (
        <Link href={href} className="shrink-0 text-sm font-semibold text-brand">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
