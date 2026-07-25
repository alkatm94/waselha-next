import Image from "next/image";
import Link from "next/link";
import { CalendarDays, PackagePlus, Search } from "lucide-react";
import { DashboardShell } from "@/components/account/DashboardShell";
import { ProductImagePlaceholder, cleanProductTitle } from "@/components/account/ShipmentUI";
import { requireCustomer } from "@/lib/auth";
import { getCustomerShipmentStats } from "@/lib/shipments";
import { formatMoney, getCustomerPurchaseOrders, getPurchaseOrderStatusLabel } from "@/lib/purchase-orders";

export const dynamic = "force-dynamic";
export const metadata = { title: "طلبات الشراء | وصلها لي" };

type SearchParams = Promise<{ q?: string }>;

export default async function CustomerOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const customer = await requireCustomer("/account/orders");
  const [params, orders, stats] = await Promise.all([searchParams, getCustomerPurchaseOrders(customer.id), getCustomerShipmentStats(customer.id)]);
  const q = (params.q || "").trim().toLowerCase();
  const filtered = orders.filter((order) => !q || [order.orderNumber, order.productName, order.storeName, order.status].some((value) => value.toLowerCase().includes(q)));

  return (
    <DashboardShell customer={customer} stats={stats} active="orders" title="طلبات الشراء" description="تابع طلبات الشراء وعروض الأسعار الصادرة من فريق وصلها لي.">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form className="relative sm:min-w-[420px]">
          <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input name="q" defaultValue={params.q || ""} placeholder="بحث برقم الطلب، المنتج، المتجر..." className="input pr-11" />
        </form>
        <Link href="/account/orders/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--brand-gold)] px-4 text-sm font-bold text-[var(--brand-navy)]"><PackagePlus className="h-4 w-4" />طلب شراء جديد</Link>
      </div>

      <div className="grid gap-4">
        {filtered.map((order) => (
          <article key={order.id} className="grid gap-3 rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm transition hover:border-[var(--brand-gold)] md:grid-cols-[110px_minmax(0,1fr)_auto] md:items-center">
            <div className="hidden md:block">{order.productImageUrl ? <Image src={order.productImageUrl} alt={order.productName} width={110} height={110} className="aspect-square rounded-lg object-cover" unoptimized /> : <ProductImagePlaceholder />}</div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><OrderStatusBadge status={order.status} /><span className="latin-text text-xs font-bold text-[var(--brand-navy)]" dir="ltr">{order.orderNumber}</span></div>
              <h2 className="mt-2 line-clamp-2 text-xl font-bold leading-7 text-[var(--brand-navy)]">{cleanProductTitle(order.productName)}</h2>
              <div className="mt-3 grid gap-2 text-sm font-semibold text-[var(--text-secondary)] sm:grid-cols-3">
                <Meta label="المتجر" value={order.storeName} />
                <Meta label="السعر النهائي" value={formatMoney(order.finalTotal)} />
                <Meta label="تاريخ الطلب" value={order.createdAt.toLocaleDateString("ar-SA")} />
              </div>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]"><CalendarDays className="h-4 w-4" />{order.createdAt.toLocaleDateString("ar-SA")}</p>
              <Link href={`/account/orders/${order.orderNumber}`} className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[var(--brand-navy)] px-4 text-sm font-bold text-white md:w-auto">عرض التفاصيل</Link>
            </div>
          </article>
        ))}
        {orders.length === 0 && <EmptyOrders />}
        {orders.length > 0 && filtered.length === 0 && <p className="rounded-lg border border-[var(--border)] bg-white p-6 text-center text-sm font-bold text-[var(--text-secondary)]">لا توجد طلبات مطابقة للبحث.</p>}
      </div>
    </DashboardShell>
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

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="text-[12px] font-bold text-[var(--text-secondary)]">{label}</p><p className="mt-0.5 truncate font-bold text-[var(--text-primary)]">{value}</p></div>;
}

function EmptyOrders() {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-8 text-center shadow-sm">
      <h2 className="text-2xl font-bold text-[var(--brand-navy)]">لا توجد طلبات شراء بعد</h2>
      <p className="mx-auto mt-2 max-w-lg text-[15px] font-medium leading-7 text-[var(--text-secondary)]">ابدأ بطلب شراء جديد وسيظهر هنا بعد الإرسال مباشرة.</p>
      <Link href="/account/orders/new" className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-[var(--brand-gold)] px-5 text-sm font-bold text-[var(--brand-navy)]">طلب شراء جديد</Link>
    </div>
  );
}
