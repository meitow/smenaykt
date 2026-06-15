"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DetailSheet } from "@/components/DetailSheet";
import { ProfileHero, ProfileStatsGrid } from "@/components/profile/ProfileHero";
import { ProfilePhoneField } from "@/components/TaskDetailActions";
import { StarRating } from "@/components/StarRating";
import { isValidRuPhone, normalizeRuPhone, formatRuPhone } from "@/lib/phone";
import {
  isTaskPublisher,
  isTaskWorker,
  taskCompletionLabel,
  userAwaitingCounterparty,
  userCanConfirmComplete,
} from "@/lib/task-completion";
import type { ProfileData, ProfilePendingReview, ProfileReview, Task } from "@/lib/types";
import { legalDocPath } from "@/lib/legal";
import {
  clearUserSession,
  getSavedAccounts,
  getUserAvatarUrl,
  getUserDisplayName,
  getUserPhone,
  profileCompletionPercent,
  rememberAccount,
  removeSavedAccount,
  setUserAvatarUrl,
  setUserDisplayName,
  setUserPhone,
  type SavedAccount,
} from "@/lib/user-session";
import { t } from "@/lib/i18n";

type TabKey = "history" | "reviews" | "settings";
type HistoryFilter = "all" | "posted" | "accepted" | "completed";

