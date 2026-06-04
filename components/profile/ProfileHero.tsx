"use client";

import { useRef, useState } from "react";
import { UserAvatar } from "@/components/UserAvatar";
import { ProfileRatingBadge } from "@/components/StarRating";
import { formatRuPhone } from "@/lib/phone";
import { t } from "@/lib/i18n";

type ProfileHeroProps = {
  name: string;
  phone: string;
  avatarUrl: string | null;
  memberSince: string;
  avgRating: number | null;
  reviewCount: number;
  uploading: boolean;
  onAvatarPick: (file: File) => void;
  editable?: boolean;
};

function formatMemberSince(iso: string) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function ProfileHero({
  name,
  phone,
  avatarUrl,
  memberSince,
  avgRating,
  reviewCount,
  uploading,
  onAvatarPick,
  editable = true,
}: ProfileHeroProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function pickFile(file: File | undefined) {
    if (!file) return;
    onAvatarPick(file);
  }

  return (
    <section className="info-card overflow-visible p-5">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <UserAvatar name={name} imageUrl={avatarUrl} size={96} />
          {editable && (
            <>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className={`absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white shadow-soft transition active:scale-95 disabled:opacity-60 ${
                  dragOver ? "ring-2 ring-brand ring-offset-2" : ""
                }`}
                aria-label={t("profile.changePhoto")}
              >
                {uploading ? (
                  <span className="text-[11px] font-bold">…</span>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M12 16a4 4 0 100-8 4 4 0 000 8zM4 20h4l8-8 4 4V8a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
            </>
          )}
        </div>

        <h2 className="mt-4 text-[20px] font-bold text-ink">{name}</h2>
        {phone && <p className="mt-1 text-[15px] text-muted">{formatRuPhone(phone)}</p>}

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <ProfileRatingBadge avgRating={avgRating} reviewCount={reviewCount} />
          {memberSince && (
            <span className="rounded-full bg-page px-2.5 py-1 text-[13px] text-muted">
              {t("profile.memberSince", { date: formatMemberSince(memberSince) })}
            </span>
          )}
        </div>

        {editable && <p className="mt-3 text-[13px] text-muted">{t("profile.photoHint")}</p>}
      </div>
    </section>
  );
}

export function ProfileStatsGrid({
  completedTotal,
  postedTotal,
  acceptedTotal,
  earnedTotal,
}: {
  completedTotal: number;
  postedTotal: number;
  acceptedTotal: number;
  earnedTotal: number;
}) {
  const items = [
    { label: t("profile.statCompleted"), value: completedTotal },
    { label: t("profile.statPosted"), value: postedTotal },
    { label: t("profile.statAccepted"), value: acceptedTotal },
    {
      label: t("profile.statEarned"),
      value: `${earnedTotal.toLocaleString("ru-RU")} ₽`,
    },
  ];

  return (
    <section className="info-card grid grid-cols-2 divide-x divide-y divide-line sm:grid-cols-4 sm:divide-y-0">
      {items.map((item) => (
        <div key={item.label} className="px-3 py-4 text-center even:border-r-0 sm:even:border-r sm:[&:nth-child(2)]:border-r">
          <p className="text-[20px] font-bold leading-none text-ink">{item.value}</p>
          <p className="mt-1.5 text-[12px] leading-tight text-muted">{item.label}</p>
        </div>
      ))}
    </section>
  );
}
