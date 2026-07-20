import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, PackagePlus } from "lucide-react";
import { DashboardShell } from "@/components/account/DashboardShell";
import { requireCustomer } from "@/lib/auth";
import { createChinaShipment, getCustomerShipmentStats } from "@/lib/shipments";

export const dynamic = "force-dynamic";
export const metadata = { title: "تسجيل شحنة قادمة | وصلها لي" };

type NewShipmentSearchParams = Promise<{ error?: string }>;

export default async function NewShipmentPage({ searchParams }: { searchParams: NewShipmentSearchParams }) {
  const customer = await requireCustomer("/account/china-address/shipments/new");
  const [params, stats] = await Promise.all([searchParams, getCustomerShipmentStats(customer.id)]);

  async function createShipmentAction(formData: FormData) {
    "use server";
    const activeCustomer = await requireCustomer("/account/china-address/shipments/new");
    let reference = "";
    try {
      const shipment = await createChinaShipment(activeCustomer, formData);
      reference = shipment.internalReference;
    } catch (error) {
      const message = error instanceof Error ? error.message : "تعذر تسجيل الشحنة.";
      redirect(`/account/china-address/shipments/new?error=${encodeURIComponent(message)}`);
    }
    redirect(`/account/shipments/${reference}`);
  }

  return (
    <DashboardShell customer={customer} stats={stats} active="new-shipment" title="تسجيل شحنة قادمة" description="أدخل بيانات المنتج ورقم التتبع المحلي داخل الصين. سنربط الشحنة بحسابك ورقم العميل تلقائيًا.">
      {params.error && <p className="mb-5 rounded-lg bg-[var(--danger-bg)] p-4 text-sm font-bold text-[var(--danger)]">{params.error}</p>}

      <form id="new-shipment-form" action={createShipmentAction} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="grid gap-5">
          <FormSection step="1" title="معلومات المنتج" description="اكتب الاسم والمتجر والسعر كما تظهر في طلب الشراء.">
            <label className="grid gap-2 text-sm font-bold">اسم المنتج<input name="productName" required className="input" /></label>
            <label className="grid gap-2 text-sm font-bold">رابط المنتج<input name="productUrl" type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" required placeholder="https://..." className="input latin-text" dir="ltr" /></label>
            <label className="grid gap-2 text-sm font-bold">اسم المتجر<input name="storeName" required className="input" /></label>
            <label className="grid gap-2 text-sm font-bold">الكمية<input name="quantity" type="number" inputMode="numeric" min="1" step="1" required defaultValue="1" className="input" /></label>
            <label className="grid gap-2 text-sm font-bold">سعر المنتج<input name="productPrice" type="number" inputMode="decimal" min="0.01" step="0.01" required className="input" /></label>
            <label className="grid gap-2 text-sm font-bold">العملة<select name="currency" required defaultValue="CNY" className="input"><option value="CNY">CNY</option><option value="USD">USD</option><option value="SAR">SAR</option><option value="HKD">HKD</option></select></label>
          </FormSection>

          <FormSection step="2" title="بيانات الشحن المحلي" description="رقم التتبع المحلي هو الأساس في متابعة وصول الشحنة للمستودع.">
            <label className="grid gap-2 text-sm font-bold md:col-span-2">رقم التتبع داخل الصين<input name="localTrackingNumber" autoCapitalize="none" autoCorrect="off" required className="input latin-text" dir="ltr" /></label>
            <label className="grid gap-2 text-sm font-bold">شركة الشحن المحلية إن عرفت<input name="localCarrier" className="input" /></label>
            <label className="grid gap-2 text-sm font-bold">تاريخ الشحن المتوقع إن توفر<input name="expectedShipDate" type="date" className="input latin-text" dir="ltr" /></label>
          </FormSection>

          <FormSection step="3" title="الملفات والملاحظات" description="رفع الملفات الفعلي يحتاج تخزين ملفات، لذلك أبقينا رابط الفاتورة الحالي دون تغيير منطق النظام.">
            <label className="grid gap-2 text-sm font-bold">صورة المنتج<input type="file" accept="image/*" disabled className="input cursor-not-allowed bg-[var(--surface-muted)] text-[var(--text-secondary)]" /></label>
            <label className="grid gap-2 text-sm font-bold">رابط صورة الفاتورة اختياري<input name="invoiceImageUrl" type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" placeholder="https://..." className="input latin-text" dir="ltr" /></label>
            <p className="rounded-lg bg-[var(--info-bg)] p-3 text-sm font-semibold leading-7 text-[var(--info)] md:col-span-2">رفع الملفات المباشر غير مفعّل في البنية الحالية. عند إضافة تخزين ملفات، يمكن تحويل هذا الحقل إلى رفع فعلي بدون تغيير تجربة المستخدم.</p>
            <label className="grid gap-2 text-sm font-bold md:col-span-2">ملاحظات<textarea name="notes" rows={5} className="input h-32 py-3" /></label>
          </FormSection>
        </div>

        <aside className="order-last rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm xl:sticky xl:top-6 xl:order-none xl:p-5">
          <p className="text-sm font-bold text-[var(--brand-gold-dark)]">ملخص التسجيل</p>
          <h2 className="mt-1 text-xl font-bold text-[var(--brand-navy)] sm:text-2xl">قبل الإرسال</h2>
          <div className="mt-5 grid gap-3 text-sm font-semibold text-[var(--text-secondary)]">
            <SummaryRow label="Customer ID" value={customer.customerId} />
            <SummaryRow label="الحالة الابتدائية" value="تم تسجيل الشحنة" />
            <div className="flex gap-2 rounded-lg bg-[var(--warning-bg)] p-3 text-[var(--warning)]">
              <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />
              <p>راجع رقم التتبع قبل الإرسال. لن يمكن تسجيله مرتين في حسابك.</p>
            </div>
          </div>
          <button className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-gold)] px-4 text-sm font-bold text-[var(--brand-navy)] sm:h-12"><PackagePlus className="h-4 w-4" />تسجيل الشحنة</button>
          <Link href="/account/shipments" className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--border)] px-4 text-sm font-bold text-[var(--brand-navy)]">عرض شحناتي</Link>
        </aside>
      </form>
    </DashboardShell>
  );
}

function FormSection({ step, title, description, children }: { step: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--brand-navy)] text-sm font-bold text-[var(--brand-gold)]">{step}</span>
        <div>
          <h2 className="text-xl font-bold text-[var(--brand-navy)] sm:text-2xl">{title}</h2>
          <p className="mt-1 text-sm font-medium leading-7 text-[var(--text-secondary)]">{description}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-lg bg-[var(--background)] p-3"><span>{label}</span><span className="font-bold text-[var(--brand-navy)] latin-text" dir="ltr">{value}</span></div>;
}

