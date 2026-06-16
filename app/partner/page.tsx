"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PartnerTaskCard } from "@/components/partner/PartnerTaskCard";
import { getPartnerInvite, getPartnerName, partnerHeaders, setPartnerSession } from "@/lib/partner-session";
import type { Task } from "@/lib/types";
import { t } from "@/lib/i18n";

export default function PartnerDashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    const code = getPartnerInvite();
    if (!code) {
      router.replace("/partner/login");
      return;
    }

    setLoading(true);
    fetch("/api/partner/tasks", { headers: partnerHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (data.store?.name) {
          setStoreName(data.store.name);
          setPartnerSession(code, data.store.name, data.store.phone ?? "");
        }
        setTasks(data.tasks ?? []);
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const openCount = tasks.filter((t) => t.status === "OPEN").length;
  const activeCount = tasks.filter((t) => t.status === "ACCEPTED").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{storeName || t("partner.dashboard")}</h1>
          <p className="mt-1 text-[15px] text-muted">{t("partner.dashboardHint")}</p>
          {!loading && (
            <p className="mt-2 text-[13px] text-muted">
              {t("partner.summary", { open: openCount, active: activeCount })}
            </p>
          )}
        </div>
        <Link href="/partner/post" className="btn-soft !w-auto shrink-0 px-5">
          {t("partner.newShiftShort")}
        </Link>
      </div>

      {loading ? (
        <p className="text-muted">{t("profile.loadingTasks")}</p>
      ) : tasks.length === 0 ? (
        <div className="info-card px-4 py-8 text-center">
          <p className="text-[15px] text-muted">{t("partner.noShifts")}</p>
          <Link href="/partner/post" className="btn-gradient mt-4 inline-flex !w-auto px-6">
            {t("partner.publishShift")}
          </Link>
        </div>
      ) : (
        <ul className="task-grid">
          {tasks.map((task) => (
            <li key={task.id}>
              <PartnerTaskCard task={task} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
