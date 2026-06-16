"use client";

import { useCallback, useEffect, useState } from "react";
import { getUserPhone } from "@/lib/user-session";

const SECRET_KEY = "smenaykt_admin_secret";

export type AdminSession = {
  phone: string | null;
  viaSecret: boolean;
  canManageModerators: boolean;
};

function sessionHeaders(secret: string, phone: string | null): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(phone ? { "x-moderator-phone": phone } : {}),
    ...(secret ? { "x-admin-secret": secret } : {}),
  };
}

export function useAdminAuth() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [secret, setSecret] = useState("");
  const [storedSecret, setStoredSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem(SECRET_KEY)?.trim() ?? "";
    const fromUrl =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("secret")?.trim() ?? ""
        : "";
    const initial = saved || fromUrl;
    if (fromUrl) {
      sessionStorage.setItem(SECRET_KEY, fromUrl);
    }
    if (initial) {
      setStoredSecret(initial);
      setSecret(initial);
    }
  }, []);

  const authHeaders = useCallback((): HeadersInit => {
    const phone = getUserPhone();
    return sessionHeaders(storedSecret.trim(), phone);
  }, [storedSecret]);

  const refreshSession = useCallback(
    async (options?: { showError?: boolean; secretOverride?: string }) => {
      setLoading(true);
      if (options?.showError) {
        setError("");
      }

      const activeSecret = (options?.secretOverride ?? storedSecret).trim();
      const phone = getUserPhone();

      try {
        const res = await fetch("/api/admin/session", {
          headers: sessionHeaders(activeSecret, phone),
        });
        const data = (await res.json()) as AdminSession & { error?: string };

        if (!res.ok) {
          setSession(null);
          if (activeSecret) {
            sessionStorage.removeItem(SECRET_KEY);
            setStoredSecret("");
          }
          if (options?.showError || activeSecret) {
            setError(data.error ?? "Неверный ключ доступа");
          } else {
            setError("");
          }
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
        if (options?.showError) {
          setError("Не удалось проверить доступ");
        }
      } finally {
        setLoading(false);
      }
    },
    [storedSecret]
  );

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  async function unlockWithSecret() {
    const trimmed = secret.trim();
    if (!trimmed) return;
    sessionStorage.setItem(SECRET_KEY, trimmed);
    setStoredSecret(trimmed);
    await refreshSession({ showError: true, secretOverride: trimmed });
  }

  function lockSecret() {
    sessionStorage.removeItem(SECRET_KEY);
    setStoredSecret("");
    setSecret("");
    setError("");
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
