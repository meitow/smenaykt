"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DetailSheet } from "@/components/DetailSheet";
import { ProfileIdentitySection } from "@/components/profile/ProfileIdentitySection";
import { ProfileHero, ProfileStatsGrid } from "@/components/profile/ProfileHero";
import { ProfileMenuNav, type ProfileSectionKey } from "@/components/profile/ProfileMenuNav";
import { ProfilePhoneField } from "@/components/TaskDetailActions";
import { StarRating } from "@/components/StarRating";
import { isValidRuPhone, normalizeRuPhone } from "@/lib/phone";
import { getTaskStatusBadge } from "@/lib/task-status";
import {
  isTaskPublisher,
  isTaskWorker,
  userAwaitingCounterparty,
  userCanConfirmComplete,
} from "@/lib/task-completion";
import type { ProfileData, ProfilePendingReview, ProfileReview, Task } from "@/lib/types";
import { legalDocPath } from "@/lib/legal";
import { SUPPORT_TELEGRAM_URL, supportMailtoUrl } from "@/lib/support";
import {
  anketaCompletionPercent,
  contactsCompletionPercent,
  isProfileIncomplete,
  profileCompletionPercent,
} from "@/lib/profile-completion";
import {
  clearUserSession,
  getUserAvatarUrl,
  getUserDisplayName,
  getUserPhone,
  setUserAvatarUrl,
  setUserDisplayName,
  setUserPhone,
} from "@/lib/user-session";
import { t } from "@/lib/i18n";

type HistoryFilter = "all" | "posted" | "accepted" | "completed";

function statusLabel(task: Task) {
  return getTaskStatusBadge(task);
}

function formatReviewDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(
      new Date(iso)
    );
  } catch {
    return "";
  }
}

function ProfileTaskRow({
  task,
  phone,
  onComplete,
  onReview,
  completing,
}: {
  task: Task;
  phone: string;
  onComplete?: (taskId: string) => void;
  onReview?: (item: ProfilePendingReview) => void;
  completing?: boolean;
}) {
  const normalizedPhone = normalizeRuPhone(phone) ?? phone;
  const asPublisher = isTaskPublisher(task, normalizedPhone);
  const asWorker = isTaskWorker(task, normalizedPhone);
  const badge = statusLabel(task);
  const canComplete = userCanConfirmComplete(task, normalizedPhone) && onComplete;
  const awaitingCounterparty = userAwaitingCounterparty(task, normalizedPhone);
  const canReview = task.status === "DONE" && onReview;

  return (
    <li className="px-4 py-3.5">
      <Link href={`/tasks/${task.id}`} className="flex items-center justify-between gap-3 active:opacity-90">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{task.title}</p>
          <p className="mt-0.5 text-[14px] text-muted">
            {task.timeLabel}
            <span className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}>
              {badge.text}
            </span>
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-semibold text-taiga">{task.pay.toLocaleString("ru-RU")} ₽</p>
        </div>
      </Link>
      {(canComplete || awaitingCounterparty || canReview) && (
        <div className="mt-2 space-y-2">
          {awaitingCounterparty && (
            <p className="text-[13px] text-muted">{t("profile.waitingCounterparty")}</p>
          )}
          <div className="flex gap-2">
          {canComplete && (
            <button
              type="button"
              disabled={completing}
              onClick={() => onComplete?.(task.id)}
              className="rounded-xl bg-page px-3 py-2 text-[13px] font-semibold text-ink active:opacity-80 disabled:opacity-50"
            >
              {completing ? t("profile.completing") : t("profile.markComplete")}
            </button>
          )}
          {canReview && (
            <button
              type="button"
              onClick={() =>
                onReview?.({
                  taskId: task.id,
                  title: task.title,
                  counterpartyName: asPublisher
                    ? task.workerName?.trim() || t("profile.workerFallback")
                    : t("profile.publisherFallback"),
                })
              }
              className="rounded-xl bg-brand-light px-3 py-2 text-[13px] font-semibold text-brand-dark active:opacity-80"
            >
              {t("profile.leaveReview")}
            </button>
          )}
          </div>
        </div>
      )}
    </li>
  );
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

