"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell, type AdminTab } from "@/components/admin/AdminShell";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { formatRuPhone, isValidRuPhone } from "@/lib/phone";
import { getTaskStatusBadge } from "@/lib/task-status";
import { t } from "@/lib/i18n";

type Overview = {
  openTasks: number;
  hiddenTasks: number;
  acceptedTasks: number;
  doneTasks: number;
  bans: number;
  moderators: number;
  pendingIdentity: number;
};

type IdentityRow = {
  id: string;
  phone: string;
  status: string;
  mimeType: string;
  fileSize: number;
  rejectReason: string;
  reviewedAt: string | null;
  createdAt: string;
  profileName: string;
};

type BanRow = {
  phone: string;
  reason: string;
  bannedBy: string;
  createdAt: string;
};

type AdminTask = {
  id: string;
  title: string;
  place: string;
  pay: number;
  phone: string;
  workerPhone?: string | null;
  status?: string;
  hidden: boolean;
  source: string;
  createdAt: string;
};

type ModeratorRow = {
  phone: string;
  name: string;
  addedBy: string;
  createdAt: string;
};

type UserLookup = {
  phone: string;
  profile: { name: string; bio: string; avatarUrl: string | null; createdAt: string } | null;
  stats: { completedTotal: number; reviewCount: number; avgRating: number | null } | null;
  postedCount: number;
  acceptedCount: number;
  banned: boolean;
};

function parseTab(value: string | null): AdminTab {
  if (
    value === "tasks" ||
    value === "bans" ||
    value === "users" ||
    value === "moderators" ||
    value === "identity"
  ) {
    return value;
  }
  return "overview";
}

