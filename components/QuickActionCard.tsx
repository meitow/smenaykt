import Link from "next/link";

type QuickActionCardProps = {
  href: string;
  title: string;
  subtitle?: string;
  emoji: string;
  tint: "blue" | "green" | "blend";
  compact?: boolean;
};

const tints = {
  blue: "from-brand-light to-brand-soft",
  green: "from-taiga-light to-taiga-soft",
  blend: "from-brand-light to-taiga-light",
};

export function QuickActionCard({
  href,
  title,
  subtitle,
  emoji,
  tint,
  compact = false,
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className={`group flex gap-2.5 rounded-2xl bg-gradient-to-br shadow-card ring-1 ring-black/[0.04] transition active:scale-[0.98] ${tints[tint]} ${
        compact ? "items-center p-3" : "min-w-0 p-3.5 max-[399px]:flex-row max-[399px]:items-center min-[400px]:min-h-[8.25rem] min-[400px]:flex-col min-[400px]:justify-between min-[400px]:p-4"
      }`}
    >
      <span
        className={`shrink-0 leading-none transition duration-200 group-active:scale-95 ${
          compact ? "text-2xl" : "text-[1.75rem] min-[400px]:text-3xl"
        }`}
        role="img"
        aria-hidden
      >
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`font-bold leading-snug text-ink ${compact ? "text-[14px]" : "text-[15px] min-[400px]:text-sm"}`}>
          {title}
        </p>
        {subtitle ? (
          <p
            className={`mt-0.5 leading-snug text-muted line-clamp-2 ${
              compact ? "text-[12px]" : "text-[13px] min-[400px]:text-xs"
            }`}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
