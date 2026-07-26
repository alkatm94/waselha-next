import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { requireCustomer } from "@/lib/auth";
import { createPurchaseOrderFromStoreProduct, getPublishedMercariProduct, getPublishedMercariProducts, imageUrlsFromJson } from "@/lib/store-products";
import { ProductGallery } from "@/components/stores/ProductGallery";
import { ProductBuyBox, ProductDescription, ProductHeader, ProductPrice, ProductSpecifications, PurchaseSteps, RelatedProducts, UsedProductNotice, type ProductDetailData } from "@/components/stores/MercariProductDetails";

export const dynamic = "force-dynamic";
export const metadata = { title: "تفاصيل منتج Mercari Japan | وصلها لي" };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ error?: string }>;

export default async function MercariProductPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();
  const [product, publishedProducts] = await Promise.all([getPublishedMercariProduct(productId), getPublishedMercariProducts()]);
  if (!product) notFound();

  const images = imageUrlsFromJson(product.imageUrlsJson);
  const lastCheckedLabel = product.lastCheckedAt ? product.lastCheckedAt.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }) : null;
  const detailProduct: ProductDetailData = {
    id: product.id, storeName: product.storeName, originalUrl: product.originalUrl, arabicName: product.arabicName,
    originalName: product.originalName, description: product.description, priceJpy: product.priceJpy,
    approxPriceSar: product.approxPriceSar?.toString() || null, category: product.category, brand: product.brand,
    productCondition: product.productCondition, availabilityStatus: product.availabilityStatus, lastCheckedLabel,
  };
  const relatedProducts = publishedProducts.filter((item) => item.id !== product.id && (product.category ? item.category === product.category : true)).slice(0, 4);

  async function orderAction() {
    "use server";
    const activeCustomer = await requireCustomer(`/stores/mercari-japan/${id}`);
    let orderNumber = "";
    try {
      const order = await createPurchaseOrderFromStoreProduct(activeCustomer, productId);
      orderNumber = order.orderNumber;
    } catch (error) {
      const message = error instanceof Error ? error.message : "تعذر إرسال طلب الشراء.";
      redirect(`/stores/mercari-japan/${encodeURIComponent(id)}?error=${encodeURIComponent(message)}`);
    }
    redirect(`/account/orders/${orderNumber}`);
  }

  return (
    <main dir="rtl" className="product-detail-shell min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="mx-auto max-w-[1200px] px-4 py-5 sm:px-6 lg:py-8">
        <nav className="mb-4 flex min-w-0 items-center gap-1.5 overflow-hidden text-sm font-medium text-[var(--color-muted)]" aria-label="Breadcrumb">
          <Link href="/" className="shrink-0 hover:text-[var(--color-primary)]">الرئيسية</Link><ChevronLeft className="h-4 w-4 shrink-0" />
          <Link href="/stores" className="shrink-0 hover:text-[var(--color-primary)]">المتاجر</Link><ChevronLeft className="h-4 w-4 shrink-0" />
          <Link href="/stores/mercari-japan" className="shrink-0 hover:text-[var(--color-primary)]">Mercari Japan</Link><ChevronLeft className="h-4 w-4 shrink-0" />
          <span className="truncate text-[var(--color-primary)]">{product.arabicName}</span>
        </nav>
        {query.error && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{query.error}</p>}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-start xl:gap-8">
          <ProductGallery images={images} productName={product.arabicName} originalUrl={product.originalUrl} />
          <div className="min-w-0">
            <ProductHeader product={detailProduct} />
            <ProductPrice product={detailProduct} />
            <div className="mt-4"><ProductBuyBox product={detailProduct} orderAction={orderAction} /></div>
            <ProductSpecifications product={detailProduct} />
          </div>
        </section>
        <div className="mt-8 grid gap-6">
          <ProductDescription description={product.description} product={detailProduct} />
          <PurchaseSteps />
          <UsedProductNotice />
          <RelatedProducts products={relatedProducts} />
        </div>
      </div>
    </main>
  );
}
