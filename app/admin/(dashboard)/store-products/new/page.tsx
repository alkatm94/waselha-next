import Link from "next/link";
import { redirect } from "next/navigation";
import { NewStoreProductForm } from "@/components/admin/StoreProductForm";
import { requireAdmin } from "@/lib/admin-auth";
import { previewStoreProductFromUrl } from "@/lib/store-products";

export const dynamic = "force-dynamic";
export const metadata = { title: "إضافة منتج متجر | وصلها لي" };

type SearchParams = Promise<{ originalUrl?: string; error?: string }>;

export default async function NewStoreProductPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const preview = params.originalUrl ? await previewStoreProductFromUrl(params.originalUrl).catch((error) => ({
    originalUrl: params.originalUrl || "",
    externalProductId: "",
    arabicName: "",
    originalName: "",
    description: "",
    priceJpy: "",
    approxPriceSar: "",
    originalPrice: "",
    originalCurrency: "",
    priceSource: "",
    itemKind: "MARKETPLACE",
    variantId: "",
    sourceAvailabilityStatus: "NEEDS_REVIEW",
    imageUrls: "",
    category: "",
    brand: "",
    productCondition: "",
    availabilityStatus: "NEEDS_REVIEW" as const,
    isFeatured: false,
    displayOrder: "0",
    lastCheckedAt: new Date().toISOString().slice(0, 16),
    fetchNotice: error instanceof Error ? error.message : "فشل الجلب التلقائي. أدخل البيانات يدويًا.",
  })) : null;

  async function previewAction(formData: FormData) {
    "use server";
    const originalUrl = String(formData.get("originalUrl") || "").trim();
    if (!originalUrl) redirect("/admin/store-products/new?error=missing-url");
    redirect(`/admin/store-products/new?originalUrl=${encodeURIComponent(originalUrl)}`);
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border)] bg-white"><div className="mx-auto max-w-7xl px-4 py-5 sm:px-6"><Link href="/admin/store-products" className="text-sm font-bold text-[var(--brand-navy)]">منتجات المتاجر</Link><h1 className="mt-1 text-2xl font-bold text-[var(--brand-navy)]">إضافة منتج Mercari</h1></div></header>
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <form action={previewAction} className="mb-6 grid gap-3 rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_auto]"><input name="originalUrl" type="url" required defaultValue={params.originalUrl || ""} placeholder="الصق رابط Mercari الأصلي" className="input latin-text" dir="ltr" /><button className="h-[46px] rounded-lg bg-[var(--brand-navy)] px-5 text-sm font-bold text-white">جلب ومعاينة</button></form>
        {params.error && <p className="mb-4 rounded-lg bg-[var(--danger-bg)] p-3 text-sm font-bold text-[var(--danger)]">أدخل رابط المنتج أولًا.</p>}
        {preview ? <NewStoreProductForm preview={preview} /> : <p className="rounded-lg border border-[var(--border)] bg-white p-6 text-sm font-bold text-[var(--text-secondary)]">الصق الرابط أولًا. لن يتم نشر المنتج إلا بعد مراجعة النموذج وحفظه بحالة متوفر.</p>}
      </section>
    </main>
  );
}