export function ProfilePanel() {
  const [section, setSection] = useState<ProfileSectionKey | null>(null);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");

  const [savedPhone, setSavedPhone] = useState("");
  const [savedName, setSavedName] = useState("");
  const [savedBio, setSavedBio] = useState("");
  const [savedAvatarUrl, setSavedAvatarUrl] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ProfilePendingReview | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [error, setError] = useState("");
  const [isModerator, setIsModerator] = useState(false);

  const loadProfile = useCallback(async (userPhone: string) => {
    if (!isValidRuPhone(userPhone)) {
      setProfile(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/profile?phone=${encodeURIComponent(userPhone)}`);
      const data = (await res.json()) as ProfileData & { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Ошибка");
        setProfile(null);
        return;
      }

      setProfile(data);
    } catch {
      setError(t("profile.loadError"));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  function syncDraftFromSaved() {
    setName(savedName);
    setPhone(savedPhone);
    setBio(savedBio);
    setAvatarUrl(savedAvatarUrl);
    setSaveSuccess(false);
    setError("");
  }

  function applySavedProfile(data: {
    phone: string;
    name: string;
    bio: string;
    avatarUrl: string | null;
  }) {
    setSavedPhone(data.phone);
    setSavedName(data.name);
    setSavedBio(data.bio);
    setSavedAvatarUrl(data.avatarUrl);
    setName(data.name);
    setPhone(data.phone);
    setBio(data.bio);
    setAvatarUrl(data.avatarUrl);
    setUserDisplayName(data.name);
    setUserPhone(data.phone);
    if (data.avatarUrl) setUserAvatarUrl(data.avatarUrl);
    else setUserAvatarUrl("");
  }

  useEffect(() => {
    const sessionPhone = getUserPhone();
    const sessionName = getUserDisplayName();
    const sessionAvatar = getUserAvatarUrl() || null;
    const initialName = sessionName === t("profile.guest") ? "" : sessionName;

    setSavedPhone(sessionPhone);
    setSavedName(initialName);
    setSavedAvatarUrl(sessionAvatar);
    setPhone(sessionPhone);
    setName(initialName);
    setAvatarUrl(sessionAvatar);

    if (!isValidRuPhone(sessionPhone)) return;

    fetch(`/api/profile?phone=${encodeURIComponent(sessionPhone)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ProfileData | null) => {
        if (!data) return;
        setProfile(data);
        applySavedProfile({
          phone: data.phone,
          name: data.name.trim() || initialName,
          bio: data.bio,
          avatarUrl: data.avatarUrl,
        });
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isValidRuPhone(savedPhone)) {
      setIsModerator(false);
      return;
    }

    fetch("/api/admin/session", {
      headers: { "x-moderator-phone": savedPhone },
    })
      .then((res) => setIsModerator(res.ok))
      .catch(() => setIsModerator(false));
  }, [savedPhone]);

  useEffect(() => {
    if (isValidRuPhone(savedPhone)) {
      loadProfile(savedPhone);
    }
  }, [savedPhone, loadProfile]);

  useEffect(() => {
    if (!isValidRuPhone(phone) || phone === savedPhone) return;

    let cancelled = false;

    fetch(`/api/profile?phone=${encodeURIComponent(phone)}&lookup=1`)
      .then(async (res) => {
        if (cancelled) return;

        if (res.ok) {
          const data = (await res.json()) as {
            name?: string;
            bio?: string;
            avatarUrl?: string | null;
          };
          setName(data.name?.trim() ?? "");
          setBio(data.bio?.trim() ?? "");
          setAvatarUrl(data.avatarUrl ?? null);
          return;
        }

        setName("");
        setBio("");
        setAvatarUrl(null);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [phone, savedPhone]);

  const pendingReviewIds = useMemo(
    () => new Set(profile?.pendingReviews.map((item) => item.taskId) ?? []),
    [profile?.pendingReviews]
  );

  const historyItems = useMemo(() => {
    if (!profile) return [];

    if (historyFilter === "posted") return profile.posted;
    if (historyFilter === "accepted") return profile.accepted;
    if (historyFilter === "completed") return profile.history;

    const merged = new Map<string, Task>();
    for (const task of [...profile.posted, ...profile.accepted, ...profile.history]) {
      merged.set(task.id, task);
    }
    return [...merged.values()].sort((a, b) => {
      const aTime = a.completedAt ?? a.acceptedAt ?? a.scheduledAt ?? "";
      const bTime = b.completedAt ?? b.acceptedAt ?? b.scheduledAt ?? "";
      return bTime.localeCompare(aTime);
    });
  }, [profile, historyFilter]);

  function onNameChange(value: string) {
    setName(value);
    setSaveSuccess(false);
  }

  function onPhoneChange(value: string) {
    setPhone(value);
    setSaveSuccess(false);

    const next = normalizeRuPhone(value);
    const current = normalizeRuPhone(savedPhone);
    if (next && current && next === current) {
      setName(savedName);
      setBio(savedBio);
      setAvatarUrl(savedAvatarUrl);
    }
  }

  function onBioChange(value: string) {
    setBio(value);
    setSaveSuccess(false);
  }

  function resetToGuest() {
    setSavedPhone("");
    setSavedName("");
    setSavedBio("");
    setSavedAvatarUrl(null);
    setName("");
    setPhone("");
    setBio("");
    setAvatarUrl(null);
    setProfile(null);
    setSaveSuccess(false);
    setError("");
  }

  function logout() {
    clearUserSession();
    resetToGuest();
  }

  async function saveChanges() {
    if (!isValidRuPhone(phone)) {
      setError(t("profile.phoneInvalidSave"));
      return;
    }

    setSaving(true);
    setError("");
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          name,
          bio,
          avatarUrl,
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        name?: string;
        avatarUrl?: string | null;
        bio?: string;
        phone?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Ошибка");
        return;
      }

      applySavedProfile({
        phone: data.phone ?? phone,
        name: data.name ?? name,
        bio: data.bio ?? bio,
        avatarUrl: data.avatarUrl ?? avatarUrl,
      });

      setSaveSuccess(true);
      await loadProfile(data.phone ?? phone);
    } catch {
      setError(t("profile.loadError"));
    } finally {
      setSaving(false);
    }
  }

  async function onAvatarPick(file: File) {
    const uploadPhone = isValidRuPhone(phone) ? phone : savedPhone;

    if (!isValidRuPhone(uploadPhone)) {
      setError(t("profile.phoneInvalidSave"));
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.set("phone", uploadPhone);
      formData.set("file", file);

      const res = await fetch("/api/profile/avatar", { method: "POST", body: formData });
      const data = (await res.json()) as { avatarUrl?: string; error?: string };

      if (!res.ok || !data.avatarUrl) {
        setError(data.error ?? "Ошибка");
        return;
      }

      setAvatarUrl(data.avatarUrl);
      setSaveSuccess(false);

      if (uploadPhone === savedPhone) {
        setSavedAvatarUrl(data.avatarUrl);
        setUserAvatarUrl(data.avatarUrl);
        await loadProfile(savedPhone);
      }
    } catch {
      setError(t("profile.uploadError"));
    } finally {
      setUploading(false);
    }
  }

  async function markComplete(taskId: string) {
    if (!isValidRuPhone(savedPhone)) return;

    setCompletingId(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: savedPhone }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Ошибка");
        return;
      }

      await loadProfile(savedPhone);
    } catch {
      setError(t("profile.completeError"));
    } finally {
      setCompletingId(null);
    }
  }

  async function submitReview() {
    if (!reviewTarget || !isValidRuPhone(savedPhone)) return;

    setReviewSubmitting(true);
    setReviewError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: reviewTarget.taskId,
          reviewerPhone: savedPhone,
          reviewerName: savedName.trim() || name.trim(),
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setReviewError(data.error ?? "Ошибка");
        return;
      }

      setReviewTarget(null);
      setReviewComment("");
      setReviewRating(5);
      await loadProfile(savedPhone);
      setSection("reviews");
    } catch {
      setReviewError(t("profile.reviewError"));
    } finally {
      setReviewSubmitting(false);
    }
  }

  const displayName = savedName.trim() || t("profile.guest");
  const stats = profile?.stats;
  const draftActive = section === "anketa" || section === "contacts";
  const completionName = draftActive && section === "anketa" ? name : savedName;
  const completionPhone = draftActive && section === "contacts" ? phone : savedPhone;
  const completionAvatar =
    draftActive && section === "anketa" ? avatarUrl : savedAvatarUrl;
  const completionBio = draftActive && section === "anketa" ? bio : savedBio;
  const completion = profileCompletionPercent(
    completionName,
    completionPhone,
    completionAvatar ?? undefined,
    completionBio
  );
  const anketaCompletion = anketaCompletionPercent(
    completionName,
    completionAvatar ?? undefined,
    completionBio
  );
  const contactsCompletion = contactsCompletionPercent(completionPhone);
  const profileIncomplete = isProfileIncomplete(
    savedName,
    savedPhone,
    savedAvatarUrl ?? undefined,
    savedBio
  );

  const anketaUnsaved =
    name !== savedName || bio !== savedBio || (avatarUrl ?? "") !== (savedAvatarUrl ?? "");
  const contactsUnsaved = phone !== savedPhone;

  useEffect(() => {
    if (section !== null) return;
    if (isProfileIncomplete(savedName, savedPhone, savedAvatarUrl ?? undefined, savedBio)) {
      setSection("anketa");
    }
  }, [section, savedName, savedPhone, savedAvatarUrl, savedBio]);

  const menuItems = [
    {
      key: "anketa" as const,
      emoji: "👤",
      title: t("profile.menuAnketa"),
      subtitle:
        anketaCompletion >= 100
          ? t("profile.menuAnketaHint", { percent: 100 })
          : anketaCompletion > 0
            ? t("profile.menuAnketaHint", { percent: anketaCompletion })
            : t("profile.menuAnketaIncomplete"),
      alert: anketaCompletion < 100,
    },
    {
      key: "contacts" as const,
      emoji: "📞",
      title: t("profile.menuContacts"),
      subtitle:
        contactsCompletion >= 100 ? t("profile.menuContactsDone") : t("profile.menuContactsCheck"),
      alert: contactsCompletion < 100,
    },
    {
      key: "history" as const,
      emoji: "📜",
      title: t("profile.menuHistory"),
      subtitle: stats
        ? t("profile.filterCompleted") + `: ${stats.completedTotal}`
        : t("profile.filterAll"),
      alert: false,
    },
    {
      key: "reviews" as const,
      emoji: "⭐",
      title: t("profile.menuReviews"),
      subtitle: stats?.reviewCount
        ? t("profile.reviewsTitle") + ` · ${stats.reviewCount}`
        : t("profile.noReviews"),
      alert: false,
    },
  ];

  const historyFilters: { key: HistoryFilter; label: string }[] = [
    { key: "all", label: t("profile.filterAll") },
    { key: "posted", label: t("profile.filterPosted") },
    { key: "accepted", label: t("profile.filterAccepted") },
    { key: "completed", label: t("profile.filterCompleted") },
  ];

  return (
    <div className="space-y-3">
      <ProfileHero
        name={displayName}
        phone={savedPhone}
        avatarUrl={savedAvatarUrl}
        memberSince={profile?.memberSince ?? ""}
        avgRating={stats?.avgRating ?? null}
        reviewCount={stats?.reviewCount ?? 0}
        uploading={uploading}
        onAvatarPick={onAvatarPick}
        completionPercent={completion}
      />

      {completion < 100 && (
        <button
          type="button"
          onClick={() => setSection("anketa")}
          className="w-full rounded-2xl bg-gradient-to-r from-brand to-taiga px-4 py-3.5 text-left text-white shadow-card transition active:scale-[0.99]"
        >
          <p className="text-[16px] font-bold">{t("profile.verifyIdentity")}</p>
          <p className="mt-0.5 text-[13px] text-white/90">{t("profile.verifyIdentityHint")}</p>
        </button>
      )}

      {stats && (
        <ProfileStatsGrid
          completedTotal={stats.completedTotal}
          postedTotal={stats.postedTotal}
          acceptedTotal={stats.acceptedTotal}
          earnedTotal={stats.earnedTotal}
        />
      )}

      {profile && profile.pendingReviews.length > 0 && (
        <section className="info-card px-4 py-3">
          <p className="text-[14px] font-medium text-ink">{t("profile.pendingReviewsTitle")}</p>
          <ul className="mt-2 space-y-2">
            {profile.pendingReviews.map((item) => (
              <li key={item.taskId}>
                <button
                  type="button"
                  onClick={() => {
                    setReviewTarget(item);
                    setReviewRating(5);
                    setReviewComment("");
                    setReviewError("");
                  }}
                  className="flex w-full items-center justify-between rounded-xl bg-brand-light/60 px-3 py-2.5 text-left active:opacity-90"
                >
                  <span className="truncate text-[14px] font-medium text-brand-dark">{item.title}</span>
                  <span className="shrink-0 text-[13px] font-semibold text-brand">{t("profile.leaveReview")}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ProfileMenuNav items={menuItems} activeKey={section} onSelect={setSection} />

      {error && <p className="text-center text-[14px] text-rose-600">{error}</p>}

      {section === "history" && (
        <section className="info-card">
          <div className="flex gap-2 overflow-x-auto px-4 pt-4 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {historyFilters.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setHistoryFilter(item.key)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold ${
                  historyFilter === item.key ? "bg-page text-ink" : "text-muted"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {loading && isValidRuPhone(savedPhone) ? (
            <p className="px-4 py-4 text-[14px] text-muted">{t("profile.loadingTasks")}</p>
          ) : !isValidRuPhone(savedPhone) ? (
            <p className="px-4 py-4 text-[14px] text-muted">{t("profile.phoneRequired")}</p>
          ) : historyItems.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-[14px] text-muted">
                {profileIncomplete ? t("profile.historyEmptyIncomplete") : t("profile.noHistory")}
              </p>
              {profileIncomplete && (
                <button type="button" onClick={() => setSection("anketa")} className="btn-soft mt-4 !py-2.5">
                  {t("profile.fillAnketa")}
                </button>
              )}
            </div>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {historyItems.map((task) => (
                <ProfileTaskRow
                  key={task.id}
                  task={task}
                  phone={savedPhone}
                  completing={completingId === task.id}
                  onComplete={markComplete}
                  onReview={
                    pendingReviewIds.has(task.id)
                      ? (item) => {
                          setReviewTarget(item);
                          setReviewRating(5);
                          setReviewComment("");
                          setReviewError("");
                        }
                      : undefined
                  }
                />
              ))}
            </ul>
          )}
        </section>
      )}

      {section === "reviews" && (
        <section className="info-card">
          <h2 className="px-4 pt-4 text-[15px] font-semibold text-ink">{t("profile.reviewsTitle")}</h2>
          {loading && isValidRuPhone(savedPhone) ? (
            <p className="px-4 py-4 text-[14px] text-muted">{t("profile.loadingTasks")}</p>
          ) : !profile?.reviews.length ? (
            <div className="px-4 py-6 text-center">
              <p className="text-[14px] text-muted">
                {profileIncomplete ? t("profile.reviewsEmptyIncomplete") : t("profile.noReviews")}
              </p>
              {profileIncomplete && (
                <button type="button" onClick={() => setSection("anketa")} className="btn-soft mt-4 !py-2.5">
                  {t("profile.fillAnketa")}
                </button>
              )}
            </div>
          ) : (
            <>
            <p className="px-4 pb-1 text-[13px] text-muted">{t("profile.reviewsVerifiedHint")}</p>
            <div className="mt-1 divide-y divide-line">
              {profile.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
            </>
          )}
        </section>
      )}

      {section === "anketa" && (
        <section className="info-card p-5">
          <label className="block">
            <span className="text-[15px] font-medium text-muted">{t("profile.nameLabel")}</span>
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={t("profile.namePlaceholder")}
              className="input-field"
              maxLength={32}
            />
          </label>

          <label className="mt-4 block text-left">
            <span className="text-[15px] font-medium text-muted">{t("profile.bioLabel")}</span>
            <textarea
              value={bio}
              onChange={(e) => onBioChange(e.target.value)}
              placeholder={t("profile.bioPlaceholder")}
              rows={4}
              maxLength={280}
              className="input-field resize-none"
            />
            <p className="mt-1 text-[13px] text-muted">{t("profile.bioHint")}</p>
          </label>

          <p className="mt-4 text-[13px] text-muted">{t("profile.photoHint")}</p>

          {anketaUnsaved && (
            <p className="mt-3 text-[13px] font-medium text-brand">{t("profile.unsavedHint")}</p>
          )}
          {saveSuccess && (
            <p className="mt-2 text-[13px] font-medium text-taiga">{t("profile.saveSuccess")}</p>
          )}

          {anketaUnsaved && (
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={syncDraftFromSaved} className="btn-secondary flex-1 !py-3">
                {t("profile.cancelChanges")}
              </button>
              <button
                type="button"
                onClick={saveChanges}
                disabled={saving || !isValidRuPhone(phone)}
                className="btn-gradient flex-1 disabled:opacity-50"
              >
                {saving ? t("profile.saving") : t("profile.saveChanges")}
              </button>
            </div>
          )}
        </section>
      )}

      {section === "contacts" && (
        <section className="info-card p-5">
          <ProfilePhoneField value={phone} onChange={onPhoneChange} />

          <ProfileIdentitySection phone={phone} />

          {contactsUnsaved && phone !== savedPhone && isValidRuPhone(phone) && (
            <p className="mt-4 text-[13px] text-muted">{t("profile.accountSwitchHint")}</p>
          )}
          {contactsUnsaved && (
            <p className="mt-2 text-[13px] font-medium text-brand">{t("profile.unsavedHint")}</p>
          )}
          {saveSuccess && (
            <p className="mt-2 text-[13px] font-medium text-taiga">{t("profile.saveSuccess")}</p>
          )}

          {contactsUnsaved && (
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={syncDraftFromSaved} className="btn-secondary flex-1 !py-3">
                {t("profile.cancelChanges")}
              </button>
              <button
                type="button"
                onClick={saveChanges}
                disabled={saving || !isValidRuPhone(phone)}
                className="btn-gradient flex-1 disabled:opacity-50"
              >
                {saving ? t("profile.saving") : t("profile.saveChanges")}
              </button>
            </div>
          )}

          <div className="mt-6 border-t border-line pt-5">
            <h2 className="text-[15px] font-semibold text-ink">{t("profile.legalTitle")}</h2>
            <div className="mt-3 space-y-2">
              <Link href={legalDocPath("offer")} className="block text-[15px] font-medium text-brand">
                {t("legal.offerTitle")}
              </Link>
              <Link href={legalDocPath("privacy")} className="block text-[15px] font-medium text-brand">
                {t("legal.privacyTitle")}
              </Link>
              <Link href={legalDocPath("terms")} className="block text-[15px] font-medium text-brand">
                {t("legal.termsTitle")}
              </Link>
            </div>
          </div>

          <div className="mt-5 border-t border-line pt-5">
            <h2 className="text-[15px] font-semibold text-ink">{t("profile.helpTitle")}</h2>
            <p className="mt-1 text-[14px] text-muted">{t("profile.helpHint")}</p>
            <div className="mt-3 space-y-2">
              <a
                href={SUPPORT_TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[15px] font-medium text-brand"
              >
                {t("profile.helpTelegram")}
              </a>
              <a href={supportMailtoUrl()} className="block text-[15px] font-medium text-brand">
                {t("profile.helpEmail")}
              </a>
            </div>
          </div>

          {isModerator && (
            <div className="mt-5 border-t border-line pt-5">
              <Link
                href={`/admin?from=profile&phone=${encodeURIComponent(savedPhone)}`}
                className="btn-outline w-full text-center"
              >
                {t("admin.openModeration")}
              </Link>
            </div>
          )}

          {isValidRuPhone(savedPhone) && (
            <div className="mt-8 border-t border-line pt-6 text-center">
              <button
                type="button"
                onClick={logout}
                className="text-[15px] font-medium text-muted transition active:text-rose-600"
              >
                {t("profile.logout")}
              </button>
            </div>
          )}
        </section>
      )}

      <DetailSheet
        open={!!reviewTarget}
        title={t("profile.reviewSheetTitle")}
        onClose={() => setReviewTarget(null)}
        footer={
          <div className="mt-4 space-y-3">
            {reviewError && <p className="text-center text-[14px] text-rose-600">{reviewError}</p>}
            <button
              type="button"
              onClick={submitReview}
              disabled={reviewSubmitting || reviewRating < 1}
              className="btn-gradient w-full disabled:opacity-50"
            >
              {reviewSubmitting ? t("profile.reviewSubmitting") : t("profile.reviewSubmit")}
            </button>
            <button
              type="button"
              onClick={() => setReviewTarget(null)}
              className="btn-secondary w-full !py-3 text-[15px]"
            >
              {t("task.acceptCancel")}
            </button>
          </div>
        }
      >
        {reviewTarget && (
          <div className="space-y-4">
            <div>
              <p className="font-medium text-ink">{reviewTarget.title}</p>
              <p className="mt-1 text-[14px] text-muted">
                {t("profile.reviewFor", { name: reviewTarget.counterpartyName })}
              </p>
            </div>
            <div>
              <p className="text-[15px] font-medium text-muted">{t("profile.reviewRatingLabel")}</p>
              <StarRating value={reviewRating} onChange={setReviewRating} className="mt-2" />
            </div>
            <label className="block">
              <span className="text-[15px] font-medium text-muted">{t("profile.reviewCommentLabel")}</span>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={t("profile.reviewCommentPlaceholder")}
                rows={4}
                maxLength={500}
                className="input-field resize-none"
              />
            </label>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
