import Link from "next/link";
import { PackageSearch, Plus, Search, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { STORE_PRODUCT_STATUSES, formatApproxSar, formatJpy, formatStoreStatus, getAdminStoreProducts, primaryImage } from "@/lib/store-products";
import Image from "next/image";

export const dynamic = "force-dynamic";
export const metadata = { title: "منتجات المتاجر | وصلها لي" };

type SearchParams = Promise<{ q?: string; status?: string; deleted?: string }>;

export default async function AdminStoreProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const products = await getAdminStoreProducts({ q: params.q, status: params.status });

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div><Link href="/admin" className="text-sm font-bold text-[var(--brand-navy)]">لوحة الإدارة</Link><h1 className="mt-1 text-2xl font-bold text-[var(--brand-navy)]">منتجات المتاجر</h1></div>
          <div className="flex flex-wrap items-center gap-3"><Link href="/admin/store-products/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--brand-gold)] px-4 text-sm font-bold text-[var(--brand-navy)]"><Plus className="h-4 w-4" />إضافة منتج</Link><AdminNotificationBell adminId={admin.id} /><span className="inline-flex items-center gap-2 rounded-lg bg-[var(--info-bg)] px-3 py-2 text-sm font-bold text-[var(--info)]"><ShieldCheck className="h-4 w-4" />{admin.name}</span></div>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {params.deleted && <p className="mb-4 rounded-lg bg-[var(--success-bg)] p-3 text-sm font-bold text-[var(--success)]">تم حذف المنتج.</p>}
        <form className="grid gap-3 rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_220px_auto]">
          <label className="relative block"><Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" /><input name="q" defaultValue={params.q || ""} placeholder="بحث بالاسم، الرابط، الماركة أو التصنيف" className="input pr-11" /></label>
          <select name="status" defaultValue={params.status || ""} className="input"><option value="">كل الحالات</option>{STORE_PRODUCT_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
          <button className="h-[46px] rounded-lg bg-[var(--brand-navy)] px-5 text-sm font-bold text-white">بحث</button>
        </form>
        <div className="mt-6 grid gap-4">
          {products.map((product) => {
            const image = primaryImage(product.imageUrlsJson);
            return <article key={product.id} className="grid gap-4 rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm lg:grid-cols-[96px_minmax(0,1fr)_auto] lg:items-center">
              <div className="relative hidden aspect-square overflow-hidden rounded-lg bg-[var(--surface-muted)] lg:block">{image ? <Image src={image} alt={product.arabicName} fill className="object-cover" unoptimized /> : <PackageSearch className="m-auto mt-8 h-8 w-8 text-[var(--text-secondary)]" />}</div>
              <div className="min-w-0"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-[var(--info-bg)] px-3 py-1 text-xs font-bold text-[var(--info)]">{formatStoreStatus(product.availabilityStatus)}</span>{product.isFeatured && <span className="rounded-full bg-[var(--warning-bg)] px-3 py-1 text-xs font-bold text-[var(--warning)]">مميز</span>}</div><h2 className="mt-2 line-clamp-2 text-lg font-bold text-[var(--brand-navy)]">{product.arabicName}</h2><div className="mt-2 grid gap-2 text-sm font-semibold text-[var(--text-secondary)] md:grid-cols-4"><span>{product.storeName}</span><span>{formatJpy(product.priceJpy)}</span><span>{formatApproxSar(product.approxPriceSar)}</span><span>{product.lastCheckedAt ? product.lastCheckedAt.toLocaleDateString("ar-SA") : "لم يتحقق"}</span></div></div>
              <Link href={`/admin/store-products/${product.id}/edit`} className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--brand-gold)] px-4 text-sm font-bold text-[var(--brand-navy)]">تعديل</Link>
            </article>;
          })}
          {products.length === 0 && <p className="rounded-lg border border-[var(--border)] bg-white p-6 text-center text-sm font-bold text-[var(--text-secondary)]">لا توجد منتجات.</p>}
        </div>
      </section>
    </main>
  );
}