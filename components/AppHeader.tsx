"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/UserAvatar";
import { formatProfileHeaderSubtitle } from "@/lib/profile-header";
import { isValidRuPhone, normalizeRuPhone } from "@/lib/phone";
import type { ProfileSummary } from "@/lib/types";
import { getUserDisplayName, getUserAvatarUrl, getUserPhone } from "@/lib/user-session";
import { t } from "@/lib/i18n";

function resolveDisplayName(localName: string, serverName?: string): string {
  const fromServer = serverName?.trim();
  if (fromServer) return fromServer;
  const fromLocal = localName.trim();
  if (fromLocal && fromLocal !== "Гость") return fromLocal;
  return t("home.headerGuestName");
}

export function AppHeader() {
  const [displayName, setDisplayName] = useState(() => t("home.headerGuestName"));
  const [subtitle, setSubtitle] = useState(() => t("home.headerGuestHint"));
  const [avatarUrl, setAvatarUrl] = useState("");

  const refreshSummary = useCallback(async () => {
    const localName = getUserDisplayName();
    const localAvatar = getUserAvatarUrl();
    setAvatarUrl(localAvatar);

    const phone = normalizeRuPhone(getUserPhone());
    if (!phone || !isValidRuPhone(phone)) {
      setDisplayName(resolveDisplayName(localName));
      setSubtitle(t("home.headerGuestHint"));
      return;
    }

    try {
      const res = await fetch(`/api/profile?phone=${encodeURIComponent(phone)}&summary=1`);
      if (!res.ok) {
        setDisplayName(resolveDisplayName(localName));
        setSubtitle(t("home.headerGuestHint"));
        return;
      }

      const data = (await res.json()) as ProfileSummary;
      setDisplayName(resolveDisplayName(localName, data.name));
      if (data.avatarUrl) {
        setAvatarUrl(data.avatarUrl);
      }
      setSubtitle(formatProfileHeaderSubtitle(data.stats));
    } catch {
      setDisplayName(resolveDisplayName(localName));
      setSubtitle(t("home.headerGuestHint"));
    }
  }, []);

  useEffect(() => {
    void refreshSummary();
    const onUserUpdated = () => void refreshSummary();
    window.addEventListener("smenaykt_user_updated", onUserUpdated);
    window.addEventListener("storage", onUserUpdated);
    return () => {
      window.removeEventListener("smenaykt_user_updated", onUserUpdated);
      window.removeEventListener("storage", onUserUpdated);
    };
  }, [refreshSummary]);

  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-surface/90 backdrop-blur-md">
      <div className="h-0.5 w-full bg-brand-gradient" aria-hidden />
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-2.5">
        <Link href="/profile" className="flex min-w-0 flex-1 items-center gap-3 active:opacity-90">
          <UserAvatar name={displayName} imageUrl={avatarUrl || null} size={40} />
          <div className="min-w-0">
            <p className="truncate text-[17px] font-bold text-ink">{displayName}</p>
            <p className="truncate text-[13px] text-muted">{subtitle}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
