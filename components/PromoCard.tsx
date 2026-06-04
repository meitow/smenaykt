import Link from "next/link";

type PromoCardProps = {
  title: string;
  description: string;
  buttonLabel: string;
  href?: string;
  onClick?: () => void;
};

export function PromoCard({ title, description, buttonLabel, href, onClick }: PromoCardProps) {
  const buttonClass = "btn-outline mt-4";

  return (
    <section className="relative overflow-hidden rounded-4xl bg-white p-5 shadow-card ring-1 ring-black/[0.03]">
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-brand-light/80" aria-hidden />
      <div className="relative">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-light text-lg">
          ✨
        </div>
        <h2 className="mt-3 text-lg font-bold leading-snug text-ink">{title}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{description}</p>
        {href ? (
          <Link href={href} className={buttonClass}>
            {buttonLabel}
          </Link>
        ) : (
          <button type="button" onClick={onClick} className={buttonClass}>
            {buttonLabel}
          </button>
        )}
      </div>
    </section>
  );
}
