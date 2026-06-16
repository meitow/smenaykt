"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getUserPhone } from "@/lib/user-session";

const SECRET_KEY = "smenaykt_admin_secret";

export type AdminSession = {
  phone: string | null;
  viaSecret: boolean;
  canManageModerators: boolean;
};

function readSecretFromUrl(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("secret")?.trim() ?? "";
}

function readPersistedSecret(): string {
  if (typeof window === "undefined") return "";
  const fromUrl = readSecretFromUrl();
  if (fromUrl) {
    sessionStorage.setItem(SECRET_KEY, fromUrl);
    return fromUrl;
  }
  return sessionStorage.getItem(SECRET_KEY)?.trim() ?? "";
}

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
  const [bootstrapped, setBootstrapped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refreshInFlight = useRef(false);

  useEffect(() => {
    const initial = readPersistedSecret();
    setStoredSecret(initial);
    setSecret(initial);
    setBootstrapped(true);
  }, []);

  const resolveSecret = useCallback(
    (override?: string) => (override ?? (storedSecret || readPersistedSecret())).trim(),
    [storedSecret]
  );

  const authHeaders = useCallback((): HeadersInit => {
    return sessionHeaders(resolveSecret(), getUserPhone());
  }, [resolveSecret]);

  const refreshSession = useCallback(
    async (options?: { showError?: boolean; secretOverride?: string }) => {
      if (refreshInFlight.current) return;
      refreshInFlight.current = true;
      setLoading(true);
      if (options?.showError) {
        setError("");
      }

      const activeSecret = resolveSecret(options?.secretOverride);
      const phone = getUserPhone();

      try {
        const res = await fetch("/api/admin/session", {
          headers: sessionHeaders(activeSecret, phone),
        });
        const data = (await res.json()) as AdminSession & { error?: string };

        if (!res.ok) {
          setSession(null);
          if (options?.showError) {
            sessionStorage.removeItem(SECRET_KEY);
            setStoredSecret("");
            setError(data.error ?? "Неверный ключ доступа");
          } else {
            setError("");
          }
          return;
        }

        if (activeSecret) {
          sessionStorage.setItem(SECRET_KEY, activeSecret);
          setStoredSecret(activeSecret);
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
        refreshInFlight.current = false;
        setLoading(false);
      }
    },
    [resolveSecret]
  );

  useEffect(() => {
    if (!bootstrapped) return;
    void refreshSession();
    // Only auto-check once after reading URL / sessionStorage secret.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapped]);

  async function unlockWithSecret() {
    const trimmed = secret.trim();
    if (!trimmed) return;
    await refreshSession({ showError: true, secretOverride: trimmed });
  }

  function lockSecret() {
    sessionStorage.removeItem(SECRET_KEY);
    setStoredSecret("");
    setSecret("");
    setError("");
    setSession(null);
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
