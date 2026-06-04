"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setPartnerSession } from "@/lib/partner-session";

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
      body: JSON.stringify({ inviteCode: code }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Ошибка");
      return;
    }

    setPartnerSession(data.store.inviteCode, data.store.name, data.store.phone ?? "");
    router.push("/partner");
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="section-title">Вход для партнёров</h1>
        <p className="mt-2 text-[15px] text-muted">
          Код выдаётся при подключении предприятия. Демо: <strong>YKT-DEMO-1</strong>
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 rounded-3xl bg-white p-5 shadow-card">
        <label className="block">
          <span className="text-sm font-medium text-muted">Код партнёра</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            placeholder="YKT-DEMO-1"
            className="mt-1 w-full rounded-2xl border border-black/10 px-4 py-3 text-base uppercase"
          />
        </label>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-soft">
          {loading ? "…" : "Войти"}
        </button>
      </form>
    </div>
  );
}
