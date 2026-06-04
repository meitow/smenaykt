import Link from "next/link";

type LaneTileProps = {
  emoji: string;
  title: string;
  hint: string;
  href: string;
};

export function LaneTile({ emoji, title, hint, href }: LaneTileProps) {
  return (
    <Link
      href={href}
      className="relative block rounded-2xl border border-brand/20 bg-white p-4 shadow-sm transition hover:border-brand/40 hover:shadow-md"
    >
      <span
        className="pointer-events-none absolute right-0 top-0 h-8 w-8 rounded-bl-2xl bg-brand/10"
        aria-hidden
      />
      <span className="text-3xl" role="img" aria-hidden>
        {emoji}
      </span>
      <p className="mt-2 text-base font-bold text-gray-900">{title}</p>
      <p className="mt-1 text-sm text-gray-600">{hint}</p>
    </Link>
  );
}
