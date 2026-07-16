import Link from "next/link";
import { CalendarDays, PackagePlus, Search, SlidersHorizontal } from "lucide-react";
import { DashboardShell } from "@/components/account/DashboardShell";
import { EmptyShipments, ProductImagePlaceholder, StatusBadge, cleanProductTitle, productDomain } from "@/components/account/ShipmentUI";
import { requireCustomer } from "@/lib/auth";
import { getCustomerShipments, getCustomerShipmentStats, SHIPMENT_STATUSES } from "@/lib/shipments";

export const dynamic = "force-dynamic";
export const metadata = { title: "شحناتي | وصلها لي" };

type ShipmentSearchParams = Promise<{ q?: string; status?: string; sort?: string; tab?: string }>;

const activeStatuses = new Set(["REGISTERED", "AWAITING_WAREHOUSE", "ARRIVED_WAREHOUSE", "INSPECTING", "WEIGHED", "AWAITING_SHIPPING_PAYMENT", "READY_TO_SHIP", "SHIPPED"]);
const arrivedStatuses = new Set(["ARRIVED_WAREHOUSE", "INSPECTING", "WEIGHED", "AWAITING_SHIPPING_PAYMENT", "READY_TO_SHIP", "SHIPPED", "DELIVERED"]);

export default async function MyShipmentsPage({ searchParams }: { searchParams: ShipmentSearchParams }) {
  const customer = await requireCustomer("/account/shipments");
  const [params, allShipments, stats] = await Promise.all([searchParams, getCustomerShipments(customer.id), getCustomerShipmentStats(customer.id)]);
  const q = (params.q || "").trim().toLowerCase();
  const status = params.status || "";
  const tab = params.tab || "all";
  const sort = params.sort === "oldest" ? "oldest" : "newest";

  const filtered = allShipments
    .filter((shipment) => !q || [shipment.productName, shipment.storeName, shipment.localTrackingNumber, shipment.internalReference].some((value) => value.toLowerCase().includes(q)))
    .filter((shipment) => !status || shipment.status === status)
    .filter((shipment) => {
      if (tab === "active") return activeStatuses.has(shipment.status);
      if (tab === "arrived") return arrivedStatuses.has(shipment.status);
      if (tab === "completed") return shipment.status === "DELIVERED";
      return true;
    })
    .sort((a, b) => sort === "oldest" ? a.createdAt.getTime() - b.createdAt.getTime() : b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <DashboardShell customer={customer} stats={stats} active="shipments" title="شحناتي" description="تابع شحناتك القادمة من الصين، وابحث برقم التتبع أو المتجر أو رقم الشحنة الداخلي.">
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <Tab href="/account/shipments?tab=all" active={tab === "all"} label="الكل" />
          <Tab href="/account/shipments?tab=active" active={tab === "active"} label="نشطة" />
          <Tab href="/account/shipments?tab=arrived" active={tab === "arrived"} label="وصلت للمستودع" />
          <Tab href="/account/shipments?tab=completed" active={tab === "completed"} label="مكتملة" />
        </div>
        <Link href="/account/china-address/shipments/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--brand-gold)] px-4 text-sm font-bold text-[var(--brand-navy)] sm:h-12"><PackagePlus className="h-4 w-4" />تسجيل شحنة قادمة</Link>
      </div>

      <form className="mb-5 grid gap-3 rounded-lg border border-[var(--border)] bg-white p-3 shadow-sm sm:p-4 xl:grid-cols-[minmax(0,1fr)_240px_180px_auto]">
        <label className="relative block">
          <span className="sr-only">بحث</span>
          <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input name="q" defaultValue={params.q || ""} placeholder="بحث برقم التتبع، المتجر، المنتج..." className="input pr-11" />
        </label>
        <label className="relative block">
          <span className="sr-only">فلترة حسب الحالة</span>
          <SlidersHorizontal className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
          <select name="status" defaultValue={status} className="input pr-11"><option value="">كل الحالات</option>{SHIPMENT_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
        </label>
        <select name="sort" defaultValue={sort} className="input"><option value="newest">الأحدث أولًا</option><option value="oldest">الأقدم أولًا</option></select>
        <input type="hidden" name="tab" value={tab} />
        <button className="h-[52px] rounded-lg bg-[var(--brand-navy)] px-5 text-sm font-bold text-white">تطبيق</button>
      </form>

      {allShipments.length === 0 ? <EmptyShipments /> : (
        <div className="grid gap-4">
          {filtered.map((shipment) => (
            <article key={shipment.id} className="grid gap-3 rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm transition hover:border-[var(--brand-gold)] md:grid-cols-[120px_minmax(0,1fr)_auto] md:items-center">
              <div className="hidden md:block"><ProductImagePlaceholder /></div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><StatusBadge status={shipment.status} /><span className="latin-text text-xs font-bold text-[var(--text-secondary)]" dir="ltr">{shipment.internalReference}</span></div>
                <h2 className="mt-2 line-clamp-2 text-xl font-bold leading-7 text-[var(--brand-navy)]">{cleanProductTitle(shipment.productName)}</h2>
                <div className="mt-3 grid gap-2 text-sm font-semibold text-[var(--text-secondary)] sm:grid-cols-2 xl:grid-cols-4">
                  <Meta label="التتبع المحلي" value={shipment.localTrackingNumber} ltr />
                  <Meta className="hidden sm:block" label="المتجر" value={shipment.storeName} />
                  <Meta className="hidden sm:block" label="الدومين" value={productDomain(shipment.productUrl)} ltr />
                  <Meta label="آخر تحديث" value={shipment.updatedAt.toLocaleDateString("ar-SA")} icon />
                </div>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]"><CalendarDays className="h-4 w-4" />{shipment.createdAt.toLocaleDateString("ar-SA")}</p>
                <Link href={`/account/shipments/${shipment.internalReference}`} className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[var(--brand-navy)] px-4 text-sm font-bold text-white md:w-auto">عرض التفاصيل</Link>
              </div>
            </article>
          ))}
          {filtered.length === 0 && <p className="rounded-lg border border-[var(--border)] bg-white p-6 text-center text-sm font-bold text-[var(--text-secondary)]">لا توجد شحنات مطابقة للفلاتر الحالية.</p>}
        </div>
      )}
    </DashboardShell>
  );
}

function Tab({ href, active, label }: { href: string; active: boolean; label: string }) {
  return <Link href={href} className={`inline-flex h-11 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-bold ${active ? "bg-[var(--brand-navy)] text-white" : "border border-[var(--border)] bg-white text-[var(--brand-navy)]"}`}>{label}</Link>;
}

function Meta({ label, value, ltr, icon, className = "" }: { label: string; value: string; ltr?: boolean; icon?: boolean; className?: string }) {
  return <div className={`min-w-0 ${className}`}><p className="text-[12px] font-bold text-[var(--text-secondary)]">{label}</p><p className={`mt-0.5 truncate font-bold text-[var(--text-primary)] ${ltr ? "latin-text" : ""}`} dir={ltr ? "ltr" : "rtl"}>{icon ? value : value}</p></div>;
}

