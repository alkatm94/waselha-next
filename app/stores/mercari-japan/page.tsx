import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, PackageSearch, Search } from "lucide-react";
import { formatApproxSar, formatJpy, formatStoreStatus, getPublishedMercariProducts, primaryImage } from "@/lib/store-products";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mercari Japan | وصلها لي" };

type SearchParams = Promise<{ q?: string; category?: string; status?: string }>;

export default async function MercariJapanPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const allProducts = await getPublishedMercariProducts();
  const q = (params.q || "").trim().toLowerCase();
  const category = (params.category || "").trim();
  const filtered = allProducts.filter((product) => {
    const matchesQ = !q || [product.arabicName, product.originalName, product.brand, product.category, product.originalUrl].filter(Boolean).some((value) => String(value).toLowerCase().includes(q));
    const matchesCategory = !category || product.category === category;
    return matchesQ && matchesCategory;
  });
  const categories = Array.from(new Set(allProducts.map((product) => product.category).filter(Boolean))) as string[];

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/stores" className="text-sm font-bold text-[var(--brand-navy)]">المتاجر</Link>
            <h1 className="mt-1 text-3xl font-bold text-[var(--brand-navy)]">Mercari Japan</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-[var(--text-secondary)]">منتجات مختارة من كتالوج وصلها لي. التوفر والسعر يخضعان للتحقق قبل تأكيد الطلب.</p>
          </div>
          <Link href="/account/orders/new?storeName=Mercari%20Japan" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--brand-gold)] px-4 text-sm font-bold text-[var(--brand-navy)]"><PackageSearch className="h-4 w-4" />إرسال رابط منتج Mercari</Link>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex gap-3 rounded-lg border border-[var(--warning-bg)] bg-[var(--warning-bg)] p-4 text-sm font-bold leading-7 text-[var(--warning)]"><AlertTriangle className="mt-1 h-5 w-5 shrink-0" /><p>تنبيه: توفر المنتج والسعر النهائي يخضعان للتحقق من فريق وصلها لي قبل تأكيد الطلب أو الشراء.</p></div>
        <form className="grid gap-3 rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_240px_auto]">
          <label className="relative block"><Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" /><input name="q" defaultValue={params.q || ""} placeholder="بحث باسم المنتج، الماركة أو التصنيف" className="input pr-11" /></label>
          <select name="category" defaultValue={category} className="input"><option value="">كل التصنيفات</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <button className="h-[46px] rounded-lg bg-[var(--brand-navy)] px-5 text-sm font-bold text-white">بحث</button>
        </form>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filtered.map((product) => {
            const image = primaryImage(product.imageUrlsJson);
            return <Link key={product.id} href={`/stores/mercari-japan/${product.id}`} className="group overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-sm transition hover:border-[var(--brand-gold)] hover:shadow-lg">
              <div className="relative aspect-square bg-[var(--surface-muted)]">{image ? <Image src={image} alt={product.arabicName} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" unoptimized /> : <div className="grid h-full place-items-center text-sm font-bold text-[var(--text-secondary)]">لا توجد صورة</div>}</div>
              <div className="p-4"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-[var(--success-bg)] px-2.5 py-1 text-xs font-bold text-[var(--success)]">{formatStoreStatus(product.availabilityStatus)}</span>{product.productCondition && <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-bold text-[var(--text-secondary)]">{product.productCondition}</span>}</div><h2 className="mt-3 line-clamp-2 min-h-14 text-base font-bold leading-7 text-[var(--brand-navy)]">{product.arabicName}</h2><p className="mt-3 text-xl font-bold text-[var(--brand-navy)]">{formatJpy(product.priceJpy)}</p><p className="text-sm font-bold text-[var(--brand-gold-dark)]">{formatApproxSar(product.approxPriceSar)}</p></div>
            </Link>;
          })}
        </div>
        {filtered.length === 0 && <div className="mt-6 rounded-lg border border-[var(--border)] bg-white p-8 text-center shadow-sm"><h2 className="text-2xl font-bold text-[var(--brand-navy)]">لا توجد منتجات منشورة حاليًا</h2><p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-7 text-[var(--text-secondary)]">يمكنك إرسال رابط منتج Mercari يدويًا وسنراجعه لك.</p><Link href="/account/orders/new?storeName=Mercari%20Japan" className="mt-5 inline-flex h-12 items-center justify-center rounded-lg bg-[var(--brand-gold)] px-5 text-sm font-bold text-[var(--brand-navy)]">إرسال رابط منتج Mercari</Link></div>}
      </section>
    </main>
  );
}