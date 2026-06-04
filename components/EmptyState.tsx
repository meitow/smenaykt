type EmptyStateProps = {
  title: string;
  hint?: string;
};

export function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div className="info-card relative overflow-hidden px-4 py-10 text-center">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(26,170,236,0.08),transparent_55%)]"
        aria-hidden
      />
      <div className="relative">
        <p className="animate-float text-4xl" role="img" aria-hidden>
          🔍
        </p>
        <p className="mt-4 font-semibold text-ink">{title}</p>
        {hint && <p className="mt-2 text-[15px] leading-relaxed text-muted">{hint}</p>}
      </div>
    </div>
  );
}
