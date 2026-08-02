import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { DashboardShell } from "@/components/account/DashboardShell";
import { PaylinkPaymentActions } from "@/components/account/PaylinkPaymentActions";
import { ProductImagePlaceholder, ProductLinkButton, cleanProductTitle } from "@/components/account/ShipmentUI";
import { requireCustomer } from "@/lib/auth";
import { getCustomerShipmentStats } from "@/lib/shipments";
import { formatMoney, getCustomerPurchaseOrder, getPurchaseOrderStatusLabel } from "@/lib/purchase-orders";

export const dynamic = "force-dynamic";
export const metadata = { title: "تفاصيل طلب الشراء | وصلها لي" };

type Params = Promise<{ orderNumber: string }>;

export default async function CustomerOrderDetailPage({ params }: { params: Params }) {
  const { orderNumber } = await params;
  const customer = await requireCustomer(`/account/orders/${orderNumber}`);
  const [order, stats] = await Promise.all([getCustomerPurchaseOrder(customer.id, orderNumber), getCustomerShipmentStats(customer.id)]);
  if (!order) notFound();

  return (
    <DashboardShell customer={customer} stats={stats} active="orders" title={`تفاصيل الطلب ${order.orderNumber}`} description={cleanProductTitle(order.productName, 120)}>
      <div className="grid gap-5">
        <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm sm:p-6">
          <div className="grid gap-5 xl:grid-cols-[140px_minmax(0,1fr)_auto] xl:items-center">
            {order.productImageUrl ? <Image src={order.productImageUrl} alt={order.productName} width={140} height={140} className="aspect-square rounded-lg object-cover" unoptimized /> : <ProductImagePlaceholder />}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><OrderStatusBadge status={order.status} /><span className="latin-text text-sm font-bold text-[var(--text-secondary)]" dir="ltr">{order.orderNumber}</span></div>
              <h2 className="mt-3 text-lg font-bold leading-7 text-[var(--brand-navy)] sm:text-2xl">{cleanProductTitle(order.productName, 120)}</h2>
              <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-[var(--text-secondary)]"><span>{order.storeName}</span><span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" />{order.createdAt.toLocaleDateString("ar-SA")}</span></div>
            </div>
            <div className="flex flex-col gap-3 xl:items-end"><ProductLinkButton url={order.productUrl} /><Link href="/account/orders" className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--border)] px-3 text-sm font-bold text-[var(--brand-navy)]">العودة للطلبات</Link></div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-5">
            <InfoCard title="بيانات الطلب">
              <Info label="اسم المنتج" value={order.productName} />
              <Info label="المتجر" value={order.storeName} />
              <Info label="اللون أو المقاس" value={order.variant || "-"} />
              <Info label="الكمية" value={String(order.quantity)} />
              <Info label="السعر المعروف" value={formatMoney(order.estimatedProductPrice)} />
              <Info label="الحالة" value={getPurchaseOrderStatusLabel(order.status)} />
            </InfoCard>

            <InfoCard title="عرض السعر">
              <Info label="سعر المنتج" value={formatMoney(order.quotedProductPrice)} />
              <Info label="الشحن الداخلي" value={formatMoney(order.domesticShipping)} />
              <Info label="رسوم الخدمة" value={formatMoney(order.serviceFee)} />
              <Info label="الضرائب أو الرسوم التقديرية" value={formatMoney(order.estimatedTaxes)} />
              <div className="rounded-lg bg-[var(--brand-navy)] p-4 text-white md:col-span-2"><p className="text-[13px] font-bold text-white/70">الإجمالي النهائي</p><p className="mt-1 text-xl font-bold text-[var(--brand-gold)]">{formatMoney(order.finalTotal)}</p></div>
            </InfoCard>
          </div>

          <aside className="grid content-start gap-5">
            {(order.status === "QUOTED" || order.status === "PAID" || order.paymentStatus !== "UNPAID") && <section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-[var(--brand-navy)]">الدفع</h2>
              <div className="mt-4 rounded-lg bg-[var(--background)] p-4"><p className="text-xs font-bold text-[var(--text-secondary)]">المبلغ المطلوب</p><p className="mt-1 text-2xl font-bold text-[var(--brand-navy)]">{formatMoney(order.finalTotal)}</p></div>
              <p className="my-4 text-sm font-semibold leading-7 text-[var(--text-secondary)]">يتم الدفع في صفحة Paylink الآمنة، ولا نجمع بيانات البطاقة داخل موقعنا.</p>
              <PaylinkPaymentActions orderNumber={order.orderNumber} paymentStatus={order.paymentStatus} paymentUrl={order.paylinkPaymentUrl} />
              {order.paymentStatus === "PAID" && <div className="mt-4 grid gap-2 text-sm font-semibold"><p>وسيلة الدفع: {order.paymentMethod || "غير محددة"}</p><p>تاريخ الدفع: {order.paidAt?.toLocaleString("ar-SA") || "-"}</p>{order.paymentReceiptUrl && <a href={order.paymentReceiptUrl} target="_blank" rel="noreferrer" className="font-bold text-[var(--brand-navy)] underline">فتح الإيصال</a>}</div>}
            </section>}
            <section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-[var(--brand-navy)]">ملاحظة الإدارة</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-7 text-[var(--text-primary)]">{order.customerNote || "لا توجد ملاحظة بعد."}</p>
            </section>
            {order.notes && <section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm"><h2 className="text-xl font-bold text-[var(--brand-navy)]">ملاحظاتك</h2><p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-7 text-[var(--text-primary)]">{order.notes}</p></section>}
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    PENDING_REVIEW: "bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning-bg)]",
    QUOTED: "bg-[var(--info-bg)] text-[var(--info)] border-[var(--info-bg)]",
    PAID: "bg-[var(--success-bg)] text-[var(--success)] border-[var(--success-bg)]",
    APPROVED: "bg-[var(--success-bg)] text-[var(--success)] border-[var(--success-bg)]",
    REJECTED: "bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger-bg)]",
    CANCELLED: "bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border)]",
  };
  return <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-bold ${tone[status] || tone.CANCELLED}`}>{getPurchaseOrderStatusLabel(status)}</span>;
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm sm:p-6"><h2 className="text-xl font-bold text-[var(--brand-navy)]">{title}</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{children}</div></section>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-[var(--background)] p-4"><p className="text-[13px] font-bold text-[var(--text-secondary)]">{label}</p><p className="mt-1 break-words text-[15px] font-bold text-[var(--text-primary)]">{value}</p></div>;
}
