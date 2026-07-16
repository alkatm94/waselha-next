import Link from "next/link";
import { PackageCheck, Search, ShieldCheck, Truck } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminDashboardData } from "@/lib/admin-shipments";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { StatusBadge, cleanProductTitle } from "@/components/account/ShipmentUI";

export const dynamic = "force-dynamic";
export const metadata = { title: "لوحة تشغيل الشحنات | وصلها لي" };

type AdminSearchParams = Promise<{ q?: string }>;

export default async function AdminDashboardPage({ searchParams }: { searchParams: AdminSearchParams }) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const { shipments, stats } = await getAdminDashboardData(params.q || "");

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold text-[var(--brand-gold-dark)]">{admin.role}</p>
            <h1 className="text-2xl font-bold text-[var(--brand-navy)]">لوحة تشغيل الشحنات</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <AdminNotificationBell adminId={admin.id} />
            <span className="inline-flex items-center gap-2 rounded-lg bg-[var(--info-bg)] px-3 py-2 text-sm font-bold text-[var(--info)]"><ShieldCheck className="h-4 w-4" />{admin.name}</span>
            <form action="/admin/logout" method="post"><button className="h-10 rounded-lg border border-[var(--border)] px-4 text-sm font-bold text-[var(--brand-navy)]">تسجيل الخروج</button></form>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Stat label="إجمالي الشحنات" value={stats.total} />
          <Stat label="بانتظار الوصول" value={stats.awaiting} />
          <Stat label="وصلت للمستودع" value={stats.arrived} />
          <Stat label="تحتاج إجراء" value={stats.needsAction} tone="warning" />
          <Stat label="جاهزة للشحن" value={stats.ready} />
          <Stat label="تم الشحن" value={stats.shipped} />
        </div>

        <form className="mt-6 grid gap-3 rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input name="q" defaultValue={params.q || ""} placeholder="ابحث برقم الشحنة، التتبع المحلي، Customer ID، اسم العميل أو البريد" className="input pr-11" />
          </label>
          <button className="h-[46px] rounded-lg bg-[var(--brand-navy)] px-5 text-sm font-bold text-white">بحث</button>
        </form>

        <div className="mt-6 grid gap-4">
          {shipments.map((shipment) => (
            <article key={shipment.id} className="grid gap-4 rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><div className="flex items-center gap-3"><AdminNotificationBell adminId={admin.id} /><StatusBadge status={shipment.status} /></div><span className="latin-text text-sm font-bold text-[var(--brand-navy)]" dir="ltr">{shipment.internalReference}</span></div>
                <h2 className="mt-2 line-clamp-2 text-lg font-bold text-[var(--brand-navy)]">{cleanProductTitle(shipment.productName)}</h2>
                <div className="mt-3 grid gap-2 text-sm font-semibold text-[var(--text-secondary)] md:grid-cols-4">
                  <Info label="Customer ID" value={shipment.customerCode} ltr />
                  <Info label="التتبع المحلي" value={shipment.localTrackingNumber} ltr />
                  <Info label="العميل" value={shipment.customer.name} />
                  <Info label="البريد" value={shipment.customer.email} ltr />
                </div>
              </div>
              <Link href={`/admin/shipments/${shipment.internalReference}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--brand-gold)] px-4 text-sm font-bold text-[var(--brand-navy)]"><Truck className="h-4 w-4" />تشغيل الشحنة</Link>
            </article>
          ))}
          {shipments.length === 0 && <p className="rounded-lg border border-[var(--border)] bg-white p-6 text-center text-sm font-bold text-[var(--text-secondary)]">لا توجد شحنات مطابقة.</p>}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "warning" }) {
  return <div className={`rounded-lg border p-4 shadow-sm ${tone === "warning" ? "border-[var(--warning-bg)] bg-[var(--warning-bg)]" : "border-[var(--border)] bg-white"}`}><p className="text-xs font-bold text-[var(--text-secondary)]">{label}</p><p className="mt-1 text-2xl font-bold text-[var(--brand-navy)]">{value}</p></div>;
}

function Info({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return <div className="min-w-0"><p className="text-[12px] font-bold text-[var(--text-secondary)]">{label}</p><p className="truncate font-bold text-[var(--text-primary)]" dir={ltr ? "ltr" : "rtl"}>{value}</p></div>;
}

