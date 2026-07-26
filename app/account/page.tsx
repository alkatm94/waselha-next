import Link from "next/link";
import { ArrowLeft, Box, MapPinned, PackagePlus, ShoppingBag, Truck, type LucideIcon } from "lucide-react";
import { DashboardShell } from "@/components/account/DashboardShell";
import { StatusBadge, cleanProductTitle } from "@/components/account/ShipmentUI";
import { requireCustomer } from "@/lib/auth";
import { getCustomerShipments, getCustomerShipmentStats } from "@/lib/shipments";

export const dynamic = "force-dynamic";
export const metadata = { title: "لوحة العميل | وصلها لي" };

export default async function AccountDashboardPage() {
  const customer = await requireCustomer("/account");
  const [shipments, stats] = await Promise.all([getCustomerShipments(customer.id), getCustomerShipmentStats(customer.id)]);
  const latest = shipments.slice(0, 3);

  return (
    <DashboardShell customer={customer} stats={stats} active="overview" title="نظرة عامة" description="تابع عنوانك في الصين وشحناتك القادمة من مكان واحد." layout="overview">
      <div className="mx-auto grid w-full max-w-[1320px] gap-6 lg:gap-8">
        <header className="overflow-hidden rounded-2xl bg-[var(--brand-navy)] px-5 py-6 text-white shadow-[0_12px_35px_rgba(11,42,61,0.12)] sm:px-7 sm:py-8 lg:px-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-[var(--brand-gold)]">لوحة حسابك</p>
              <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl lg:text-[36px]">مرحبًا، {customer.name}</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/70 sm:text-[15px]">تابع شحناتك وطلباتك، وسجّل الشحنة القادمة أو اطلب منتجًا جديدًا من مكان واحد.</p>
            </div>
            <div className="w-fit shrink-0 rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3">
              <p className="text-xs font-semibold text-white/60">رقم العميل</p>
              <p className="mt-1 text-base font-bold text-[var(--brand-gold)]" dir="ltr">{customer.customerId}</p>
            </div>
          </div>
        </header>

        <section aria-label="إحصاءات الحساب" className="grid gap-4 md:grid-cols-3">
          <MetricCard icon={Box} label="الشحنات" value={String(shipments.length)} hint="إجمالي الشحنات المسجلة" href="/account/shipments" />
          <MetricCard icon={ShoppingBag} label="طلبات الشراء" value="عرض الطلبات" hint="الطلبات وعروض الأسعار" href="/account/orders" />
          <MetricCard icon={Truck} label="الشحنات النشطة" value={String(stats.active)} hint={stats.needsAction > 0 ? `${stats.needsAction} تحتاج إجراء منك` : "لا توجد إجراءات مطلوبة"} href="/account/shipments" accent />
        </section>

        <section className="rounded-2xl border border-[var(--border)]/70 bg-white p-5 shadow-[0_8px_30px_rgba(11,42,61,0.045)] sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[var(--brand-gold-dark)]">متابعة الحساب</p>
              <h2 className="mt-1 text-2xl font-bold text-[var(--brand-navy)]">آخر الشحنات</h2>
            </div>
            <Link href="/account/china-address/shipments/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--brand-gold)] px-4 text-sm font-bold text-[var(--brand-navy)] transition hover:-translate-y-0.5">
              <PackagePlus className="h-[18px] w-[18px]" />تسجيل شحنة قادمة
            </Link>
          </div>
          <div className="mt-6 grid gap-3">
            {latest.map((shipment) => (
              <Link key={shipment.id} href={`/account/shipments/${shipment.internalReference}`} className="grid gap-3 rounded-xl bg-[var(--background)] p-4 transition hover:bg-[var(--info-bg)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
                <div className="min-w-0">
                  <p className="latin-text text-sm font-bold text-[var(--brand-navy)]" dir="ltr">{shipment.internalReference}</p>
                  <p className="mt-1 line-clamp-2 text-base font-bold text-[var(--text-primary)]">{cleanProductTitle(shipment.productName)}</p>
                </div>
                <StatusBadge status={shipment.status} />
              </Link>
            ))}
            {latest.length === 0 && (
              <div className="grid place-items-center rounded-2xl bg-[var(--background)] px-5 py-10 text-center sm:py-12">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-[var(--brand-navy)] shadow-sm"><Box className="h-6 w-6" /></span>
                <h3 className="mt-4 text-xl font-bold text-[var(--brand-navy)]">لا توجد شحنات مسجلة بعد</h3>
                <p className="mt-2 max-w-md text-sm font-medium leading-7 text-[var(--text-secondary)]">عند شرائك من الصين، سجّل رقم التتبع المحلي لنربط الشحنة بحسابك ونتابع وصولها.</p>
                <Link href="/account/china-address/shipments/new" className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--brand-navy)] px-5 text-sm font-bold text-white">
                  <PackagePlus className="h-[18px] w-[18px]" />تسجيل شحنة قادمة
                </Link>
              </div>
            )}
          </div>
          {latest.length > 0 && <div className="mt-5 border-t border-[var(--border)]/70 pt-4"><Link href="/account/shipments" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--brand-navy)]">عرض كل الشحنات <ArrowLeft className="h-4 w-4" /></Link></div>}
        </section>

        <section>
          <div className="mb-4">
            <p className="text-sm font-bold text-[var(--brand-gold-dark)]">اختصارات مفيدة</p>
            <h2 className="mt-1 text-2xl font-bold text-[var(--brand-navy)]">إجراءات سريعة</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <QuickAction href="/account/china-address/shipments/new" icon={PackagePlus} title="تسجيل شحنة" description="أضف رقم التتبع المحلي للشحنة القادمة." primary />
            <QuickAction href="/account/orders/new" icon={ShoppingBag} title="إنشاء طلب شراء" description="أرسل رابط المنتج ليتم مراجعته وتسعيره." />
            <QuickAction href="/account/china-address" icon={MapPinned} title="عرض عنواني في الصين" description="انسخ عنوان المستودع ورقم العميل." />
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