function statusLabel(task: Task) {
  const label = taskCompletionLabel(task);
  if (label === "done") return t("profile.statusDone");
  if (label === "awaiting") return t("profile.statusAwaitingClose");
  if (task.status === "ACCEPTED") return t("profile.statusAccepted");
  return t("profile.statusOpen");
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
  const canComplete = userCanConfirmComplete(task, normalizedPhone) && onComplete;
  const awaitingCounterparty = userAwaitingCounterparty(task, normalizedPhone);
  const canReview = task.status === "DONE" && onReview;

  return (
    <li className="px-4 py-3.5">
      <Link href={`/tasks/${task.id}`} className="flex items-center justify-between gap-3 active:opacity-90">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{task.title}</p>
          <p className="mt-0.5 text-[14px] text-muted">
            {task.timeLabel} · {statusLabel(task)}
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
  const [tab, setTab] = useState<TabKey>("history");
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
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [switchingAccount, setSwitchingAccount] = useState(false);

  const refreshSavedAccounts = useCallback(() => {
    setSavedAccounts(getSavedAccounts());
  }, []);

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
    rememberAccount({
      phone: data.phone,
      name: data.name,
      avatarUrl: data.avatarUrl ?? undefined,
    });
    refreshSavedAccounts();
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

    refreshSavedAccounts();
  }, [refreshSavedAccounts]);

  useEffect(() => {
    const onUserUpdated = () => refreshSavedAccounts();
    window.addEventListener("smenaykt_user_updated", onUserUpdated);
    return () => window.removeEventListener("smenaykt_user_updated", onUserUpdated);
  }, [refreshSavedAccounts]);

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

  const hasUnsavedChanges =
    name !== savedName ||
    phone !== savedPhone ||
    bio !== savedBio ||
    (avatarUrl ?? "") !== (savedAvatarUrl ?? "");

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
    if (isValidRuPhone(savedPhone)) {
      rememberAccount({
        phone: savedPhone,
        name: savedName.trim() || t("profile.guest"),
        avatarUrl: savedAvatarUrl ?? undefined,
      });
    }
    clearUserSession();
    resetToGuest();
    refreshSavedAccounts();
  }

  function startAddAccount() {
    if (hasUnsavedChanges) {
      syncDraftFromSaved();
    }
    if (isValidRuPhone(savedPhone)) {
      rememberAccount({
        phone: savedPhone,
        name: savedName.trim() || t("profile.guest"),
        avatarUrl: savedAvatarUrl ?? undefined,
      });
    }
    clearUserSession();
    resetToGuest();
    refreshSavedAccounts();
    setTab("settings");
  }

  async function switchToAccount(targetPhone: string) {
    if (!isValidRuPhone(targetPhone)) return;
    if (normalizeRuPhone(targetPhone) === normalizeRuPhone(savedPhone)) return;

    if (hasUnsavedChanges) {
      syncDraftFromSaved();
    }

    setSwitchingAccount(true);
    setError("");

    try {
      const res = await fetch(`/api/profile?phone=${encodeURIComponent(targetPhone)}&lookup=1`);
      const data = (await res.json()) as {
        error?: string;
        phone?: string;
        name?: string;
        bio?: string;
        avatarUrl?: string | null;
      };

      if (!res.ok) {
        applySavedProfile({
          phone: targetPhone,
          name: "",
          bio: "",
          avatarUrl: null,
        });
      } else {
        applySavedProfile({
          phone: data.phone ?? targetPhone,
          name: data.name?.trim() ?? "",
          bio: data.bio?.trim() ?? "",
          avatarUrl: data.avatarUrl ?? null,
        });
      }

      setSaveSuccess(false);
      await loadProfile(targetPhone);
    } catch {
      setError(t("profile.loadError"));
    } finally {
      setSwitchingAccount(false);
    }
  }

  function forgetAccount(targetPhone: string) {
    removeSavedAccount(targetPhone);
    refreshSavedAccounts();
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
      setTab("reviews");
    } catch {
      setReviewError(t("profile.reviewError"));
    } finally {
      setReviewSubmitting(false);
    }
  }

  const displayName = savedName.trim() || t("profile.guest");
  const stats = profile?.stats;
  const completion = profileCompletionPercent(
    tab === "settings" ? name : savedName,
    tab === "settings" ? phone : savedPhone,
    (tab === "settings" ? avatarUrl : savedAvatarUrl) ?? undefined,
    tab === "settings" ? bio : savedBio
  );

  const tabs: { key: TabKey; label: string }[] = [
    { key: "history", label: t("profile.tabHistory") },
    { key: "reviews", label: t("profile.tabReviews") },
    { key: "settings", label: t("profile.tabSettings") },
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
      />

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

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-semibold transition ${
              tab === item.key ? "bg-brand text-white shadow-soft" : "bg-surface text-muted ring-1 ring-black/[0.05]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <p className="text-center text-[14px] text-rose-600">{error}</p>}

      {tab === "history" && (
        <section className="info-card">
          <div className="flex gap-2 overflow-x-auto px-4 pt-4">
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
            <p className="px-4 py-4 text-[14px] text-muted">{t("profile.noHistory")}</p>
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

      {tab === "reviews" && (
        <section className="info-card">
          <h2 className="px-4 pt-4 text-[15px] font-semibold text-ink">{t("profile.reviewsTitle")}</h2>
          {loading && isValidRuPhone(savedPhone) ? (
            <p className="px-4 py-4 text-[14px] text-muted">{t("profile.loadingTasks")}</p>
          ) : !profile?.reviews.length ? (
            <p className="px-4 py-4 text-[14px] text-muted">{t("profile.noReviews")}</p>
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

      {tab === "settings" && (
        <section className="info-card p-5">
          <div className="rounded-2xl bg-page px-4 py-4">
            <h2 className="text-[15px] font-semibold text-ink">{t("profile.accountsTitle")}</h2>
            <p className="mt-1 text-[13px] text-muted">{t("profile.accountsHint")}</p>

            {savedAccounts.length > 0 && (
              <ul className="mt-3 space-y-2">
                {savedAccounts.map((account) => {
                  const active =
                    normalizeRuPhone(savedPhone) === normalizeRuPhone(account.phone);
                  return (
                    <li
                      key={account.phone}
                      className="flex items-center justify-between gap-2 rounded-xl border border-line bg-white px-3 py-2.5"
                    >
                      <button
                        type="button"
                        disabled={switchingAccount || active}
                        onClick={() => switchToAccount(account.phone)}
                        className="min-w-0 flex-1 text-left active:opacity-80 disabled:opacity-100"
                      >
                        <p className="truncate font-medium text-ink">
                          {account.name.trim() || t("profile.guest")}
                        </p>
                        <p className="truncate text-[13px] text-muted">{formatRuPhone(account.phone)}</p>
                      </button>
                      <div className="flex shrink-0 items-center gap-2">
                        {active && (
                          <span className="rounded-full bg-brand-light px-2 py-0.5 text-[12px] font-semibold text-brand-dark">
                            {t("profile.accountActive")}
                          </span>
                        )}
                        {!active && (
                          <button
                            type="button"
                            onClick={() => forgetAccount(account.phone)}
                            className="text-[12px] font-medium text-muted active:opacity-80"
                          >
                            {t("profile.forgetAccount")}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={startAddAccount}
                className="btn-secondary flex-1 !py-3 text-[15px]"
              >
                {t("profile.addAccount")}
              </button>
              <button
                type="button"
                onClick={logout}
                disabled={!savedPhone && !savedName}
                className="btn-secondary flex-1 !py-3 text-[15px] disabled:opacity-50"
              >
                {t("profile.logout")}
              </button>
            </div>
          </div>

          <label className="mt-5 block">
            <span className="text-[15px] font-medium text-muted">{t("profile.nameLabel")}</span>
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={t("profile.namePlaceholder")}
              className="input-field"
              maxLength={32}
            />
          </label>

          <ProfilePhoneField value={phone} onChange={onPhoneChange} />

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

          <div className="mt-5">
            <div className="flex items-center justify-between text-[15px]">
              <span className="font-medium text-ink">{t("profile.completion")}</span>
              <span className="font-semibold text-ink">{completion}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-page">
              <div
                className="h-full rounded-full bg-ink transition-all duration-300"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="mt-2 text-[13px] text-muted">{t("profile.completionHint")}</p>
          </div>

          {hasUnsavedChanges && phone !== savedPhone && isValidRuPhone(phone) && (
            <p className="mt-4 text-[13px] text-muted">{t("profile.accountSwitchHint")}</p>
          )}
          {hasUnsavedChanges && (
            <p className="mt-2 text-[13px] font-medium text-brand">{t("profile.unsavedHint")}</p>
          )}
          {saveSuccess && (
            <p className="mt-2 text-[13px] font-medium text-taiga">{t("profile.saveSuccess")}</p>
          )}

          <div className="mt-4 flex gap-2">
            {hasUnsavedChanges && (
              <button type="button" onClick={syncDraftFromSaved} className="btn-secondary flex-1 !py-3">
                {t("profile.cancelChanges")}
              </button>
            )}
            <button
              type="button"
              onClick={saveChanges}
              disabled={saving || !isValidRuPhone(phone)}
              className="btn-gradient flex-1 disabled:opacity-50"
            >
              {saving ? t("profile.saving") : t("profile.saveChanges")}
            </button>
          </div>

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
