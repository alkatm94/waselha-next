import Link from "next/link";
import { Search, ShieldCheck, ShoppingBag } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { PURCHASE_ORDER_STATUSES, formatMoney, getAdminPurchaseOrders, getPurchaseOrderStatusLabel } from "@/lib/purchase-orders";

export const dynamic = "force-dynamic";
export const metadata = { title: "إدارة طلبات الشراء | وصلها لي" };

type SearchParams = Promise<{ q?: string; status?: string }>;

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const { orders, stats } = await getAdminPurchaseOrders({ q: params.q, status: params.status });

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/admin" className="text-sm font-bold text-[var(--brand-navy)]">لوحة الشحنات</Link>
            <h1 className="mt-1 text-2xl font-bold text-[var(--brand-navy)]">إدارة طلبات الشراء</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3"><AdminNotificationBell adminId={admin.id} /><span className="inline-flex items-center gap-2 rounded-lg bg-[var(--info-bg)] px-3 py-2 text-sm font-bold text-[var(--info)]"><ShieldCheck className="h-4 w-4" />{admin.name}</span></div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Stat label="إجمالي الطلبات" value={stats.total} />
          <Stat label="بانتظار المراجعة" value={stats.pending} tone="warning" />
          <Stat label="مسعّرة" value={stats.quoted} />
          <Stat label="معتمدة" value={stats.approved} />
          <Stat label="مرفوضة" value={stats.rejected} />
          <Stat label="ملغاة" value={stats.cancelled} />
        </div>

        <form className="mt-6 grid gap-3 rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_240px_auto]">
          <label className="relative block"><Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" /><input name="q" defaultValue={params.q || ""} placeholder="ابحث برقم الطلب، Customer ID، العميل، المنتج أو المتجر" className="input pr-11" /></label>
          <select name="status" defaultValue={params.status || ""} className="input"><option value="">كل الحالات</option>{PURCHASE_ORDER_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
          <button className="h-[46px] rounded-lg bg-[var(--brand-navy)] px-5 text-sm font-bold text-white">تطبيق</button>
        </form>

        <div className="mt-6 grid gap-4">
          {orders.map((order) => (
            <article key={order.id} className="grid gap-4 rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><OrderStatusBadge status={order.status} /><span className="latin-text text-sm font-bold text-[var(--brand-navy)]" dir="ltr">{order.orderNumber}</span></div>
                <h2 className="mt-2 line-clamp-2 text-lg font-bold text-[var(--brand-navy)]">{order.productName}</h2>
                <div className="mt-3 grid gap-2 text-sm font-semibold text-[var(--text-secondary)] md:grid-cols-5">
                  <Info label="Customer ID" value={order.customerCode} ltr />
                  <Info label="العميل" value={order.customer.name} />
                  <Info label="البريد" value={order.customer.email} ltr />
                  <Info label="المتجر" value={order.storeName} />
                  <Info label="الإجمالي" value={formatMoney(order.finalTotal)} />
                </div>
              </div>
              <Link href={`/admin/orders/${order.orderNumber}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--brand-gold)] px-4 text-sm font-bold text-[var(--brand-navy)]"><ShoppingBag className="h-4 w-4" />مراجعة الطلب</Link>
            </article>
          ))}
          {orders.length === 0 && <p className="rounded-lg border border-[var(--border)] bg-white p-6 text-center text-sm font-bold text-[var(--text-secondary)]">لا توجد طلبات مطابقة.</p>}
        </div>
      </section>
    </main>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    PENDING_REVIEW: "bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning-bg)]",
    QUOTED: "bg-[var(--info-bg)] text-[var(--info)] border-[var(--info-bg)]",
    APPROVED: "bg-[var(--success-bg)] text-[var(--success)] border-[var(--success-bg)]",
    REJECTED: "bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger-bg)]",
    CANCELLED: "bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border)]",
  };
  return <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-bold ${tone[status] || tone.CANCELLED}`}>{getPurchaseOrderStatusLabel(status)}</span>;
}

function Stat({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "warning" }) {
  return <div className={`rounded-lg border p-4 shadow-sm ${tone === "warning" ? "border-[var(--warning-bg)] bg-[var(--warning-bg)]" : "border-[var(--border)] bg-white"}`}><p className="text-xs font-bold text-[var(--text-secondary)]">{label}</p><p className="mt-1 text-2xl font-bold text-[var(--brand-navy)]">{value}</p></div>;
}

function Info({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return <div className="min-w-0"><p className="text-[12px] font-bold text-[var(--text-secondary)]">{label}</p><p className="truncate font-bold text-[var(--text-primary)]" dir={ltr ? "ltr" : "rtl"}>{value}</p></div>;
}
