"use client";

import { useMemo, useState } from "react";
import { Check, Copy, TriangleAlert } from "lucide-react";

type AddressField = { label: string; value: string; dir?: "ltr" | "rtl" };
type CopyState = "idle" | "success" | "error";

function fallbackCopyText(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.insetInlineStart = "0";
  textarea.style.top = "0";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

async function copyText(value: string) {
  if (typeof window === "undefined" || typeof document === "undefined") return false;

  try {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch {
        return fallbackCopyText(value);
      }
    }

    return fallbackCopyText(value);
  } catch {
    return false;
  }
}

export function CopyButton({ value, label = "نسخ", primary = false }: { value: string; copyKey?: string; label?: string; primary?: boolean }) {
  const [copyState, setCopyState] = useState<CopyState>("idle");

  async function copyValue() {
    const copied = await copyText(value);
    setCopyState(copied ? "success" : "error");
    window.setTimeout(() => setCopyState("idle"), 2200);
  }

  const isSuccess = copyState === "success";
  const isError = copyState === "error";
  const message = isSuccess ? "تم النسخ" : isError ? "تعذر النسخ" : label;

  return (
    <>
      <button
        type="button"
        onClick={copyValue}
        aria-live="polite"
        title={isError ? "تعذر النسخ تلقائيًا. انسخ النص يدويًا." : label}
        className={primary
          ? `inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold ${isError ? "bg-[var(--danger-bg)] text-[var(--danger)]" : "bg-[var(--brand-gold)] text-[var(--brand-navy)]"}`
          : `inline-flex h-10 min-h-10 w-fit items-center justify-center gap-2 rounded-lg border px-3 text-sm font-bold transition ${isError ? "border-[var(--danger-bg)] bg-[var(--danger-bg)] text-[var(--danger)]" : "border-[var(--border)] bg-white text-[var(--brand-navy)] hover:border-[var(--brand-gold)]"}`}
      >
        {isSuccess ? <Check className="h-4 w-4" /> : isError ? <TriangleAlert className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {message}
      </button>
      {copyState !== "idle" && (
        <div className={`fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-3 text-sm font-bold shadow-xl lg:bottom-6 ${isSuccess ? "bg-[var(--success)] text-white" : "bg-[var(--danger)] text-white"}`}>
          {isSuccess ? "تم نسخ النص بنجاح" : "تعذر النسخ، يمكنك تحديد النص ونسخه يدويًا"}
        </div>
      )}
    </>
  );
}

export function CustomerIdCard({ customerId }: { customerId: string }) {
  return (
    <section className="rounded-lg bg-[var(--brand-navy)] p-4 text-white shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white/70">رقم العميل Customer ID</p>
          <p className="mt-2 text-[24px] font-bold sm:text-[34px] tracking-normal text-[var(--brand-gold)] latin-text" dir="ltr">{customerId}</p>
          <p className="mt-2 text-[15px] font-medium leading-7 text-white/75">استخدم هذا الرقم داخل اسم المستلم حتى يتعرف المستودع على شحنتك بسرعة.</p>
        </div>
        <CopyButton value={customerId} label="نسخ Customer ID" primary />
      </div>
    </section>
  );
}

export function ChinaAddressCard({ fields, fullAddress }: { fields: AddressField[]; fullAddress: string }) {
  const fullText = useMemo(() => fullAddress, [fullAddress]);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-white shadow-sm">
      <div className="border-b border-[var(--border)] p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-[var(--brand-gold-dark)]">بيانات المستودع</p>
            <h2 className="mt-1 text-xl font-bold text-[var(--brand-navy)] sm:text-2xl">عنوانك في الصين</h2>
          </div>
          <CopyButton value={fullText} label="نسخ العنوان بالكامل" primary />
        </div>
      </div>
      <div className="grid gap-3 p-3 sm:p-5 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 sm:p-4">
            <div className="mb-3 grid gap-2">
              <p className="text-[13px] font-bold text-[var(--text-secondary)]">{field.label}</p>
              <CopyButton value={field.value} />
            </div>
            <p className="min-w-0 overflow-wrap-anywhere break-words text-[15px] font-semibold leading-7 text-[var(--text-primary)] latin-text" dir={field.dir || "ltr"}>{field.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

