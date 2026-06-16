"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getUserPhone } from "@/lib/user-session";

const SECRET_KEY = "smenaykt_admin_secret";
const DISMISSED_KEY = "smenaykt_admin_dismissed";

export type AdminSession = {
  phone: string | null;
  viaSecret: boolean;
  canManageModerators: boolean;
};

function readSecretFromUrl(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("secret")?.trim() ?? "";
}

function stripSecretFromUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has("secret")) return;
  url.searchParams.delete("secret");
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, "", next);
}

function isPanelDismissed() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(DISMISSED_KEY) === "1";
}

function readPersistedSecret(): string {
  if (typeof window === "undefined") return "";
  if (isPanelDismissed()) {
    return "";
  }
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
    if (isPanelDismissed()) {
      setBootstrapped(true);
      setLoading(false);
      return;
    }
    const initial = readPersistedSecret();
    setStoredSecret(initial);
    setSecret(initial);
    setBootstrapped(true);
  }, []);

  const resolveSecret = useCallback(
    (override?: string) => {
      if (override) return override.trim();
      if (isPanelDismissed()) return "";
      return (storedSecret || readPersistedSecret()).trim();
    },
    [storedSecret]
  );

  const authHeaders = useCallback((): HeadersInit => {
    return sessionHeaders(resolveSecret(), getUserPhone());
  }, [resolveSecret]);

  const refreshSession = useCallback(
    async (options?: { showError?: boolean; secretOverride?: string; force?: boolean }) => {
      if (refreshInFlight.current) return;

      if (!options?.force && isPanelDismissed() && !options?.secretOverride) {
        setSession(null);
        setLoading(false);
        return;
      }

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

        sessionStorage.removeItem(DISMISSED_KEY);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapped]);

  async function unlockWithSecret() {
    const trimmed = secret.trim();
    if (!trimmed) return;
    sessionStorage.removeItem(DISMISSED_KEY);
    await refreshSession({ showError: true, secretOverride: trimmed, force: true });
  }

  function lockSecret() {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    sessionStorage.removeItem(SECRET_KEY);
    stripSecretFromUrl();
    setStoredSecret("");
    setSecret("");
    setError("");
    setSession(null);
    setLoading(false);
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
