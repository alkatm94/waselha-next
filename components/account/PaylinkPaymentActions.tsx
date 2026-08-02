"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PaylinkPaymentActions({ orderNumber, paymentStatus, paymentUrl }: { orderNumber: string; paymentStatus: string; paymentUrl?: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function request(path: string) {
    setBusy(true); setError("");
    try {
      const response = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ orderNumber }) });
      const body = await response.json() as { url?: string; error?: string };
      if (!response.ok) throw new Error(body.error || "تعذر إكمال العملية.");
      if (body.url) window.location.assign(body.url); else router.refresh();
    } catch (value) { setError(value instanceof Error ? value.message : "تعذر إكمال العملية."); setBusy(false); }
  }
  if (paymentStatus === "PAID") return <p className="rounded-lg bg-[var(--success-bg)] p-4 text-center text-sm font-bold text-[var(--success)]">تم الدفع بنجاح</p>;
  return <div className="grid gap-3">
    <button type="button" disabled={busy} onClick={() => request("/api/payments/paylink/create")} className="inline-flex h-12 items-center justify-center rounded-lg bg-[var(--brand-gold)] px-5 text-sm font-bold text-[var(--brand-navy)] disabled:cursor-wait disabled:opacity-60">{busy ? "جاري التحضير..." : paymentStatus === "PENDING" && paymentUrl ? "متابعة الدفع" : paymentStatus === "CANCELED" || paymentStatus === "EXPIRED" ? "إنشاء رابط دفع جديد" : "الدفع الآن"}</button>
    {paymentStatus === "PENDING" && <button type="button" disabled={busy} onClick={() => request("/api/payments/paylink/verify")} className="h-11 rounded-lg border border-[var(--border)] bg-white px-4 text-sm font-bold text-[var(--brand-navy)] disabled:opacity-60">التحقق من حالة الدفع</button>}
    {error && <p role="alert" className="text-sm font-bold text-[var(--danger)]">{error}</p>}
  </div>;
}
