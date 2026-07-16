import Link from "next/link";
import { AlertTriangle, Clock, PackagePlus } from "lucide-react";
import { DashboardShell } from "@/components/account/DashboardShell";
import { ChinaAddressCard, CustomerIdCard } from "@/components/account/ChinaAddressCard";
import { requireCustomer } from "@/lib/auth";
import { getCustomerShipmentStats } from "@/lib/shipments";
import { getChinaWarehouseSettings } from "@/lib/warehouse";

export const dynamic = "force-dynamic";
export const metadata = { title: "عنواني في الصين | وصلها لي" };

export default async function ChinaAddressPage() {
  const customer = await requireCustomer();
  const [warehouse, stats] = await Promise.all([getChinaWarehouseSettings(), getCustomerShipmentStats(customer.id)]);
  const recipientName = `${warehouse.recipientName} - ${customer.customerId}`;
  const fields = [
    { label: "اسم المستلم", value: recipientName, dir: "ltr" as const },
    { label: "رقم الجوال", value: warehouse.phone, dir: "ltr" as const },
    { label: "العنوان بالصيني", value: warehouse.chineseAddress, dir: "ltr" as const },
    { label: "العنوان بالإنجليزي", value: warehouse.englishAddress, dir: "ltr" as const },
    { label: "المدينة", value: warehouse.city, dir: "ltr" as const },
    { label: "المقاطعة", value: warehouse.province, dir: "ltr" as const },
  ];
  const fullAddress = fields.map((field) => `${field.label}: ${field.value}`).join("\n");
  const steps = [
    "انسخ اسم المستلم كما هو، وتأكد من وجود Customer ID بعد اسم David.",
    "ضع رقم الجوال والعنوان الصيني أو الإنجليزي في صفحة الشحن لدى المتجر.",
    "بعد شحن الطلب من المتجر، سجّل رقم التتبع المحلي من صفحة تسجيل شحنة قادمة.",
    "تابع حالة كل شحنة من صفحة شحناتي بعد تسجيلها.",
  ];

  return (
    <DashboardShell customer={customer} stats={stats} active="address" title="عنواني في الصين" description="استخدم بيانات المستودع عند الشراء بنفسك من المتاجر الصينية، ثم سجّل الشحنة القادمة برقم التتبع المحلي.">
      <div className="grid gap-6">
        <CustomerIdCard customerId={customer.customerId} />

        <div className="flex items-start gap-3 rounded-lg border border-[var(--danger-bg)] bg-[var(--danger-bg)] p-4 text-[var(--danger)]">
          <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
          <p className="text-sm font-bold leading-7">تنبيه مهم: عدم كتابة Customer ID داخل اسم المستلم قد يؤدي إلى تأخر التعرف على الشحنة عند وصولها للمستودع.</p>
        </div>

        <ChinaAddressCard fields={fields} fullAddress={fullAddress} />

        <section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-bold text-[var(--brand-gold-dark)]">دليل سريع</p>
              <h2 className="mt-1 text-2xl font-bold text-[var(--brand-navy)]">كيف تستخدم عنوانك في الصين؟</h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/account/china-address/shipments/new" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--brand-gold)] px-5 text-sm font-bold text-[var(--brand-navy)]">
                <PackagePlus className="h-4 w-4" />تسجيل شحنة قادمة
              </Link>
              <Link href="/account/shipments" className="inline-flex h-12 items-center justify-center rounded-lg border border-[var(--border)] bg-white px-5 text-sm font-bold text-[var(--brand-navy)]">
                عرض شحناتي
              </Link>
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {steps.map((step, index) => (
              <div key={step} className="flex gap-3 rounded-lg bg-[var(--background)] p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--brand-navy)] text-sm font-bold text-[var(--brand-gold)]">{index + 1}</span>
                <p className="text-[15px] font-semibold leading-7 text-[var(--text-primary)]">{step}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)]"><Clock className="h-4 w-4" />الدفع الإلكتروني والتجميع وإشعارات واتساب غير مفعّلة في هذه المرحلة.</p>
        </section>
      </div>
    </DashboardShell>
  );
}
