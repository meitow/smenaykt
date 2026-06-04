"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserAvatar } from "@/components/UserAvatar";
import { getPartnerInvite, partnerHeaders } from "@/lib/partner-session";
import { t } from "@/lib/i18n";

type Contractor = {
  phone: string;
  name: string;
  avatarUrl: string | null;
  bio: string;
};

type PartnerShiftManageProps = {
  taskId: string;
  storePhone: string;
  onUpdated: () => void;
};

export function PartnerShiftManage({ taskId, storePhone, onUpdated }: PartnerShiftManageProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loadingContractors, setLoadingContractors] = useState(false);

  useEffect(() => {
    setLoadingContractors(true);
    const exclude = storePhone ? `?excludePhone=${encodeURIComponent(storePhone)}` : "";
    fetch(`/api/tasks/contractors${exclude}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { contractors?: Contractor[] } | null) => {
        setContractors(data?.contractors ?? []);
      })
      .catch(() => setContractors([]))
      .finally(() => setLoadingContractors(false));
  }, [storePhone]);

  async function deleteShift() {
    if (!window.confirm(t("task.deleteConfirm"))) return;

    const inviteCode = getPartnerInvite();
    if (!inviteCode) {
      router.replace("/partner/login");
      return;
    }

    setError("");
    setDeleting(true);

    try {
      const res = await fetch(`/api/partner/tasks/${taskId}`, {
        method: "DELETE",
        headers: partnerHeaders(),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Ошибка");
        return;
      }

      router.push("/partner");
      router.refresh();
    } catch {
      setError(t("partner.loadError"));
    } finally {
      setDeleting(false);
    }
  }

  async function assignContractor(workerPhone: string) {
    const inviteCode = getPartnerInvite();
    if (!inviteCode) {
      router.replace("/partner/login");
      return;
    }

    setError("");
    setAssigning(workerPhone);

    try {
      const res = await fetch(`/api/partner/tasks/${taskId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...partnerHeaders(),
        },
        body: JSON.stringify({ workerPhone }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Ошибка");
        return;
      }

      onUpdated();
    } catch {
      setError(t("partner.loadError"));
    } finally {
      setAssigning(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Link
          href={`/partner/tasks/${taskId}/edit`}
          className="btn-secondary flex-1 text-center !py-3"
        >
          {t("task.edit")}
        </Link>
        <button
          type="button"
          onClick={deleteShift}
          disabled={deleting}
          className="flex-1 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[15px] font-semibold text-rose-700 active:opacity-80 disabled:opacity-50"
        >
          {deleting ? t("task.deleting") : t("task.delete")}
        </button>
      </div>

      <section className="rounded-xl bg-page px-3 py-3">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-muted">
          {t("task.assignTestBadge")}
        </p>
        <p className="mt-1 text-[14px] text-muted">{t("partner.assignHint")}</p>
        {loadingContractors ? (
          <p className="mt-3 text-[14px] text-muted">{t("profile.loadingTasks")}</p>
        ) : contractors.length === 0 ? (
          <p className="mt-3 text-[14px] text-muted">{t("task.assignEmpty")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {contractors.map((contractor) => (
              <li key={contractor.phone}>
                <button
                  type="button"
                  onClick={() => assignContractor(contractor.phone)}
                  disabled={Boolean(assigning)}
                  className="flex w-full items-center gap-3 rounded-xl bg-surface px-3 py-2.5 text-left ring-1 ring-black/[0.04] active:opacity-90 disabled:opacity-50"
                >
                  <UserAvatar name={contractor.name} imageUrl={contractor.avatarUrl} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{contractor.name}</p>
                    {contractor.bio && (
                      <p className="truncate text-[13px] text-muted">{contractor.bio}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-[13px] font-semibold text-brand">
                    {assigning === contractor.phone ? t("task.assigning") : t("task.assign")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && <p className="text-[14px] text-rose-600">{error}</p>}
    </div>
  );
}
