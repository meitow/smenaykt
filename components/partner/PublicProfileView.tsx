"use client";

import Link from "next/link";
import { ProfileHero, ProfileStatsGrid } from "@/components/profile/ProfileHero";
import { StarRating } from "@/components/StarRating";
import type { ProfileData, ProfileReview } from "@/lib/types";
import { formatRuPhone } from "@/lib/phone";
import { t } from "@/lib/i18n";

function formatReviewDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(
      new Date(iso)
    );
  } catch {
    return "";
  }
}

function ReviewCard({ review }: { review: ProfileReview }) {
  return (
    <article className="px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink">{review.reviewerName}</p>
          <p className="mt-0.5 text-[13px] text-muted">{review.taskTitle}</p>
        </div>
        <span className="shrink-0 text-[13px] text-muted">{formatReviewDate(review.createdAt)}</span>
      </div>
      <div className="mt-2">
        <StarRating value={review.rating} size="sm" />
      </div>
      {review.comment && (
        <p className="mt-2 text-[14px] leading-relaxed text-ink">{review.comment}</p>
      )}
    </article>
  );
}

type PublicProfileViewProps = {
  profile: ProfileData;
  backHref?: string;
  backLabel?: string;
  actionSlot?: React.ReactNode;
};

export function PublicProfileView({ profile, backHref, backLabel, actionSlot }: PublicProfileViewProps) {
  const displayName = profile.name.trim() || t("profile.guest");

  return (
    <div className="space-y-3">
      {backHref && (
        <Link href={backHref} className="inline-block text-[14px] font-medium text-brand">
          {backLabel ?? t("partner.back")}
        </Link>
      )}

      <ProfileHero
        name={displayName}
        phone={profile.phone}
        avatarUrl={profile.avatarUrl}
        memberSince={profile.memberSince}
        avgRating={profile.stats.avgRating}
        reviewCount={profile.stats.reviewCount}
        uploading={false}
        onAvatarPick={() => undefined}
        editable={false}
      />

      {profile.bio && (
        <section className="info-card px-4 py-4">
          <h2 className="text-[15px] font-semibold text-ink">{t("profile.bioLabel")}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">{profile.bio}</p>
        </section>
      )}

      <ProfileStatsGrid
        completedTotal={profile.stats.completedTotal}
        postedTotal={profile.stats.postedTotal}
        acceptedTotal={profile.stats.acceptedTotal}
        earnedTotal={profile.stats.earnedTotal}
      />

      {actionSlot}

      <section className="info-card">
        <h2 className="px-4 pt-4 text-[15px] font-semibold text-ink">{t("profile.reviewsTitle")}</h2>
        <p className="px-4 pb-1 text-[13px] text-muted">{t("profile.reviewsVerifiedHint")}</p>
        {profile.reviews.length === 0 ? (
          <p className="px-4 py-4 text-[14px] text-muted">{t("profile.noReviews")}</p>
        ) : (
          <div className="mt-1 divide-y divide-line">
            {profile.reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </section>

      <section className="info-card px-4 py-4">
        <p className="text-[14px] text-muted">{t("partner.profileContactHint")}</p>
        <a href={`tel:${profile.phone}`} className="mt-2 inline-block text-[17px] font-semibold text-brand">
          {formatRuPhone(profile.phone)}
        </a>
      </section>
    </div>
  );
}
