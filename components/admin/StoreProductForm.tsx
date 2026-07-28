import { createStoreProductAction, updateStoreProductAction } from "@/app/admin/store-products/actions";
import { STORE_NAMES, STORE_PRODUCT_STATUSES, imageUrlsFromJson } from "@/lib/store-products";

type ProductLike = {
  id?: number;
  storeName?: string;
  originalUrl?: string;
  externalProductId?: string | null;
  arabicName?: string;
  originalName?: string | null;
  description?: string | null;
  priceJpy?: number | null;
  approxPriceSar?: unknown;
  imageUrlsJson?: string | null;
  category?: string | null;
  brand?: string | null;
  productCondition?: string | null;
  availabilityStatus?: string;
  isFeatured?: boolean;
  displayOrder?: number;
  lastCheckedAt?: Date | string | null;
};

type PreviewLike = {
  originalUrl: string;
  externalProductId: string;
  arabicName: string;
  originalName: string;
  description: string;
  priceJpy: string;
  approxPriceSar: string;
  originalPrice: string;
  originalCurrency: string;
  priceSource: string;
  itemKind: string;
  variantId: string;
  sourceAvailabilityStatus: string;
  imageUrls: string;
  category: string;
  brand: string;
  productCondition: string;
  availabilityStatus: string;
  isFeatured: boolean;
  displayOrder: string;
  lastCheckedAt: string;
  fetchNotice?: string;
};

