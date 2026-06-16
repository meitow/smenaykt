"use client";

import { useCallback, useEffect, useState } from "react";
import { getUserPhone } from "@/lib/user-session";

const SECRET_KEY = "smenaykt_admin_secret";

export type AdminSession = {
  phone: string | null;
  viaSecret: boolean;
  canManageModerators: boolean;
};

export function useAdminAuth() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [secret, setSecret] = useState("");
  const [storedSecret, setStoredSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem(SECRET_KEY)?.trim() ?? "";
    if (saved) {
      setStoredSecret(saved);
      setSecret(saved);
    }
  }, []);

  const authHeaders = useCallback((): HeadersInit => {
    const phone = getUserPhone();
    const activeSecret = storedSecret.trim();
    return {
      "Content-Type": "application/json",
      ...(phone ? { "x-moderator-phone": phone } : {}),
      ...(activeSecret ? { "x-admin-secret": activeSecret } : {}),
    };
  }, [storedSecret]);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/session", { headers: authHeaders() });
      const data = (await res.json()) as AdminSession & { error?: string };

      if (!res.ok) {
        setSession(null);
        setError(data.error ?? "Нет доступа");
        return;
      }

      setSession({
        phone: data.phone,
        viaSecret: data.viaSecret,
        canManageModerators: data.canManageModerators,
      });
      setError("");
    } catch {
      setSession(null);
      setError("Не удалось проверить доступ");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  function unlockWithSecret() {
    const trimmed = secret.trim();
    if (!trimmed) return;
    sessionStorage.setItem(SECRET_KEY, trimmed);
    setStoredSecret(trimmed);
    setError("");
  }

  function lockSecret() {
    sessionStorage.removeItem(SECRET_KEY);
    setStoredSecret("");
    setSecret("");
    void refreshSession();
  }

  return {
    session,
    loading,
    error,
    secret,
    setSecret,
    storedSecret,
    unlockWithSecret,
    lockSecret,
    authHeaders,
    refreshSession,
    sessionPhone: getUserPhone(),
  };
}
