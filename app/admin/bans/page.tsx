"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatRuPhone, isValidRuPhone } from "@/lib/phone";
import { t } from "@/lib/i18n";

const SECRET_KEY = "smenaykt_admin_secret";

type BanRow = {
  phone: string;
  reason: string;
  bannedBy: string;
  createdAt: string;
};

function authHeaders(secret: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-admin-secret": secret,
  };
}

export default function AdminBansPage() {
  const [secret, setSecret] = useState("");
  const [storedSecret, setStoredSecret] = useState("");
  const [bans, setBans] = useState<BanRow[]>([]);
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem(SECRET_KEY)?.trim() ?? "";
    if (saved) {
      setStoredSecret(saved);
      setSecret(saved);
    }
  }, []);

  const loadBans = useCallback(async (adminSecret: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/bans", { headers: authHeaders(adminSecret) });
      const data = (await res.json()) as { bans?: BanRow[]; error?: string };

      if (!res.ok) {
        setError(data.error ?? t("admin.loadError"));
        setBans([]);
        return;
      }

      setBans(data.bans ?? []);
    } catch {
      setError(t("admin.loadError"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (storedSecret) {
      loadBans(storedSecret);
    }
  }, [storedSecret, loadBans]);

  function unlock() {
    const trimmed = secret.trim();
    if (!trimmed) return;
    sessionStorage.setItem(SECRET_KEY, trimmed);
    setStoredSecret(trimmed);
    setError("");
  }

  function lock() {
    sessionStorage.removeItem(SECRET_KEY);
    setStoredSecret("");
    setSecret("");
    setBans([]);
  }

  async function addBan(event: React.FormEvent) {
    event.preventDefault();
    if (!storedSecret || !isValidRuPhone(phone)) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/bans", {
        method: "POST",
        headers: authHeaders(storedSecret),
        body: JSON.stringify({ phone, reason, bannedBy: "admin" }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? t("admin.saveError"));
        return;
      }

      setPhone("");
      setReason("");
      await loadBans(storedSecret);
    } catch {
      setError(t("admin.saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function removeBan(targetPhone: string) {
    if (!storedSecret) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/bans", {
        method: "DELETE",
        headers: authHeaders(storedSecret),
        body: JSON.stringify({ phone: targetPhone }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? t("admin.saveError"));
        return;
      }

      await loadBans(storedSecret);
    } catch {
      setError(t("admin.saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{t("admin.bansTitle")}</h1>
          <p className="mt-1 text-[15px] text-muted">{t("admin.bansHint")}</p>
        </div>
        <Link href="/" className="shrink-0 text-[15px] font-medium text-brand">
          {t("admin.backToApp")}
        </Link>
      </div>

      {!storedSecret ? (
        <section className="info-card mt-6 p-5">
          <label className="block">
            <span className="text-[15px] font-medium text-muted">{t("admin.secretLabel")}</span>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="input-field"
              autoComplete="off"
            />
          </label>
          <p className="mt-2 text-[13px] text-muted">{t("admin.secretHint")}</p>
          <button type="button" onClick={unlock} className="btn-gradient mt-4 w-full">
            {t("admin.unlock")}
          </button>
        </section>
      ) : (
        <>
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={lock} className="text-[14px] font-medium text-muted">
              {t("admin.lock")}
            </button>
          </div>

          <form onSubmit={addBan} className="info-card mt-4 space-y-4 p-5">
            <h2 className="text-[17px] font-semibold text-ink">{t("admin.addBan")}</h2>
            <label className="block">
              <span className="text-[15px] font-medium text-muted">{t("profile.phoneLabel")}</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 999 123-45-67"
                className="input-field"
              />
            </label>
            <label className="block">
              <span className="text-[15px] font-medium text-muted">{t("admin.reasonLabel")}</span>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("admin.reasonPlaceholder")}
                className="input-field"
                maxLength={200}
              />
            </label>
            <button
              type="submit"
              disabled={saving || !isValidRuPhone(phone)}
              className="btn-gradient w-full disabled:opacity-50"
            >
              {saving ? t("admin.saving") : t("admin.banButton")}
            </button>
          </form>

          <section className="info-card mt-4">
            <h2 className="px-4 pt-4 text-[17px] font-semibold text-ink">{t("admin.listTitle")}</h2>
            {loading ? (
              <p className="px-4 py-4 text-[14px] text-muted">{t("profile.loadingTasks")}</p>
            ) : bans.length === 0 ? (
              <p className="px-4 py-4 text-[14px] text-muted">{t("admin.empty")}</p>
            ) : (
              <ul className="mt-1 divide-y divide-line">
                {bans.map((ban) => (
                  <li key={ban.phone} className="flex items-start justify-between gap-3 px-4 py-3.5">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{formatRuPhone(ban.phone)}</p>
                      {ban.reason && <p className="mt-1 text-[14px] text-muted">{ban.reason}</p>}
                    </div>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => removeBan(ban.phone)}
                      className="shrink-0 rounded-xl bg-page px-3 py-2 text-[13px] font-semibold text-rose-700 active:opacity-80 disabled:opacity-50"
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

      {error && <p className="mt-4 text-center text-[14px] text-rose-600">{error}</p>}
    </div>
  );
}
