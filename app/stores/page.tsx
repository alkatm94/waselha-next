import Link from "next/link";
import { ArrowLeft, Search, ShieldCheck, Store } from "lucide-react";

export const metadata = { title: "المتاجر | وصلها لي" };

const stores = [
  {
    name: "Mercari Japan",
    href: "/stores/mercari-japan",
    country: "اليابان",
    status: "متاح كبداية تجريبية بمزود بيانات حقيقي",
    description: "تصفح منتجات Mercari Japan، ثم أرسل المنتج لفريق وصلها لي لمراجعة التوفر والسعر والرسوم قبل أي دفع.",
  },
];

export default function StoresPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Link href="/" className="text-2xl font-bold text-[var(--brand-navy)]">وصلها لي</Link>
          <Link href="/account/orders" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--brand-navy)]">طلباتي</Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="max-w-3xl">
          <p className="text-sm font-bold text-[var(--brand-gold-dark)]">المتاجر المدعومة</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-[var(--brand-navy)] sm:text-5xl">اختر المتجر واطلبه عن طريق وصلها لي</h1>
          <p className="mt-4 text-base font-medium leading-8 text-[var(--text-secondary)]">
            هذه الصفحات تعرض بيانات من مزود موثوق عند الربط، ولا تستخدم بيانات وهمية في الإنتاج. الطلبات تنتقل إلى مراجعة الإدارة قبل إصدار السعر النهائي.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stores.map((store) => (
            <Link key={store.name} href={store.href} className="group rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm transition hover:border-[var(--brand-gold)] hover:shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-[var(--brand-navy)] text-[var(--brand-gold)]"><Store className="h-6 w-6" /></span>
                <ArrowLeft className="h-5 w-5 text-[var(--text-secondary)] transition group-hover:-translate-x-1 group-hover:text-[var(--brand-gold-dark)]" />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-[var(--brand-navy)]">{store.name}</h2>
              <p className="mt-1 text-sm font-bold text-[var(--text-secondary)]">{store.country}</p>
              <p className="mt-4 text-sm font-semibold leading-7 text-[var(--text-primary)]">{store.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--info-bg)] px-3 py-1 text-xs font-bold text-[var(--info)]"><Search className="h-3.5 w-3.5" />بحث وفلاتر</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success-bg)] px-3 py-1 text-xs font-bold text-[var(--success)]"><ShieldCheck className="h-3.5 w-3.5" />{store.status}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
