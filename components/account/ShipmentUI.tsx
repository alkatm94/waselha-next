import Link from "next/link";
import { ExternalLink, ImageIcon, Package } from "lucide-react";
import { getShipmentStatusLabel, SHIPMENT_STATUSES } from "@/lib/shipments";

export const terminalStatuses = new Set(["DELIVERED"]);
export const arrivedStatuses = new Set(["ARRIVED_WAREHOUSE", "INSPECTING", "WEIGHED", "AWAITING_SHIPPING_PAYMENT", "READY_TO_SHIP", "SHIPPED", "DELIVERED"]);
export const actionStatuses = new Set(["AWAITING_SHIPPING_PAYMENT"]);

export function statusTone(status: string) {
  const tones: Record<string, string> = {
    REGISTERED: "bg-[var(--info-bg)] text-[var(--info)] border-[var(--info-bg)]",
    AWAITING_WAREHOUSE: "bg-orange-50 text-orange-700 border-orange-100",
    ARRIVED_WAREHOUSE: "bg-[var(--info-bg)] text-[var(--info)] border-[var(--info-bg)]",
    INSPECTING: "bg-violet-50 text-violet-700 border-violet-100",
    WEIGHED: "bg-sky-50 text-sky-800 border-sky-100",
    AWAITING_SHIPPING_PAYMENT: "bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning-bg)]",
    READY_TO_SHIP: "bg-teal-50 text-teal-700 border-teal-100",
    SHIPPED: "bg-blue-50 text-blue-700 border-blue-100",
    DELIVERED: "bg-[var(--success-bg)] text-[var(--success)] border-[var(--success-bg)]",
  };
  return tones[status] || "bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border)]";
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-bold ${statusTone(status)}`}>{getShipmentStatusLabel(status)}</span>;
}

export function ProductImagePlaceholder({ label = "صورة المنتج" }: { label?: string }) {
  return (
    <div className="grid aspect-square min-h-24 place-items-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-secondary)]">
      <div className="grid place-items-center gap-2 text-center">
        <ImageIcon className="h-7 w-7" />
        <span className="text-xs font-bold">{label}</span>
      </div>
    </div>
  );
}

export function cleanProductTitle(title: string, max = 90) {
  const normalized = title.replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max).trim()}...` : normalized;
}

export function productDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "رابط المنتج";
  }
}

export function ProductLinkButton({ url }: { url: string }) {
  return (
    <Link href={url} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 text-sm font-bold text-[var(--brand-navy)] transition hover:border-[var(--brand-gold)]">
      <ExternalLink className="h-4 w-4" />فتح المنتج
    </Link>
  );
}

export function ShipmentStepper({ currentStatus }: { currentStatus: string }) {
  const steps = SHIPMENT_STATUSES.filter((status) => status.value !== "READY_TO_SHIP");
  const currentIndex = Math.max(0, steps.findIndex((step) => step.value === currentStatus));

  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-4 sm:p-5">
      <h2 className="text-xl font-bold text-[var(--brand-navy)]">مسار الشحنة</h2>
      <div className="mt-5 grid gap-3 lg:grid-cols-8 lg:gap-2">
        {steps.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div key={step.value} className="relative flex gap-3 lg:block">
              <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-bold ${isDone ? "border-[var(--success)] bg-[var(--success)] text-white" : isCurrent ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[var(--brand-navy)]" : "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-secondary)]"}`}>{index + 1}</div>
              <p className={`text-sm font-bold leading-6 lg:mt-3 ${isCurrent ? "text-[var(--brand-navy)]" : "text-[var(--text-secondary)]"}`}>{step.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EmptyShipments() {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-8 text-center shadow-sm">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--info-bg)] text-[var(--info)]"><Package className="h-8 w-8" /></div>
      <h2 className="mt-4 text-2xl font-bold text-[var(--brand-navy)]">لا توجد شحنات بعد</h2>
      <p className="mx-auto mt-2 max-w-lg text-[15px] font-medium leading-7 text-[var(--text-secondary)]">بعد شراء المنتج وشحنه إلى عنوانك في الصين، سجّل رقم التتبع حتى نتابع وصوله للمستودع.</p>
      <Link href="/account/china-address/shipments/new" className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-[var(--brand-gold)] px-5 text-sm font-bold text-[var(--brand-navy)]">تسجيل شحنة قادمة</Link>
    </div>
  );
}
