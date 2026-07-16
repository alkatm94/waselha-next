import Link from "next/link";
import { MapPinned, PackagePlus, PackageSearch } from "lucide-react";
import { DashboardShell } from "@/components/account/DashboardShell";
import { EmptyShipments, StatusBadge, cleanProductTitle } from "@/components/account/ShipmentUI";
import { requireCustomer } from "@/lib/auth";
import { getCustomerShipments, getCustomerShipmentStats } from "@/lib/shipments";

export const dynamic = "force-dynamic";
export const metadata = { title: "لوحة العميل | وصلها لي" };

export default async function AccountDashboardPage() {
  const customer = await requireCustomer("/account");
  const [shipments, stats] = await Promise.all([getCustomerShipments(customer.id), getCustomerShipmentStats(customer.id)]);
  const latest = shipments.slice(0, 3);

  return (
    <DashboardShell customer={customer} stats={stats} active="overview" title="نظرة عامة" description="تابع عنوانك في الصين وشحناتك القادمة من مكان واحد.">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[var(--brand-gold-dark)]">آخر الشحنات</p>
              <h2 className="mt-1 text-2xl font-bold text-[var(--brand-navy)]">نشاط حسابك</h2>
            </div>
            <Link href="/account/shipments" className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--border)] px-4 text-sm font-bold text-[var(--brand-navy)]">عرض الكل</Link>
          </div>
          <div className="mt-5 grid gap-3">
            {latest.map((shipment) => (
              <Link key={shipment.id} href={`/account/shipments/${shipment.internalReference}`} className="grid gap-3 rounded-lg border border-[var(--border)] p-4 transition hover:border-[var(--brand-gold)] sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="latin-text text-sm font-bold text-[var(--brand-navy)]" dir="ltr">{shipment.internalReference}</p>
                  <p className="mt-1 line-clamp-2 text-base font-bold text-[var(--text-primary)]">{cleanProductTitle(shipment.productName)}</p>
                </div>
                <StatusBadge status={shipment.status} />
              </Link>
            ))}
            {latest.length === 0 && <EmptyShipments />}
          </div>
        </section>

        <aside className="grid gap-4">
          <Link href="/account/china-address" className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm transition hover:border-[var(--brand-gold)]">
            <MapPinned className="h-6 w-6 text-[var(--info)]" />
            <h3 className="mt-3 text-xl font-bold text-[var(--brand-navy)]">عنواني في الصين</h3>
            <p className="mt-1 text-sm font-medium leading-7 text-[var(--text-secondary)]">انسخ بيانات المستودع واستخدم Customer ID عند الشراء.</p>
          </Link>
          <Link href="/account/china-address/shipments/new" className="rounded-lg bg-[var(--brand-navy)] p-5 text-white shadow-sm transition hover:bg-[var(--brand-navy-light)]">
            <PackagePlus className="h-6 w-6 text-[var(--brand-gold)]" />
            <h3 className="mt-3 text-xl font-bold">تسجيل شحنة قادمة</h3>
            <p className="mt-1 text-sm font-medium leading-7 text-white/72">سجّل رقم التتبع المحلي حتى نتابع وصول الشحنة.</p>
          </Link>
          <Link href="/account/shipments" className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm transition hover:border-[var(--brand-gold)]">
            <PackageSearch className="h-6 w-6 text-[var(--success)]" />
            <h3 className="mt-3 text-xl font-bold text-[var(--brand-navy)]">شحناتي</h3>
            <p className="mt-1 text-sm font-medium leading-7 text-[var(--text-secondary)]">تابع الحالات والتكاليف والصور من صفحة التفاصيل.</p>
          </Link>
        </aside>
      </div>
    </DashboardShell>
  );
}
