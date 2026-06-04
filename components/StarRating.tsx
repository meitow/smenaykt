"use client";

type StarRatingProps = {
  value: number;
  max?: number;
  size?: "sm" | "md";
  onChange?: (value: number) => void;
  className?: string;
};

export function StarRating({ value, max = 5, size = "md", onChange, className = "" }: StarRatingProps) {
  const starSize = size === "sm" ? 16 : 20;
  const interactive = Boolean(onChange);

  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`} role={interactive ? "radiogroup" : undefined}>
      {Array.from({ length: max }, (_, index) => {
        const star = index + 1;
        const filled = star <= Math.round(value);

        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange?.(star)}
              className="p-0.5 transition active:scale-95"
              aria-label={`${star} из ${max}`}
            >
              <StarIcon filled={filled} size={starSize} />
            </button>
          );
        }

        return (
          <span key={star} aria-hidden>
            <StarIcon filled={filled} size={starSize} />
          </span>
        );
      })}
    </div>
  );
}

function StarIcon({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
        fill={filled ? "#F5A623" : "none"}
        stroke={filled ? "#F5A623" : "#C5CDD6"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatRating(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toFixed(1);
}

export function ProfileRatingBadge({
  avgRating,
  reviewCount,
}: {
  avgRating: number | null;
  reviewCount: number;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-page px-2.5 py-1">
      <StarRating value={avgRating ?? 0} size="sm" />
      <span className="text-[14px] font-semibold text-ink">{formatRating(avgRating)}</span>
      <span className="text-[13px] text-muted">({reviewCount})</span>
    </div>
  );
}