export function AdminDashboard({ initialTab }: { initialTab?: string }) {
  const auth = useAdminAuth();
  const [tab, setTab] = useState<AdminTab>(() => parseTab(initialTab ?? null));
  const [overview, setOverview] = useState<Overview | null>(null);
  const [bans, setBans] = useState<BanRow[]>([]);
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [moderators, setModerators] = useState<ModeratorRow[]>([]);
  const [identityQueue, setIdentityQueue] = useState<IdentityRow[]>([]);
  const [userLookup, setUserLookup] = useState<UserLookup | null>(null);
  const [banPhone, setBanPhone] = useState("");
  const [banReason, setBanReason] = useState("");
  const [lookupPhone, setLookupPhone] = useState("");
  const [modPhone, setModPhone] = useState("");
  const [modName, setModName] = useState("");
  const [busy, setBusy] = useState(false);
  const [panelError, setPanelError] = useState("");

  const loadOverview = useCallback(async () => {
    const res = await fetch("/api/admin/overview", { headers: auth.authHeaders() });
    const data = (await res.json()) as { overview?: Overview };
    if (res.ok) setOverview(data.overview ?? null);
  }, [auth.authHeaders]);

  const loadBans = useCallback(async () => {
    const res = await fetch("/api/admin/bans", { headers: auth.authHeaders() });
    const data = (await res.json()) as { bans?: BanRow[] };
    if (res.ok) setBans(data.bans ?? []);
  }, [auth.authHeaders]);

  const loadTasks = useCallback(async () => {
    const res = await fetch("/api/admin/tasks", { headers: auth.authHeaders() });
    const data = (await res.json()) as { tasks?: AdminTask[] };
    if (res.ok) setTasks(data.tasks ?? []);
  }, [auth.authHeaders]);

  const loadModerators = useCallback(async () => {
    const res = await fetch("/api/admin/moderators", { headers: auth.authHeaders() });
    const data = (await res.json()) as { moderators?: ModeratorRow[] };
    if (res.ok) setModerators(data.moderators ?? []);
  }, [auth.authHeaders]);

  const loadIdentityQueue = useCallback(async () => {
    const res = await fetch("/api/admin/identity?status=pending", { headers: auth.authHeaders() });
    const data = (await res.json()) as { submissions?: IdentityRow[] };
    if (res.ok) setIdentityQueue(data.submissions ?? []);
  }, [auth.authHeaders]);

  useEffect(() => {
    if (!auth.session) return;
    void loadOverview();
    if (tab === "bans") void loadBans();
    if (tab === "tasks") void loadTasks();
    if (tab === "moderators") void loadModerators();
    if (tab === "identity") void loadIdentityQueue();
  }, [auth.session, tab, loadOverview, loadBans, loadTasks, loadModerators, loadIdentityQueue]);

  async function addBan(event: React.FormEvent) {
    event.preventDefault();
    if (!isValidRuPhone(banPhone)) return;
    setBusy(true);
    setPanelError("");
    try {
      const res = await fetch("/api/admin/bans", {
        method: "POST",
        headers: auth.authHeaders(),
        body: JSON.stringify({ phone: banPhone, reason: banReason }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setPanelError(data.error ?? t("admin.saveError"));
        return;
      }
      setBanPhone("");
      setBanReason("");
      await Promise.all([loadBans(), loadOverview()]);
    } finally {
      setBusy(false);
    }
  }

  async function removeBan(phone: string) {
    setBusy(true);
    setPanelError("");
    try {
      const res = await fetch("/api/admin/bans", {
        method: "DELETE",
        headers: auth.authHeaders(),
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setPanelError(data.error ?? t("admin.saveError"));
        return;
      }
      await Promise.all([loadBans(), loadOverview()]);
    } finally {
      setBusy(false);
    }
  }

  async function patchTask(taskId: string, action: "hide" | "restore" | "delete") {
    setBusy(true);
    setPanelError("");
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "PATCH",
        headers: auth.authHeaders(),
        body: JSON.stringify({ taskId, action }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setPanelError(data.error ?? t("admin.saveError"));
        return;
      }
      await Promise.all([loadTasks(), loadOverview()]);
    } finally {
      setBusy(false);
    }
  }

  async function lookupUser(event: React.FormEvent) {
    event.preventDefault();
    if (!isValidRuPhone(lookupPhone)) return;
    setBusy(true);
    setPanelError("");
    try {
      const res = await fetch(`/api/admin/users?phone=${encodeURIComponent(lookupPhone)}`, {
        headers: auth.authHeaders(),
      });
      const data = (await res.json()) as UserLookup & { error?: string };
      if (!res.ok) {
        setUserLookup(null);
        setPanelError(data.error ?? t("admin.userNotFound"));
        return;
      }
      setUserLookup(data);
    } finally {
      setBusy(false);
    }
  }

  async function addModerator(event: React.FormEvent) {
    event.preventDefault();
    if (!isValidRuPhone(modPhone)) return;
    setBusy(true);
    setPanelError("");
    try {
      const res = await fetch("/api/admin/moderators", {
        method: "POST",
        headers: auth.authHeaders(),
        body: JSON.stringify({ phone: modPhone, name: modName }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setPanelError(data.error ?? t("admin.saveError"));
        return;
      }
      setModPhone("");
      setModName("");
      await Promise.all([loadModerators(), loadOverview()]);
    } finally {
      setBusy(false);
    }
  }

  async function removeModerator(phone: string) {
    setBusy(true);
    setPanelError("");
    try {
      const res = await fetch("/api/admin/moderators", {
        method: "DELETE",
        headers: auth.authHeaders(),
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setPanelError(data.error ?? t("admin.saveError"));
        return;
      }
      await Promise.all([loadModerators(), loadOverview()]);
    } finally {
      setBusy(false);
    }
  }

  async function openIdentityFile(id: string) {
    const res = await fetch(`/api/admin/identity/${id}/file`, { headers: auth.authHeaders() });
    if (!res.ok) {
      setPanelError(t("admin.identityFileError"));
      return;
    }
    const blob = await res.blob();
    window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
  }

  async function reviewIdentity(id: string, action: "approve" | "reject", rejectReason = "") {
    setBusy(true);
    setPanelError("");
    try {
      const res = await fetch(`/api/admin/identity/${id}/review`, {
        method: "POST",
        headers: auth.authHeaders(),
        body: JSON.stringify({ action, rejectReason }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setPanelError(data.error ?? t("admin.saveError"));
        return;
      }
      await Promise.all([loadIdentityQueue(), loadOverview()]);
    } finally {
      setBusy(false);
    }
  }

  if (auth.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[15px] text-muted">
        {t("profile.loadingTasks")}
      </div>
    );
  }

  if (!auth.session) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="page-title">{t("admin.panelTitle")}</h1>
        <p className="mt-2 text-[15px] text-muted">{t("admin.accessHint")}</p>

        <section className="info-card mt-6 p-5">
          <h2 className="text-[17px] font-semibold text-ink">{t("admin.accessByPhone")}</h2>
          <p className="mt-2 text-[14px] text-muted">
            {auth.sessionPhone && isValidRuPhone(auth.sessionPhone)
              ? t("admin.currentPhone", { phone: formatRuPhone(auth.sessionPhone) })
              : t("admin.noPhoneInApp")}
          </p>
          <Link href="/profile" className="btn-soft mt-4 block text-center">
            {t("admin.openProfile")}
          </Link>
        </section>

        <section className="info-card mt-4 p-5">
          <h2 className="text-[17px] font-semibold text-ink">{t("admin.accessBySecret")}</h2>
          <label className="mt-3 block">
            <span className="text-[15px] font-medium text-muted">{t("admin.secretLabel")}</span>
            <input
              type="password"
              value={auth.secret}
              onChange={(e) => auth.setSecret(e.target.value)}
              className="input-field"
              autoComplete="off"
            />
          </label>
          <p className="mt-2 text-[13px] text-muted">{t("admin.secretHint")}</p>
          <button type="button" onClick={auth.unlockWithSecret} className="btn-gradient mt-4 w-full">
            {t("admin.unlock")}
          </button>
        </section>

        {auth.error && <p className="mt-4 text-center text-[14px] text-rose-600">{auth.error}</p>}
      </div>
    );
  }

  return (
    <AdminShell
      activeTab={tab}
      onTabChange={setTab}
      sessionPhone={auth.session.phone ? formatRuPhone(auth.session.phone) : auth.sessionPhone}
      viaSecret={auth.session.viaSecret}
      onLogout={auth.lockSecret}
    >
      {panelError && <p className="mb-4 text-[14px] text-rose-600">{panelError}</p>}

      {tab === "overview" && overview && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { label: t("admin.statOpen"), value: overview.openTasks },
            { label: t("admin.statHidden"), value: overview.hiddenTasks },
            { label: t("admin.statAccepted"), value: overview.acceptedTasks },
            { label: t("admin.statDone"), value: overview.doneTasks },
            { label: t("admin.statBans"), value: overview.bans },
            { label: t("admin.statModerators"), value: overview.moderators },
            { label: t("admin.statIdentityPending"), value: overview.pendingIdentity },
          ].map((item) => (
            <div key={item.label} className="info-card p-4">
              <p className="text-[28px] font-bold text-ink">{item.value}</p>
              <p className="mt-1 text-[14px] text-muted">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "tasks" && (
        <section className="info-card">
          <h2 className="px-4 pt-4 text-[17px] font-semibold text-ink">{t("admin.tasksTitle")}</h2>
          {tasks.length === 0 ? (
            <p className="px-4 py-4 text-[14px] text-muted">{t("admin.tasksEmpty")}</p>
          ) : (
            <ul className="mt-1 divide-y divide-line">
              {tasks.map((task) => {
                const badge = getTaskStatusBadge({
                  id: task.id,
                  source: task.source as "person" | "partner",
                  title: task.title,
                  description: "",
                  category: "personal",
                  durationHours: 2,
                  pay: task.pay,
                  place: task.place,
                  timeLabel: "",
                  emoji: "📋",
                  lmkRequired: false,
                  phone: task.phone,
                  status: (task.status as "OPEN" | "ACCEPTED" | "DONE") ?? "OPEN",
                  workerPhone: task.workerPhone,
                });
                return (
                  <li key={task.id} className="px-4 py-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/tasks/${task.id}`} className="font-medium text-brand">
                          {task.title}
                        </Link>
                        <p className="mt-1 text-[13px] text-muted">
                          {task.place} · {task.pay.toLocaleString("ru-RU")} ₽ · {formatRuPhone(task.phone)}
                        </p>
                        <p className="mt-1 text-[12px] text-muted">
                          <span className={`rounded-full px-2 py-0.5 font-semibold ${badge.className}`}>
                            {badge.text}
                          </span>
                          {task.hidden && (
                            <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-700">
                              {t("admin.hiddenBadge")}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {task.hidden ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => patchTask(task.id, "restore")}
                            className="rounded-xl bg-page px-3 py-2 text-[13px] font-semibold text-ink"
                          >
                            {t("admin.restoreTask")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => patchTask(task.id, "hide")}
                            className="rounded-xl bg-page px-3 py-2 text-[13px] font-semibold text-ink"
                          >
                            {t("admin.hideTask")}
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => patchTask(task.id, "delete")}
                          className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] font-semibold text-rose-700"
                        >
                          {t("admin.deleteTask")}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {tab === "identity" && (
        <section className="info-card">
          <h2 className="px-4 pt-4 text-[17px] font-semibold text-ink">{t("admin.identityTitle")}</h2>
          <p className="px-4 pb-2 text-[14px] text-muted">{t("admin.identityHint")}</p>
          {identityQueue.length === 0 ? (
            <p className="px-4 py-4 text-[14px] text-muted">{t("admin.identityEmpty")}</p>
          ) : (
            <ul className="mt-1 divide-y divide-line">
              {identityQueue.map((row) => (
                <li key={row.id} className="px-4 py-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{row.profileName}</p>
                      <p className="mt-1 text-[13px] text-muted">{formatRuPhone(row.phone)}</p>
                      <p className="mt-1 text-[12px] text-muted">
                        {new Date(row.createdAt).toLocaleString("ru-RU")} ·{" "}
                        {Math.round(row.fileSize / 1024)} КБ
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openIdentityFile(row.id)}
                        className="rounded-xl bg-page px-3 py-2 text-[13px] font-semibold text-ink"
                      >
                        {t("admin.identityOpenFile")}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => reviewIdentity(row.id, "approve")}
                        className="rounded-xl bg-taiga/15 px-3 py-2 text-[13px] font-semibold text-taiga"
                      >
                        {t("admin.identityApprove")}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          const reason = window.prompt(t("admin.identityRejectPrompt"));
                          if (reason === null) return;
                          void reviewIdentity(row.id, "reject", reason);
                        }}
                        className="rounded-xl bg-rose-50 px-3 py-2 text-[13px] font-semibold text-rose-700"
                      >
                        {t("admin.identityReject")}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "bans" && (
        <>
          <form onSubmit={addBan} className="info-card space-y-4 p-5">
            <h2 className="text-[17px] font-semibold text-ink">{t("admin.addBan")}</h2>
            <label className="block">
              <span className="text-[15px] font-medium text-muted">{t("profile.phoneLabel")}</span>
              <input value={banPhone} onChange={(e) => setBanPhone(e.target.value)} className="input-field" />
            </label>
            <label className="block">
              <span className="text-[15px] font-medium text-muted">{t("admin.reasonLabel")}</span>
              <input
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder={t("admin.reasonPlaceholder")}
                className="input-field"
                maxLength={200}
              />
            </label>
            <button type="submit" disabled={busy || !isValidRuPhone(banPhone)} className="btn-gradient w-full disabled:opacity-50">
              {busy ? t("admin.saving") : t("admin.banButton")}
            </button>
          </form>

          <section className="info-card mt-4">
            <h2 className="px-4 pt-4 text-[17px] font-semibold text-ink">{t("admin.listTitle")}</h2>
            {bans.length === 0 ? (
              <p className="px-4 py-4 text-[14px] text-muted">{t("admin.empty")}</p>
            ) : (
              <ul className="mt-1 divide-y divide-line">
                {bans.map((ban) => (
                  <li key={ban.phone} className="flex items-start justify-between gap-3 px-4 py-3.5">
                    <div>
                      <p className="font-medium text-ink">{formatRuPhone(ban.phone)}</p>
                      {ban.reason && <p className="mt-1 text-[14px] text-muted">{ban.reason}</p>}
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeBan(ban.phone)}
                      className="rounded-xl bg-page px-3 py-2 text-[13px] font-semibold text-rose-700"
                    >
                      {t("admin.unbanButton")}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {tab === "users" && (
        <>
          <form onSubmit={lookupUser} className="info-card p-5">
            <h2 className="text-[17px] font-semibold text-ink">{t("admin.userLookupTitle")}</h2>
            <label className="mt-4 block">
              <span className="text-[15px] font-medium text-muted">{t("profile.phoneLabel")}</span>
              <input value={lookupPhone} onChange={(e) => setLookupPhone(e.target.value)} className="input-field" />
            </label>
            <button type="submit" disabled={busy || !isValidRuPhone(lookupPhone)} className="btn-gradient mt-4 w-full disabled:opacity-50">
              {t("admin.userLookupButton")}
            </button>
          </form>

          {userLookup && (
            <section className="info-card mt-4 p-5">
              <p className="text-[18px] font-bold text-ink">
                {userLookup.profile?.name?.trim() || t("profile.guest")}
              </p>
              <p className="mt-1 text-[15px] text-muted">{formatRuPhone(userLookup.phone)}</p>
              {userLookup.banned && (
                <p className="mt-2 text-[14px] font-semibold text-rose-600">{t("admin.userBanned")}</p>
              )}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-page px-3 py-2.5">
                  <p className="text-[13px] text-muted">{t("admin.userPosted")}</p>
                  <p className="text-[18px] font-bold text-ink">{userLookup.postedCount}</p>
                </div>
                <div className="rounded-xl bg-page px-3 py-2.5">
                  <p className="text-[13px] text-muted">{t("admin.userAccepted")}</p>
                  <p className="text-[18px] font-bold text-ink">{userLookup.acceptedCount}</p>
                </div>
              </div>
              {userLookup.profile?.bio && (
                <p className="mt-4 text-[14px] leading-relaxed text-ink">{userLookup.profile.bio}</p>
              )}
            </section>
          )}
        </>
      )}

      {tab === "moderators" && (
        <>
          {auth.session.canManageModerators ? (
            <form onSubmit={addModerator} className="info-card space-y-4 p-5">
              <h2 className="text-[17px] font-semibold text-ink">{t("admin.addModerator")}</h2>
              <label className="block">
                <span className="text-[15px] font-medium text-muted">{t("profile.phoneLabel")}</span>
                <input value={modPhone} onChange={(e) => setModPhone(e.target.value)} className="input-field" />
              </label>
              <label className="block">
                <span className="text-[15px] font-medium text-muted">{t("profile.nameLabel")}</span>
                <input value={modName} onChange={(e) => setModName(e.target.value)} className="input-field" />
              </label>
              <button type="submit" disabled={busy || !isValidRuPhone(modPhone)} className="btn-gradient w-full disabled:opacity-50">
                {t("admin.addModeratorButton")}
              </button>
            </form>
          ) : (
            <p className="info-card p-5 text-[14px] text-muted">{t("admin.moderatorsOwnerOnly")}</p>
          )}

          <section className="info-card mt-4">
            <h2 className="px-4 pt-4 text-[17px] font-semibold text-ink">{t("admin.moderatorsTitle")}</h2>
            {moderators.length === 0 ? (
              <p className="px-4 py-4 text-[14px] text-muted">{t("admin.moderatorsEmpty")}</p>
            ) : (
              <ul className="mt-1 divide-y divide-line">
                {moderators.map((row) => (
                  <li key={row.phone} className="flex items-start justify-between gap-3 px-4 py-3.5">
                    <div>
                      <p className="font-medium text-ink">{row.name?.trim() || formatRuPhone(row.phone)}</p>
                      <p className="mt-1 text-[14px] text-muted">{formatRuPhone(row.phone)}</p>
                    </div>
                    {auth.session?.canManageModerators && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => removeModerator(row.phone)}
                        className="rounded-xl bg-page px-3 py-2 text-[13px] font-semibold text-rose-700"
                      >
                        {t("admin.removeModerator")}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </AdminShell>
  );
}