function dateValue(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function productToDefaults(product?: ProductLike | null, preview?: PreviewLike | null) {
  const imageUrls = product?.imageUrlsJson ? imageUrlsFromJson(product.imageUrlsJson).join("\n") : preview?.imageUrls || "";
  return {
    storeName: product?.storeName || "Mercari Japan",
    originalUrl: product?.originalUrl || preview?.originalUrl || "",
    externalProductId: product?.externalProductId || preview?.externalProductId || "",
    arabicName: product?.arabicName || preview?.arabicName || "",
    originalName: product?.originalName || preview?.originalName || "",
    description: product?.description || preview?.description || "",
    priceJpy: product?.priceJpy?.toString() || preview?.priceJpy || "",
    approxPriceSar: product?.approxPriceSar?.toString() || preview?.approxPriceSar || "",
    originalPrice: preview?.originalPrice || "",
    originalCurrency: preview?.originalCurrency || "",
    priceSource: preview?.priceSource || "",
    itemKind: preview?.itemKind || "",
    variantId: preview?.variantId || "",
    sourceAvailabilityStatus: preview?.sourceAvailabilityStatus || "NEEDS_REVIEW",
    imageUrls,
    category: product?.category || preview?.category || "",
    brand: product?.brand || preview?.brand || "",
    productCondition: product?.productCondition || preview?.productCondition || "",
    availabilityStatus: product?.availabilityStatus || preview?.availabilityStatus || "NEEDS_REVIEW",
    isFeatured: product?.isFeatured ?? preview?.isFeatured ?? false,
    displayOrder: product?.displayOrder?.toString() || preview?.displayOrder || "0",
    lastCheckedAt: dateValue(product?.lastCheckedAt) || preview?.lastCheckedAt || "",
  };
}

export function NewStoreProductForm({ preview }: { preview: PreviewLike }) {
  return <StoreProductFormFields preview={preview} action={createStoreProductAction} submitLabel="حفظ المنتج" />;
}

export function EditStoreProductForm({ product }: { product: ProductLike }) {
  return <StoreProductFormFields product={product} action={updateStoreProductAction} submitLabel="حفظ التعديلات" />;
}

function StoreProductFormFields({ product, preview, action, submitLabel }: { product?: ProductLike | null; preview?: PreviewLike | null; action: (formData: FormData) => Promise<void>; submitLabel: string }) {
  const defaults = productToDefaults(product, preview);
  return (
    <form action={action} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
      {product?.id && <input type="hidden" name="id" value={product.id} />}
      <section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
        {preview?.fetchNotice && <p className="mb-5 rounded-lg bg-[var(--warning-bg)] p-3 text-sm font-bold text-[var(--warning)]">{preview.fetchNotice}</p>}
{preview?.itemKind === "SHOPS" && <div className="mb-5 grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 text-sm sm:grid-cols-2"><p><strong>نوع المنتج:</strong> Mercari Shops</p><p className="latin-text" dir="ltr"><strong>Variant:</strong> {defaults.variantId || "لم يُحدّد"}</p><p><strong>السعر الأصلي:</strong> {defaults.originalPrice ? `${defaults.originalPrice} ${defaults.originalCurrency}` : "غير متاح"}</p><p><strong>مصدر السعر:</strong> {defaults.priceSource || "غير معروف"}</p><p><strong>التوفر في Mercari:</strong> {defaults.sourceAvailabilityStatus}</p>{defaults.originalCurrency && defaults.originalCurrency !== "JPY" && <p className="sm:col-span-2 font-bold text-[var(--warning)]">هذا السعر للمعاينة فقط ولا يُحفظ كسعر بالين، وسيبقى المنتج بحاجة إلى مراجعة.</p>}</div>}
                <h2 className="text-xl font-bold text-[var(--brand-navy)]">بيانات المنتج</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold">المتجر<select name="storeName" defaultValue={defaults.storeName} className="input">{STORE_NAMES.map((store) => <option key={store} value={store}>{store}</option>)}</select></label>
          <label className="grid gap-2 text-sm font-bold">معرف المنتج الخارجي<input name="externalProductId" defaultValue={defaults.externalProductId} className="input latin-text" dir="ltr" /></label>
          <label className="grid gap-2 text-sm font-bold md:col-span-2">رابط المنتج الأصلي<input name="originalUrl" type="url" required defaultValue={defaults.originalUrl} className="input latin-text" dir="ltr" /></label>
          <label className="grid gap-2 text-sm font-bold">الاسم العربي<input name="arabicName" required defaultValue={defaults.arabicName} className="input" /></label>
          <label className="grid gap-2 text-sm font-bold">الاسم الأصلي<input name="originalName" defaultValue={defaults.originalName} className="input" /></label>
          <label className="grid gap-2 text-sm font-bold md:col-span-2">الوصف<textarea name="description" rows={5} defaultValue={defaults.description} className="input h-32 py-3" /></label>
          <label className="grid gap-2 text-sm font-bold">السعر بالين<input name="priceJpy" type="number" min="0" step="1" defaultValue={defaults.priceJpy} className="input" /></label>
          <label className="grid gap-2 text-sm font-bold">السعر التقريبي بالريال<input name="approxPriceSar" type="number" min="0" step="0.01" defaultValue={defaults.approxPriceSar} className="input" /></label>
          <label className="grid gap-2 text-sm font-bold">التصنيف<input name="category" defaultValue={defaults.category} className="input" /></label>
          <label className="grid gap-2 text-sm font-bold">الماركة<input name="brand" defaultValue={defaults.brand} className="input" /></label>
          <label className="grid gap-2 text-sm font-bold">حالة المنتج<input name="productCondition" defaultValue={defaults.productCondition} className="input" /></label>
          <label className="grid gap-2 text-sm font-bold">ترتيب العرض<input name="displayOrder" type="number" step="1" defaultValue={defaults.displayOrder} className="input" /></label>
          <label className="grid gap-2 text-sm font-bold">حالة التوفر<select name="availabilityStatus" defaultValue={defaults.availabilityStatus} className="input">{STORE_PRODUCT_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
          <label className="grid gap-2 text-sm font-bold">تاريخ آخر تحقق<input name="lastCheckedAt" type="datetime-local" defaultValue={defaults.lastCheckedAt} className="input" /></label>
          <label className="grid gap-2 text-sm font-bold md:col-span-2">الصور<textarea name="imageUrls" rows={5} defaultValue={defaults.imageUrls} placeholder="رابط صورة في كل سطر" className="input h-32 py-3 latin-text" dir="ltr" /></label>
        </div>
      </section>

      <aside className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm xl:sticky xl:top-6">
        <p className="text-sm font-bold text-[var(--brand-gold-dark)]">المعاينة قبل النشر</p>
        <h2 className="mt-1 text-xl font-bold text-[var(--brand-navy)]">لا ينشر تلقائيًا</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-[var(--text-secondary)]">اختر حالة التوفر متوفر فقط عندما تريد ظهور المنتج للعملاء. أي حالة أخرى تبقيه خارج الصفحة العامة.</p>
        <label className="mt-5 flex items-center gap-2 rounded-lg bg-[var(--background)] p-3 text-sm font-bold"><input name="isFeatured" type="checkbox" defaultChecked={defaults.isFeatured} />منتج مميز</label>
        <button className="mt-5 h-12 w-full rounded-lg bg-[var(--brand-gold)] px-4 text-sm font-bold text-[var(--brand-navy)]">{submitLabel}</button>
      </aside>
    </form>
  );
}