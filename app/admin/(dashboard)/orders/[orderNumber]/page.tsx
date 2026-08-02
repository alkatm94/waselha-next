import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Calculator, ExternalLink, History, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { ProductImagePlaceholder } from "@/components/account/ShipmentUI";
import { PURCHASE_ORDER_STATUSES, formatMoney, getAdminPurchaseOrder, getPurchaseOrderStatusLabel, updatePurchaseOrderQuote } from "@/lib/purchase-orders";
import { reconcilePayment } from "@/lib/payments/payment-service";

export const dynamic = "force-dynamic";
export const metadata = { title: "مراجعة طلب الشراء | وصلها لي" };

type Params = Promise<{ orderNumber: string }>;

export default async function AdminOrderPage({ params }: { params: Params }) {
  const admin = await requireAdmin();
  const { orderNumber } = await params;
  const order = await getAdminPurchaseOrder(orderNumber);
  if (!order) notFound();
  const paymentTransactionNo = order.paylinkTransactionNo;
  const currentOrderNumber = order.orderNumber;

  async function verifyPaymentAction() {
    "use server";
    await requireAdmin();
    if (paymentTransactionNo) await reconcilePayment(paymentTransactionNo, "manual-check");
    revalidatePath(`/admin/orders/${currentOrderNumber}`);
  }

  async function updateAction(formData: FormData) {
    "use server";
    const activeAdmin = await requireAdmin();
    await updatePurchaseOrderQuote(activeAdmin, formData);
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/admin/orders" className="text-sm font-bold text-[var(--brand-navy)]">العودة لطلبات الشراء</Link>
            <h1 className="mt-1 text-2xl font-bold text-[var(--brand-navy)]">مراجعة طلب <span dir="ltr" className="latin-text">{order.orderNumber}</span></h1>
          </div>
          <div className="flex flex-wrap items-center gap-3"><AdminNotificationBell adminId={admin.id} /><OrderStatusBadge status={order.status} /><span className="inline-flex items-center gap-2 rounded-lg bg-[var(--info-bg)] px-3 py-2 text-sm font-bold text-[var(--info)]"><ShieldCheck className="h-4 w-4" />{admin.name}</span></div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-6">
          <section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--brand-navy)]">معلومات المنتج والعميل</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-[140px_minmax(0,1fr)]">
              {order.productImageUrl ? <Image src={order.productImageUrl} alt={order.productName} width={140} height={140} className="aspect-square rounded-lg object-cover" unoptimized /> : <ProductImagePlaceholder />}
              <div className="grid gap-3 md:grid-cols-3">
                <Info label="العميل" value={order.customer.name} />
                <Info label="Customer ID" value={order.customerCode} ltr />
                <Info label="البريد" value={order.customer.email} ltr />
                <Info label="اسم المنتج" value={order.productName} />
                <Info label="المتجر" value={order.storeName} />
                <Info label="الكمية" value={String(order.quantity)} />
                <Info label="اللون أو المقاس" value={order.variant || "-"} />
                <Info label="السعر المعروف" value={formatMoney(order.estimatedProductPrice)} />
                <Info label="تاريخ الطلب" value={order.createdAt.toLocaleString("ar-SA")} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3"><a href={order.productUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 text-sm font-bold text-[var(--brand-navy)]"><ExternalLink className="h-4 w-4" />فتح رابط المنتج</a></div>
            {order.notes && <p className="mt-4 whitespace-pre-wrap rounded-lg bg-[var(--background)] p-4 text-sm font-semibold leading-7">{order.notes}</p>}
          </section>

          <form action={updateAction} className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
            <input type="hidden" name="purchaseOrderId" value={order.id} />
            <div className="flex items-center gap-2"><Calculator className="h-5 w-5 text-[var(--success)]" /><h2 className="text-xl font-bold text-[var(--brand-navy)]">التسعير والحالة</h2></div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold">سعر المنتج<input name="quotedProductPrice" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={order.quotedProductPrice?.toString() ?? ""} className="input" /></label>
              <label className="grid gap-2 text-sm font-bold">الشحن الداخلي<input name="domesticShipping" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={order.domesticShipping?.toString() ?? ""} className="input" /></label>
              <label className="grid gap-2 text-sm font-bold">رسوم الخدمة<input name="serviceFee" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={order.serviceFee?.toString() ?? ""} className="input" /></label>
              <label className="grid gap-2 text-sm font-bold">الضرائب أو الرسوم التقديرية<input name="estimatedTaxes" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={order.estimatedTaxes?.toString() ?? ""} className="input" /></label>
              <label className="grid gap-2 text-sm font-bold">الحالة<select name="status" defaultValue={order.status} className="input">{PURCHASE_ORDER_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
              <div className="rounded-lg bg-[var(--brand-navy)] p-4 text-white"><p className="text-xs font-bold text-white/70">الإجمالي المحفوظ</p><p className="mt-1 text-xl font-bold text-[var(--brand-gold)]">{formatMoney(order.finalTotal)}</p></div>
              <label className="grid gap-2 text-sm font-bold md:col-span-2">ملاحظة للعميل<textarea name="customerNote" rows={4} defaultValue={order.customerNote ?? ""} className="input h-28 py-3" /></label>
            </div>
            <p className="mt-4 rounded-lg bg-[var(--info-bg)] p-4 text-sm font-bold text-[var(--info)]">الإجمالي يُحسب في الخادم من: سعر المنتج + الشحن الداخلي + رسوم الخدمة + الضرائب أو الرسوم التقديرية.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button name="action" value="issueQuote" className="h-12 rounded-lg bg-[var(--brand-gold)] px-5 text-sm font-bold text-[var(--brand-navy)]">إصدار عرض السعر</button>
              <button name="action" value="save" className="h-12 rounded-lg border border-[var(--border)] bg-white px-5 text-sm font-bold text-[var(--brand-navy)]">حفظ التحديث</button>
            </div>
          </form>
        </div>

        <aside className="grid content-start gap-6">
          <section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--brand-navy)]">بيانات الدفع</h2>
            <div className="mt-4 grid gap-2 text-sm font-semibold">
              <Summary label="الحالة" value={order.paymentStatus} />
              <Summary label="المبلغ المطلوب" value={formatMoney(order.finalTotal)} />
              <Summary label="المبلغ المدفوع" value={formatMoney(order.paidAmount)} />
              <Summary label="رقم Paylink" value={order.paylinkTransactionNo || "-"} />
              <Summary label="إنشاء الرابط" value={order.paymentCreatedAt?.toLocaleString("ar-SA") || "-"} />
              <Summary label="تاريخ الدفع" value={order.paidAt?.toLocaleString("ar-SA") || "-"} />
              <Summary label="وسيلة الدفع" value={order.paymentMethod || "-"} />
            </div>
            {order.paymentFailureReason && <p className="mt-3 rounded-lg bg-[var(--danger-bg)] p-3 text-sm font-bold text-[var(--danger)]">تعذر إكمال آخر تحقق: {order.paymentFailureReason}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {order.paylinkTransactionNo && order.paymentStatus !== "PAID" && <form action={verifyPaymentAction}><button className="h-10 rounded-lg bg-[var(--brand-navy)] px-4 text-sm font-bold text-white">التحقق من الدفع</button></form>}
              {order.paylinkPaymentUrl && <a href={order.paylinkPaymentUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-lg border border-[var(--border)] px-4 text-sm font-bold text-[var(--brand-navy)]">فتح رابط الدفع</a>}
              {order.paymentReceiptUrl && <a href={order.paymentReceiptUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-lg border border-[var(--border)] px-4 text-sm font-bold text-[var(--brand-navy)]">فتح الإيصال</a>}
            </div>
          </section>
          <section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--brand-navy)]">ملخص السعر</h2>
            <div className="mt-4 grid gap-2 text-sm font-bold text-[var(--text-secondary)]">
              <Summary label="سعر المنتج" value={formatMoney(order.quotedProductPrice)} />
              <Summary label="الشحن الداخلي" value={formatMoney(order.domesticShipping)} />
              <Summary label="رسوم الخدمة" value={formatMoney(order.serviceFee)} />
              <Summary label="الرسوم التقديرية" value={formatMoney(order.estimatedTaxes)} />
              <Summary label="الإجمالي" value={formatMoney(order.finalTotal)} strong />
            </div>
          </section>

          <section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold text-[var(--brand-navy)]"><History className="h-5 w-5" />Audit Log</h2>
            <div className="mt-4 grid gap-3">
              {order.auditLogs.map((log) => <div key={log.id} className="rounded-lg bg-[var(--background)] p-3 text-sm"><p className="font-bold text-[var(--brand-navy)]">{log.field}</p><p className="text-xs font-semibold text-[var(--text-secondary)]">{log.admin?.name || log.adminEmail} - {log.createdAt.toLocaleString("ar-SA")}</p><p className="mt-1 break-words text-xs"><span className="text-[var(--danger)]">{log.previousValue || "فارغ"}</span> ← <span className="text-[var(--success)]">{log.newValue || "فارغ"}</span></p></div>)}
              {order.auditLogs.length === 0 && <p className="text-sm font-bold text-[var(--text-secondary)]">لا توجد تعديلات مسجلة بعد.</p>}
            </div>
          </section>
        </aside>
      </section>
    </main>
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

function Info({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) { return <div className="rounded-lg bg-[var(--background)] p-3"><p className="text-xs font-bold text-[var(--text-secondary)]">{label}</p><p className="mt-1 break-words text-sm font-bold" dir={ltr ? "ltr" : "rtl"}>{value}</p></div>; }
function Summary({ label, value, strong }: { label: string; value: string; strong?: boolean }) { return <div className={`flex items-center justify-between gap-3 rounded-lg p-3 ${strong ? "bg-[var(--brand-navy)] text-white" : "bg-[var(--background)]"}`}><span>{label}</span><span className={strong ? "text-[var(--brand-gold)]" : "text-[var(--brand-navy)]"}>{value}</span></div>; }
