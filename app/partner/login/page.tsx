"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setPartnerSession } from "@/lib/partner-session";
import { t } from "@/lib/i18n";

export default function PartnerLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/partner/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: code.trim() }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Ошибка");
      return;
    }

    setPartnerSession({
      storeId: data.store.id,
      accessToken: data.store.accessToken,
      storeName: data.store.name,
      storePhone: data.store.phone ?? "",
    });
    router.push("/partner");
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="section-title">{t("partner.loginTitle")}</h1>
        <p className="mt-2 text-[15px] text-muted">{t("partner.loginHint")}</p>
        <p className="mt-2 text-[13px] text-muted">
          {t("partner.loginDemo")} <strong className="font-mono">yktDemoPartner0000001</strong>
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 rounded-3xl bg-white p-5 shadow-card">
        <label className="block">
          <span className="text-sm font-medium text-muted">{t("partner.accessTokenLabel")}</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            placeholder="yktDemoPartner0000001"
            className="mt-1 w-full rounded-2xl border border-black/10 px-4 py-3 font-mono text-[15px]"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-soft">
          {loading ? "…" : t("partner.loginButton")}
        </button>
      </form>
    </div>
  );
}
