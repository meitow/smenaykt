"use client";

export type ProfileSectionKey = "anketa" | "contacts" | "history" | "reviews";

export type ProfileMenuItem = {
  key: ProfileSectionKey;
  emoji: string;
  title: string;
  subtitle: string;
  alert?: boolean;
};

type ProfileMenuNavProps = {
  items: ProfileMenuItem[];
  activeKey: ProfileSectionKey | null;
  onSelect: (key: ProfileSectionKey) => void;
};

export function ProfileMenuNav({ items, activeKey, onSelect }: ProfileMenuNavProps) {
  return (
    <nav className="info-card divide-y divide-line overflow-hidden">
      {items.map((item) => {
        const active = activeKey === item.key;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-page/80 ${
              active ? "bg-brand-light/50" : ""
            }`}
          >
            <span className="shrink-0 text-xl leading-none" aria-hidden>
              {item.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{item.title}</p>
              <p className="mt-0.5 truncate text-[13px] text-muted">{item.subtitle}</p>
            </div>
            {item.alert ? (
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white"
                aria-hidden
              >
                !
              </span>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0 text-muted"
                aria-hidden
              >
                <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        );
      })}
    </nav>
  );
}
