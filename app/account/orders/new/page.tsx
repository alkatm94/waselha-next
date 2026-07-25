import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Send } from "lucide-react";
import { DashboardShell } from "@/components/account/DashboardShell";
import { requireCustomer } from "@/lib/auth";
import { getCustomerShipmentStats } from "@/lib/shipments";
import { createPurchaseOrder } from "@/lib/purchase-orders";

export const dynamic = "force-dynamic";
export const metadata = { title: "طلب شراء جديد | وصلها لي" };

type SearchParams = Promise<{ error?: string; storeName?: string; productUrl?: string; productName?: string; notes?: string }>;

export default async function NewPurchaseOrderPage({ searchParams }: { searchParams: SearchParams }) {
  const customer = await requireCustomer("/account/orders/new");
  const [params, stats] = await Promise.all([searchParams, getCustomerShipmentStats(customer.id)]);

  async function createAction(formData: FormData) {
    "use server";
    const activeCustomer = await requireCustomer("/account/orders/new");
    let orderNumber = "";
    try {
      const order = await createPurchaseOrder(activeCustomer, formData);
      orderNumber = order.orderNumber;
    } catch (error) {
      const message = error instanceof Error ? error.message : "تعذر إرسال طلب الشراء.";
      redirect(`/account/orders/new?error=${encodeURIComponent(message)}`);
    }
    redirect(`/account/orders/${orderNumber}`);
  }

  return (
    <DashboardShell customer={customer} stats={stats} active="new-order" title="طلب شراء جديد" description="أرسل رابط المنتج والخيارات المطلوبة، وسيقوم فريق وصلها لي بمراجعته وإصدار عرض السعر.">
      {params.error && <p className="mb-5 rounded-lg bg-[var(--danger-bg)] p-4 text-sm font-bold text-[var(--danger)]">{params.error}</p>}

      <form action={createAction} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="grid gap-5">
          <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-[var(--brand-navy)]">معلومات المنتج</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold md:col-span-2">رابط المنتج<input name="productUrl" type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" required placeholder="https://..." defaultValue={params.productUrl || ""} className="input latin-text" dir="ltr" /></label>
              <label className="grid gap-2 text-sm font-bold">اسم المنتج<input name="productName" required defaultValue={params.productName || ""} className="input" /></label>
              <label className="grid gap-2 text-sm font-bold">المتجر<input name="storeName" required defaultValue={params.storeName || ""} className="input" /></label>
              <label className="grid gap-2 text-sm font-bold">اللون أو المقاس<input name="variant" className="input" /></label>
              <label className="grid gap-2 text-sm font-bold">الكمية<input name="quantity" type="number" inputMode="numeric" min="1" step="1" required defaultValue="1" className="input" /></label>
              <label className="grid gap-2 text-sm font-bold">السعر إن كان معروفًا<input name="estimatedProductPrice" type="number" inputMode="decimal" min="0" step="0.01" className="input" /></label>
              <label className="grid gap-2 text-sm font-bold">رابط صورة المنتج<input name="productImageUrl" type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" placeholder="https://..." className="input latin-text" dir="ltr" /></label>
              <label className="grid gap-2 text-sm font-bold md:col-span-2">ملاحظات<textarea name="notes" rows={5} defaultValue={params.notes || ""} className="input h-32 py-3" /></label>
            </div>
          </section>
        </div>

        <aside className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm xl:sticky xl:top-6 xl:p-5">
          <p className="text-sm font-bold text-[var(--brand-gold-dark)]">ملخص الطلب</p>
          <h2 className="mt-1 text-xl font-bold text-[var(--brand-navy)]">بانتظار المراجعة</h2>
          <div className="mt-5 flex gap-2 rounded-lg bg-[var(--warning-bg)] p-3 text-sm font-semibold leading-7 text-[var(--warning)]">
            <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />
            <p>لن يتم تحصيل أي مبلغ الآن. سيصدر فريق الإدارة عرض سعر أولًا.</p>
          </div>
          <button className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-gold)] px-4 text-sm font-bold text-[var(--brand-navy)]"><Send className="h-4 w-4" />إرسال الطلب</button>
          <Link href="/account/orders" className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--border)] px-4 text-sm font-bold text-[var(--brand-navy)]">عرض طلباتي</Link>
        </aside>
      </form>
    </DashboardShell>
  );
}
