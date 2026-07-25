import Link from "next/link";
import { notFound } from "next/navigation";
import { EditStoreProductForm } from "@/components/admin/StoreProductForm";
import { hideStoreProductAction, deleteStoreProductAction, markStoreProductAvailableAction, markStoreProductSoldAction } from "@/app/admin/store-products/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminStoreProduct } from "@/lib/store-products";

export const dynamic = "force-dynamic";
export const metadata = { title: "تعديل منتج متجر | وصلها لي" };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ saved?: string; created?: string; hidden?: string; published?: string; sold?: string }>;

export default async function EditStoreProductPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();
  const product = await getAdminStoreProduct(productId);
  if (!product) notFound();

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border)] bg-white"><div className="mx-auto max-w-7xl px-4 py-5 sm:px-6"><Link href="/admin/store-products" className="text-sm font-bold text-[var(--brand-navy)]">منتجات المتاجر</Link><h1 className="mt-1 text-2xl font-bold text-[var(--brand-navy)]">تعديل المنتج</h1></div></header>
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {(query.saved || query.created || query.hidden || query.published || query.sold) && <p className="mb-4 rounded-lg bg-[var(--success-bg)] p-3 text-sm font-bold text-[var(--success)]">تم حفظ التحديث.</p>}
        <EditStoreProductForm product={product} />
        <div className="mt-5 flex flex-wrap gap-3 rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
          <form action={markStoreProductAvailableAction}><input type="hidden" name="id" value={product.id} /><button className="h-11 rounded-lg bg-[var(--success)] px-4 text-sm font-bold text-white">تعيين متوفر</button></form>
          <form action={markStoreProductSoldAction}><input type="hidden" name="id" value={product.id} /><button className="h-11 rounded-lg bg-[var(--warning)] px-4 text-sm font-bold text-white">تعيين مباع</button></form>
          <form action={hideStoreProductAction}><input type="hidden" name="id" value={product.id} /><button className="h-11 rounded-lg border border-[var(--border)] px-4 text-sm font-bold text-[var(--brand-navy)]">إخفاء المنتج</button></form>
          <form action={deleteStoreProductAction}><input type="hidden" name="id" value={product.id} /><button className="h-11 rounded-lg bg-[var(--danger)] px-4 text-sm font-bold text-white">حذف المنتج</button></form>
        </div>
      </section>
    </main>
  );
}