function MetricCard({ icon: Icon, label, value, hint, href, accent = false }: { icon: LucideIcon; label: string; value: string; hint: string; href: string; accent?: boolean }) {
  return (
    <Link href={href} className={`group rounded-2xl border p-5 transition hover:-translate-y-0.5 sm:p-6 ${accent ? "border-[var(--brand-navy)] bg-[var(--brand-navy)] text-white" : "border-[var(--border)]/70 bg-white shadow-[0_8px_25px_rgba(11,42,61,0.04)]"}`}>
      <div className="flex items-start justify-between gap-4">
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${accent ? "bg-white/10 text-[var(--brand-gold)]" : "bg-[var(--info-bg)] text-[var(--brand-navy)]"}`}><Icon className="h-5 w-5" /></span>
        <ArrowLeft className={`h-4 w-4 transition group-hover:-translate-x-1 ${accent ? "text-white/50" : "text-[var(--text-secondary)]"}`} />
      </div>
      <p className={`mt-5 text-sm font-bold ${accent ? "text-white/65" : "text-[var(--text-secondary)]"}`}>{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? "text-white" : "text-[var(--brand-navy)]"}`}>{value}</p>
      <p className={`mt-2 text-sm font-medium ${accent ? "text-white/60" : "text-[var(--text-secondary)]"}`}>{hint}</p>
    </Link>
  );
}

function QuickAction({ href, icon: Icon, title, description, primary = false }: { href: string; icon: LucideIcon; title: string; description: string; primary?: boolean }) {
  return (
    <Link href={href} className={`group flex min-h-36 items-start gap-4 rounded-2xl border p-5 transition hover:-translate-y-0.5 sm:p-6 ${primary ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-[var(--brand-navy)]" : "border-[var(--border)]/70 bg-white shadow-[0_8px_25px_rgba(11,42,61,0.035)]"}`}>
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${primary ? "bg-[var(--brand-navy)] text-[var(--brand-gold)]" : "bg-[var(--background)] text-[var(--brand-navy)]"}`}><Icon className="h-5 w-5" /></span>
      <div className="min-w-0">
        <h3 className="text-lg font-bold text-[var(--brand-navy)]">{title}</h3>
        <p className={`mt-2 text-sm font-medium leading-6 ${primary ? "text-[var(--brand-navy)]/70" : "text-[var(--text-secondary)]"}`}>{description}</p>
      </div>
    </Link>
  );
}
