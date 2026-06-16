"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { isValidRuPhone, normalizeRuPhone } from "@/lib/phone";
import { getUserPhone } from "@/lib/user-session";

const SECRET_KEY = "smenaykt_admin_secret";
const DISMISSED_KEY = "smenaykt_admin_dismissed";
const OWNER_MODE_KEY = "smenaykt_admin_owner";

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

function stripEntryParamsFromUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  let changed = false;
  for (const key of ["from", "phone"]) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (!changed) return;
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, "", next);
}

function isPanelDismissed() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(DISMISSED_KEY) === "1";
}

function isOwnerMode() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(OWNER_MODE_KEY) === "1";
}

function readPersistedSecretForForm(): string {
  if (typeof window === "undefined" || isPanelDismissed()) return "";
  return sessionStorage.getItem(SECRET_KEY)?.trim() ?? "";
}

function resolveSecretForAuth(override?: string): string {
  if (override) return override.trim();
  if (isPanelDismissed()) return "";

  const fromUrl = readSecretFromUrl();
  if (fromUrl) return fromUrl;

  if (isOwnerMode()) {
    return sessionStorage.getItem(SECRET_KEY)?.trim() ?? "";
  }

  return "";
}

function resolveModeratorPhone(searchParams: URLSearchParams | null): string {
  const fromUrl = searchParams?.get("phone")?.trim() ?? "";
  const normalizedFromUrl = normalizeRuPhone(fromUrl);
  if (normalizedFromUrl && isValidRuPhone(normalizedFromUrl)) {
    return normalizedFromUrl;
  }

  const fromSession = normalizeRuPhone(getUserPhone());
  if (fromSession && isValidRuPhone(fromSession)) {
    return fromSession;
  }

  return "";
}

function sessionHeaders(secret: string, phone: string | null): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(phone ? { "x-moderator-phone": phone } : {}),
    ...(secret ? { "x-admin-secret": secret } : {}),
  };
}

function sessionUrl(phone: string | null): string {
  if (!phone) return "/api/admin/session";
  return `/api/admin/session?phone=${encodeURIComponent(phone)}`;
}

function clearOwnerCredentials() {
  sessionStorage.removeItem(OWNER_MODE_KEY);
  sessionStorage.removeItem(SECRET_KEY);
  stripSecretFromUrl();
}

export function useAdminAuth() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [secret, setSecret] = useState("");
  const [storedSecret, setStoredSecret] = useState("");
  const [sessionPhone, setSessionPhone] = useState("");
  const [bootstrapped, setBootstrapped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refreshInFlight = useRef(false);

  useEffect(() => {
    if (searchParams.get("from") === "profile") {
      sessionStorage.removeItem(DISMISSED_KEY);
    }

    if (isPanelDismissed()) {
      setBootstrapped(true);
      return;
    }

    const fromUrl = readSecretFromUrl();
    const initial = fromUrl || readPersistedSecretForForm();
    setStoredSecret(initial);
    setSecret(initial);
    setBootstrapped(true);
  }, [searchParams]);

  const authHeaders = useCallback((): HeadersInit => {
    const phone = resolveModeratorPhone(searchParams);
    return sessionHeaders(resolveSecretForAuth(), phone || null);
  }, [searchParams, session?.canManageModerators, storedSecret]);

  const refreshSession = useCallback(
    async (options?: { showError?: boolean; secretOverride?: string; force?: boolean }) => {
      if (refreshInFlight.current) return;

      refreshInFlight.current = true;
      setLoading(true);
      if (options?.showError) {
        setError("");
      }

      const activeSecret = resolveSecretForAuth(options?.secretOverride);
      const phone = resolveModeratorPhone(searchParams);
      setSessionPhone(phone);

      try {
        const res = await fetch(sessionUrl(phone || null), {
          headers: sessionHeaders(activeSecret, phone || null),
        });
        const data = (await res.json()) as AdminSession & { error?: string };

        if (!res.ok) {
          setSession(null);
          if (options?.showError) {
            clearOwnerCredentials();
            setStoredSecret("");
            setError(data.error ?? "Неверный ключ доступа");
          } else {
            setError("");
          }
          return;
        }

        sessionStorage.removeItem(DISMISSED_KEY);
        stripEntryParamsFromUrl();

        if (data.viaSecret) {
          sessionStorage.setItem(OWNER_MODE_KEY, "1");
          if (activeSecret) {
            sessionStorage.setItem(SECRET_KEY, activeSecret);
            setStoredSecret(activeSecret);
          }
        } else {
          clearOwnerCredentials();
          setStoredSecret("");
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
    [searchParams]
  );

  useEffect(() => {
    if (!bootstrapped || pathname !== "/admin") return;
    void refreshSession({ force: true });
  }, [bootstrapped, pathname, searchParams, refreshSession]);

  async function unlockWithSecret() {
    const trimmed = secret.trim();
    if (!trimmed) return;
    sessionStorage.removeItem(DISMISSED_KEY);
    await refreshSession({ showError: true, secretOverride: trimmed, force: true });
  }

  async function unlockWithPhone() {
    const phone = resolveModeratorPhone(searchParams);
    if (!phone) {
      setError("Укажите телефон в профиле");
      return;
    }
    sessionStorage.removeItem(DISMISSED_KEY);
    await refreshSession({ force: true, showError: true });
  }

  function lockSecret() {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    clearOwnerCredentials();
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
    unlockWithPhone,
    lockSecret,
    authHeaders,
    refreshSession,
    sessionPhone,
  };
}
