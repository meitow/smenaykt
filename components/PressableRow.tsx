import type { ReactNode } from "react";

type PressableRowProps = {
  onClick?: () => void;
  href?: string;
  external?: boolean;
  leading?: ReactNode;
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  valueClassName?: string;
  showChevron?: boolean;
  className?: string;
};

function Chevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-muted" aria-hidden>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RowContent({
  leading,
  icon,
  title,
  subtitle,
  value,
  valueClassName = "",
  showChevron = true,
}: Omit<PressableRowProps, "onClick" | "href" | "className">) {
  return (
    <>
      {leading}
      {icon && <div className="mt-0.5 shrink-0 text-ink">{icon}</div>}
      <div className="min-w-0 flex-1 text-left">
        <p className="font-medium leading-snug text-ink">{title}</p>
        {subtitle && <p className="mt-0.5 text-[14px] text-muted">{subtitle}</p>}
      </div>
      {value && <p className={`shrink-0 text-[17px] font-bold ${valueClassName}`}>{value}</p>}
      {showChevron && <Chevron />}
    </>
  );
}

export function PressableRow({
  onClick,
  href,
  external = false,
  leading,
  icon,
  title,
  subtitle,
  value,
  valueClassName,
  showChevron = true,
  className = "",
}: PressableRowProps) {
  const baseClass = `flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-page ${className}`;

  if (href) {
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={baseClass}
      >
        <RowContent
          leading={leading}
          icon={icon}
          title={title}
          subtitle={subtitle}
          value={value}
          valueClassName={valueClassName}
          showChevron={showChevron}
        />
      </a>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={baseClass}>
        <RowContent
          leading={leading}
          icon={icon}
          title={title}
          subtitle={subtitle}
          value={value}
          valueClassName={valueClassName}
          showChevron={showChevron}
        />
      </button>
    );
  }

  return (
    <div className={baseClass}>
      <RowContent
        leading={leading}
        icon={icon}
        title={title}
        subtitle={subtitle}
        value={value}
        valueClassName={valueClassName}
        showChevron={false}
      />
    </div>
  );
}
