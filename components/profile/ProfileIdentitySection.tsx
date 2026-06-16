"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { IdentityPublicStatus } from "@/lib/identity-documents";
import { legalDocPath } from "@/lib/legal";
import { isValidRuPhone } from "@/lib/phone";
import { t } from "@/lib/i18n";

type IdentityStatusResponse = {
  status: IdentityPublicStatus;
  rejectReason?: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
};

type ProfileIdentitySectionProps = {
  phone: string;
};

function statusBadgeClass(status: IdentityPublicStatus) {
  if (status === "approved") return "bg-taiga/15 text-taiga";
  if (status === "pending") return "bg-brand-light text-brand-dark";
  if (status === "rejected") return "bg-rose-50 text-rose-700";
  return "bg-page text-muted";
}

export function ProfileIdentitySection({ phone }: ProfileIdentitySectionProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<IdentityStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canUse = isValidRuPhone(phone);

  const load = useCallback(async () => {
    if (!canUse) {
      setStatus({ status: "none" });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/profile/identity", {
        headers: { "x-user-phone": phone },
      });
      const data = (await res.json()) as IdentityStatusResponse & { error?: string };
      if (!res.ok) {
        setError(data.error ?? t("identity.loadError"));
        setStatus({ status: "none" });
        return;
      }
      setStatus(data);
      setError("");
    } catch {
      setError(t("identity.loadError"));
      setStatus({ status: "none" });
    } finally {
      setLoading(false);
    }
  }, [canUse, phone]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canUse || uploading) return;

    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError(t("identity.fileRequired"));
      return;
    }

    if (!consent) {
      setError(t("identity.consentRequired"));
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.set("phone", phone);
      formData.set("consent", "true");
      formData.set("file", file);

      const res = await fetch("/api/profile/identity", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as IdentityStatusResponse & { error?: string };

      if (!res.ok) {
        setError(data.error ?? t("identity.uploadError"));
        return;
      }

      setStatus(data);
      setSuccess(t("identity.uploadSuccess"));
      setConsent(false);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setError(t("identity.uploadError"));
    } finally {
      setUploading(false);
    }
  }

  const currentStatus = status?.status ?? "none";
  const canUpload = canUse && (currentStatus === "none" || currentStatus === "rejected");

  return (
    <div className="mt-5 rounded-xl bg-page px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-semibold text-ink">{t("profile.documentsTitle")}</p>
          <p className="mt-1 text-[14px] leading-snug text-muted">{t("identity.sectionHint")}</p>
        </div>
        {!loading && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold ${statusBadgeClass(currentStatus)}`}
          >
            {t(`identity.status.${currentStatus}`)}
          </span>
        )}
      </div>

      {loading ? (
        <p className="mt-3 text-[14px] text-muted">{t("profile.loadingTasks")}</p>
      ) : !canUse ? (
        <p className="mt-3 text-[14px] text-muted">{t("identity.needPhone")}</p>
      ) : (
        <>
          {currentStatus === "pending" && (
            <p className="mt-3 text-[14px] text-muted">{t("identity.pendingHint")}</p>
          )}

          {currentStatus === "approved" && (
            <p className="mt-3 text-[14px] text-muted">{t("identity.approvedHint")}</p>
          )}

          {currentStatus === "rejected" && status?.rejectReason && (
            <p className="mt-3 text-[14px] text-rose-600">
              {t("identity.rejectedReason", { reason: status.rejectReason })}
            </p>
          )}

          {canUpload && (
            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <label className="block">
                <span className="text-[14px] font-medium text-ink">{t("identity.fileLabel")}</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="mt-1.5 block w-full text-[14px] text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-surface file:px-3 file:py-2 file:text-[14px] file:font-medium file:text-ink"
                />
                <span className="mt-1 block text-[13px] text-muted">{t("identity.fileHint")}</span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-surface px-3 py-3 ring-1 ring-black/[0.04]">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-line accent-brand"
                />
                <span className="text-[14px] leading-snug text-ink">
                  {t("identity.consentPrefix")}{" "}
                  <Link
                    href={legalDocPath("privacy")}
                    className="font-semibold text-brand underline underline-offset-2"
                  >
                    {t("legal.privacyTitle")}
                  </Link>{" "}
                  {t("identity.consentSuffix")}
                </span>
              </label>

              {error && <p className="text-[14px] text-rose-600">{error}</p>}
              {success && <p className="text-[14px] text-taiga">{success}</p>}

              <button type="submit" disabled={uploading} className="btn-soft disabled:opacity-50">
                {uploading ? t("identity.uploading") : t("identity.submit")}
              </button>
            </form>
          )}

          {error && !canUpload && <p className="mt-3 text-[14px] text-rose-600">{error}</p>}
        </>
      )}
    </div>
  );
}
