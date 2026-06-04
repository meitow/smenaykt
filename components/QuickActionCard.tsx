import Link from "next/link";

type QuickActionCardProps = {
  href: string;
  title: string;
  subtitle?: string;
  emoji: string;
  tint: "blue" | "green" | "blend";
};

const tints = {
  blue: "from-brand-light to-brand-soft",
  green: "from-taiga-light to-taiga-soft",
  blend: "from-brand-light to-taiga-light",
};

export function QuickActionCard({ href, title, subtitle, emoji, tint }: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className={`group flex min-w-0 gap-3 rounded-2xl bg-gradient-to-br p-3.5 shadow-card ring-1 ring-black/[0.04] transition active:scale-[0.98] max-[399px]:flex-row max-[399px]:items-center min-[400px]:min-h-[8.25rem] min-[400px]:flex-col min-[400px]:justify-between min-[400px]:p-4 ${tints[tint]}`}
    >
      <span
        className="shrink-0 text-[1.75rem] leading-none transition duration-200 group-active:scale-95 min-[400px]:text-3xl"
        role="img"
        aria-hidden
      >
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold leading-snug text-ink min-[400px]:text-sm">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 text-[13px] leading-snug text-muted line-clamp-2 min-[400px]:text-xs">
            {subtitle}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
