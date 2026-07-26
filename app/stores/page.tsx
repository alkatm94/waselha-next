import Link from "next/link";
import { ArrowLeft, Search, ShieldCheck } from "lucide-react";
import { StoreLogo } from "@/components/stores/StoreLogo";

export const metadata = { title: "المتاجر | وصلها لي" };

const stores = [
  { name: "Mercari Japan", href: "/stores/mercari-japan", country: "اليابان", logo: "/images/stores/mercari-japan.png" },
  { name: "Alibaba", href: "/stores", country: "الصين", logo: "/images/stores/alibaba.png" },
  { name: "AliExpress", href: "/stores", country: "الصين", logo: "/images/stores/aliexpress.svg" },
  { name: "Taobao", href: "/stores", country: "الصين", logo: "/images/stores/taobao.png" },
  { name: "1688", href: "/stores", country: "الصين", logo: "/images/stores/1688.png" },
  { name: "Goofish", href: "/stores", country: "الصين", logo: "/images/stores/goofish.png" },
  { name: "Amazon", href: "/stores", country: "عالمي", logo: "/images/stores/amazon.png" },
  { name: "eBay", href: "/stores", country: "عالمي", logo: "/images/stores/ebay.png" },
] as const;

export default function StoresPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border)] bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6"><Link href="/" className="text-2xl font-bold text-[var(--brand-navy)]">وصلها لي</Link><Link href="/account/orders" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--brand-navy)]">طلباتي</Link></div></header>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="max-w-3xl"><p className="text-sm font-bold text-[var(--brand-gold-dark)]">المتاجر المدعومة</p><h1 className="mt-2 text-3xl font-bold leading-tight text-[var(--brand-navy)] sm:text-5xl">اختر المتجر واطلبه عن طريق وصلها لي</h1><p className="mt-4 text-base font-medium leading-8 text-[var(--text-secondary)]">أرسل رابط المنتج من المتجر الذي تفضله، وسيقوم فريق وصلها لي بمراجعة التوفر والسعر والرسوم قبل أي دفع.</p></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stores.map((store) => <Link key={store.name} href={store.href} className="group flex min-w-0 flex-col rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm transition hover:border-[var(--brand-gold)] hover:shadow-lg"><StoreLogo src={store.logo} name={store.name} /><div className="mt-5 flex items-start justify-between gap-4"><div className="min-w-0"><h2 className="truncate text-xl font-bold text-[var(--brand-navy)]">{store.name}</h2><p className="mt-1 text-sm font-bold text-[var(--text-secondary)]">{store.country}</p></div><ArrowLeft className="mt-1 h-5 w-5 shrink-0 text-[var(--text-secondary)] transition group-hover:-translate-x-1 group-hover:text-[var(--brand-gold-dark)]" /></div><div className="mt-auto flex flex-wrap gap-2 pt-5"><span className="inline-flex items-center gap-1 rounded-full bg-[var(--info-bg)] px-3 py-1 text-xs font-bold text-[var(--info)]"><Search className="h-3.5 w-3.5" />إرسال رابط</span><span className="inline-flex items-center gap-1 rounded-full bg-[var(--success-bg)] px-3 py-1 text-xs font-bold text-[var(--success)]"><ShieldCheck className="h-3.5 w-3.5" />مراجعة قبل الدفع</span></div></Link>)}
        </div>
      </section>
    </main>
  );
}