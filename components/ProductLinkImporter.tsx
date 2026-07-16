"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, ExternalLink, Link2, Loader2, Search, ShieldCheck, ShoppingBag, Tag, Truck } from "lucide-react";
import { detectProductStore, getStoreById, resolveCurrency, type ProductStore, type StoreCountry, type StoreId, type SupportedCurrency } from "@/lib/product-links";

export type ImportedProduct = {
  originalUrl: string;
  normalizedUrl: string;
  storeId: StoreId;
  storeName: string;
  title: string;
  image?: string;
  price?: number;
  currency: SupportedCurrency;
  country: StoreCountry;
  estimatedWeightKg?: number;
};

type ProductPreview = ImportedProduct & {
  finalUrl?: string;
};

type AnalysisStatus = "extracted" | "needs_review" | "unsupported";

type MetadataResponse = {
  ok: boolean;
  status: "recognized" | "needs_review" | "unsupported";
  message?: string;
  product?: ProductPreview;
};

const countryLabels: Record<StoreCountry, string> = {
  china: "الصين",
  japan: "اليابان",
  usa: "أمريكا",
  europe: "أوروبا",
};

const currencyLabels: Record<SupportedCurrency, string> = {
  USD: "دولار أمريكي",
  CNY: "يوان صيني",
  JPY: "ين ياباني",
  EUR: "يورو",
};

export function ProductLinkImporter({ onUseProduct }: { onUseProduct: (product: ImportedProduct) => void }) {
  const [url, setUrl] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<ProductPreview | null>(null);
  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [message, setMessage] = useState("");
  const requestKeyRef = useRef<string | null>(null);

  const detection = useMemo(() => detectProductStore(url), [url]);
  const detectedStore = detection.ok ? detection.store : null;
  const canAnalyze = detection.ok && !loading;
  const inputError = touched && !detection.ok && detection.reason !== "empty";

  async function analyzeLink() {
    setTouched(true);
    setError("");
    setMessage("");
    setPreview(null);
    setStatus(null);

    if (loading || requestKeyRef.current) return;

    if (!detection.ok) {
      setStatus("unsupported");
      setError("الرابط غير صالح أو غير مدعوم.");
      return;
    }

    const requestKey = `${Date.now()}:${detection.originalUrl}`;
    requestKeyRef.current = requestKey;
    setLoading(true);

    try {
      const response = await fetch("/api/product-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalUrl: detection.originalUrl, normalizedUrl: detection.normalizedUrl }),
      });
      const data = (await response.json()) as MetadataResponse;
      if (requestKeyRef.current !== requestKey) return;

      const nextPreview = data.product ? withFallbacks(data.product, detection.store) : createFallbackPreview(detection);
      const extracted = hasExtractedProductData(nextPreview, detection.store);

      setPreview(nextPreview);
      setStatus(extracted ? "extracted" : "needs_review");
      setMessage(
        extracted
          ? "تم استخراج بيانات المنتج. راجع التفاصيل ثم انتقل لحساب التكلفة."
          : "تم التعرّف على المتجر، وتحتاج بيانات المنتج إلى مراجعة يدوية."
      );
    } catch {
      if (requestKeyRef.current !== requestKey) return;
      setPreview(createFallbackPreview(detection));
      setStatus("needs_review");
      setMessage("تم التعرّف على المتجر، وتحتاج بيانات المنتج إلى مراجعة يدوية.");
    } finally {
      if (requestKeyRef.current === requestKey) {
        requestKeyRef.current = null;
        setLoading(false);
      }
    }
  }

  function updateUrl(value: string) {
    setUrl(value);
    setError("");
    setMessage("");
    setPreview(null);
    setStatus(null);
  }

  function useProduct() {
    if (!preview) return;
    onUseProduct({
      originalUrl: preview.originalUrl,
      normalizedUrl: preview.normalizedUrl,
      storeId: preview.storeId,
      storeName: preview.storeName,
      title: preview.title,
      image: preview.image,
      price: preview.price,
      currency: preview.currency,
      country: preview.country,
      estimatedWeightKg: preview.estimatedWeightKg,
    });
  }

  return (
    <section id="product-importer" className="bg-[var(--color-bg)] px-4 pb-10 pt-2 sm:px-6 md:pb-12">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[15px] font-bold text-[var(--color-accent-dark)]">نظام تحليل المنتج</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-[#0F172A] md:text-5xl">ألصق رابط المنتج وشاهد معاينة الطلب</h2>
          <p className="mt-4 text-lg font-medium leading-8 text-[var(--color-muted)]">نقرأ المتجر والعملة والسعر عند توفرها، ثم نجهز المنتج للانتقال إلى حاسبة التكلفة.</p>
        </div>

        <div className="mt-8 rounded-lg border border-[var(--color-border)] bg-white p-3 shadow-2xl shadow-slate-900/10 backdrop-blur md:p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex min-h-[64px] flex-1 items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 transition focus-within:border-[#D6A84F] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(214,168,79,0.18)] md:px-5">
              <Link2 className="h-5 w-5 shrink-0 text-[#9f741b]" />
              <input
                value={url}
                onBlur={() => setTouched(true)}
                onChange={(event) => updateUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && canAnalyze) analyzeLink();
                }}
                placeholder="الصق رابط المنتج من Taobao أو 1688 أو Amazon"
                className="h-14 min-w-0 flex-1 bg-transparent text-right text-base font-bold text-[var(--color-text)] outline-none placeholder:text-[#94A3B8]"
              />
              {detectedStore && <StorePill store={detectedStore} />}
            </div>

            <button
              onClick={analyzeLink}
              disabled={!canAnalyze}
              className="inline-flex h-16 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-8 text-base font-bold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-55 md:min-w-44"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              تحليل الرابط
            </button>
          </div>

          {(inputError || error) && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold leading-7 text-red-700">
              <AlertCircle className="mt-1 h-4 w-4 shrink-0" />
              {error || "الرابط غير صالح أو غير مدعوم."}
            </div>
          )}
        </div>

        {loading && <ProductPreviewSkeleton store={detectedStore} />}

        {!loading && preview && (
          <ProductPreviewCard product={preview} status={status || "needs_review"} message={message} onUseProduct={useProduct} />
        )}
      </div>
    </section>
  );
}

function StorePill({ store }: { store: ProductStore }) {
  return (
    <span className="hidden items-center gap-2 rounded-full border border-[#D6A84F]/25 bg-white px-3 py-2 text-xs font-bold text-[#7a5a15] shadow-sm sm:inline-flex">
      <StoreLogo storeId={store.id} storeName={store.name} compact />
      {store.name}
    </span>
  );
}

function ProductPreviewCard({
  product,
  status,
  message,
  onUseProduct,
}: {
  product: ProductPreview;
  status: AnalysisStatus;
  message: string;
  onUseProduct: () => void;
}) {
  const hasPrice = typeof product.price === "number" && product.price > 0;
  const success = status === "extracted";
  const hasImage = Boolean(product.image);
  const productTitle = isValidProductTitle(product.title, getStoreById(product.storeId) || undefined) ? product.title : "اسم المنتج غير متاح تلقائيًا";

  return (
    <article className="mt-6 overflow-hidden rounded-lg border border-[var(--color-border)] bg-white shadow-2xl shadow-slate-900/10 motion-safe:animate-[productCardIn_420ms_ease-out]">
      <div className="grid gap-0 lg:grid-cols-[minmax(260px,380px)_minmax(0,1fr)]">
        <div className={`bg-[#F3F6F8] p-4 sm:p-5 ${hasImage ? "lg:min-h-[430px]" : "lg:min-h-[240px]"}`}>
          <div className={`flex h-full items-center justify-center rounded-lg border border-slate-900/8 bg-white p-4 shadow-inner shadow-slate-900/4 ${hasImage ? "min-h-[260px]" : "min-h-[150px]"}`}>
            <ProductImage src={product.image} alt={productTitle} storeId={product.storeId} storeName={product.storeName} />
          </div>
        </div>

        <div className="min-w-0 p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <StoreLogo storeId={product.storeId} storeName={product.storeName} />
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--color-muted)]">{product.storeName}</p>
                <h3 className="mt-1 text-2xl font-bold leading-8 text-[#0F172A]">معاينة المنتج</h3>
              </div>
            </div>
            <StatusBadge success={success} />
          </div>

          <div className="pt-5">
            <h4 className="text-2xl font-bold leading-9 text-[var(--color-text)] sm:text-3xl" title={product.title}>{productTitle}</h4>
            <p className="mt-3 max-w-2xl text-[15px] font-semibold leading-7 text-[var(--color-muted)]">
              {message}
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <ProductFact icon={<ShoppingBag className="h-4 w-4" />} label="المتجر" value={product.storeName} />
            <ProductFact icon={<Truck className="h-4 w-4" />} label="الدولة" value={countryLabels[product.country]} />
            <ProductFact icon={<Tag className="h-4 w-4" />} label="العملة" value={`${product.currency} - ${currencyLabels[product.currency]}`} />
            <ProductFact label="السعر" value={hasPrice ? formatOriginalPrice(product.price || 0, product.currency) : "غير متاح تلقائيًا"} highlight={hasPrice} />
            <ProductFact label="الوزن" value={product.estimatedWeightKg ? `${product.estimatedWeightKg} KG` : "يحدد بعد المراجعة"} />
            <ProductFact label="طريقة المراجعة" value={success ? "آلية + مراجعة نهائية" : "مراجعة يدوية"} />
          </div>

          <div className={`mt-5 flex items-start gap-3 rounded-lg border p-4 text-[15px] font-bold leading-7 ${success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-[#8A641C]"}`}>
            {success ? <CheckCircle2 className="mt-1 h-5 w-5 shrink-0" /> : <ShieldCheck className="mt-1 h-5 w-5 shrink-0" />}
            <span>{success ? "تم استخراج بيانات المنتج. السعر النهائي يرسل بعد مراجعة التوفر والشحن." : "تم التعرّف على المتجر، وتحتاج بيانات المنتج إلى مراجعة يدوية."}</span>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button onClick={onUseProduct} className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-8 text-base font-bold text-[var(--color-primary-dark)] shadow-lg shadow-[#F2C66D]/25 transition hover:-translate-y-0.5 hover:bg-[var(--color-accent-dark)] sm:flex-none sm:min-w-64">
              احسب التكلفة
              <ArrowLeft className="h-5 w-5" />
            </button>
            <a href={product.normalizedUrl || product.originalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-14 items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-6 text-sm font-bold text-[var(--color-primary)] transition hover:border-[var(--color-accent)]">
              <ExternalLink className="h-4 w-4" />
              فتح صفحة المنتج
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

function ProductPreviewSkeleton({ store }: { store: ProductStore | null }) {
  return (
    <article className="mt-6 overflow-hidden rounded-lg border border-[var(--color-border)] bg-white shadow-2xl shadow-slate-900/10">
      <div className="grid gap-0 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]">
        <div className="bg-[#F3F6F8] p-4 sm:p-5 lg:min-h-[430px]">
          <div className="flex h-full min-h-[260px] items-center justify-center rounded-lg border border-slate-900/8 bg-white p-4">
            <div className="h-44 w-44 animate-pulse rounded-lg bg-slate-200" />
          </div>
        </div>
        <div className="p-5 sm:p-6 lg:p-7">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-5">
            <div className="flex items-center gap-3">
              {store ? <StoreLogo storeId={store.id} storeName={store.name} /> : <div className="h-14 w-14 animate-pulse rounded-lg bg-slate-200" />}
              <div className="space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
            <div className="h-9 w-36 animate-pulse rounded-full bg-slate-200" />
          </div>
          <div className="mt-6 space-y-3">
            <div className="h-8 w-11/12 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-lg bg-slate-100" />)}
          </div>
          <div className="mt-6 flex items-center gap-3 text-sm font-bold text-[#8A641C]">
            <Loader2 className="h-5 w-5 animate-spin" />
            جارٍ تحليل رابط المنتج...
          </div>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ success }: { success: boolean }) {
  return (
    <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${success ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-[#8A641C]"}`}>
      {success ? <CheckCircle2 className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
      {success ? "تم استخراج بيانات المنتج" : "تم التعرّف على المتجر وتحتاج البيانات إلى مراجعة"}
    </span>
  );
}

function ProductImage({ src, alt, storeId, storeName }: { src?: string; alt: string; storeId: StoreId; storeName: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <ProductPlaceholder storeId={storeId} storeName={storeName} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onError={() => setFailed(true)} className="max-h-[320px] w-full rounded-lg object-contain" />
  );
}

function ProductPlaceholder({ storeId, storeName }: { storeId: StoreId; storeName: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <StoreLogo storeId={storeId} storeName={storeName} />
      <p className="mt-3 text-sm font-bold text-[var(--color-muted)]">صورة المنتج غير متاحة</p>
    </div>
  );
}

function StoreLogo({ storeId, storeName, compact = false, large = false }: { storeId: StoreId; storeName: string; compact?: boolean; large?: boolean }) {
  const store = getStoreById(storeId);
  const label = store?.icon || storeName.slice(0, 2).toUpperCase();
  const palette = getStorePalette(storeId);
  const size = large ? "h-24 w-24 text-2xl" : compact ? "h-6 w-6 text-[10px]" : "h-14 w-14 text-base";

  return <span className={`grid shrink-0 place-items-center rounded-lg font-black shadow-sm ${size} ${palette}`}>{label}</span>;
}

function ProductFact({ icon, label, value, highlight = false }: { icon?: ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-900/10 bg-[#F7F8FA] p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-[var(--color-muted)]">{icon}{label}</p>
      <p className={`mt-2 text-base font-bold leading-7 ${highlight ? "text-[var(--color-primary)]" : "text-[var(--color-text)]"}`}>{value}</p>
    </div>
  );
}

function createFallbackPreview(detection: Extract<ReturnType<typeof detectProductStore>, { ok: true }>): ProductPreview {
  return {
    originalUrl: detection.originalUrl,
    normalizedUrl: detection.normalizedUrl,
    storeId: detection.store.id,
    storeName: detection.store.name,
    title: "اسم المنتج غير متاح تلقائيًا",
    currency: detection.store.defaultCurrency,
    country: detection.store.defaultCountry,
  };
}

function withFallbacks(product: ProductPreview, store: ProductStore): ProductPreview {
  return {
    ...product,
    originalUrl: product.originalUrl || "",
    normalizedUrl: product.normalizedUrl || product.originalUrl || "",
    title: isValidProductTitle(product.title, store) ? product.title : "اسم المنتج غير متاح تلقائيًا",
    storeId: product.storeId || store.id,
    storeName: product.storeName || store.name,
    currency: resolveCurrency(store, product.currency),
    country: product.country || store.defaultCountry,
  };
}

function hasExtractedProductData(product: ProductPreview, store?: ProductStore) {
  return Boolean(product.image || product.price || isValidProductTitle(product.title, store));
}

function isValidProductTitle(title?: string, store?: ProductStore) {
  const value = String(title || "").trim();
  if (!value || value === "اسم المنتج غير متاح تلقائيًا") return false;
  if (store && value === `منتج من ${store.name}`) return false;
  if (value.length < 6) return false;

  const normalized = value.toLowerCase();
  const genericPatterns = [
    /login|sign in|signin|register|account|passport|auth|captcha|verification/,
    /taobao|tmall|goofish|xianyu|1688|alibaba|aliexpress/,
    /闲鱼|淘宝|天猫|登录|登入|注册|验证码|验证|账户|账号|安全验证/,
    /الرئيسية|تسجيل الدخول|إنشاء حساب|تحقق|رمز التحقق/,
  ];

  return !genericPatterns.some((pattern) => pattern.test(normalized));
}

function formatOriginalPrice(value: number, currency: SupportedCurrency) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)} ${currency}`;
}

function getStorePalette(storeId: StoreId) {
  switch (storeId) {
    case "amazon":
      return "bg-[#111827] text-[#F59E0B]";
    case "ebay":
      return "bg-[#F8FAFC] text-[#2563EB] border border-slate-200";
    case "1688":
    case "taobao":
    case "goofish":
      return "bg-[#FFF7ED] text-[#EA580C] border border-orange-100";
    case "aliexpress":
    case "alibaba":
      return "bg-[#FEF2F2] text-[#DC2626] border border-red-100";
    default:
      return "bg-[var(--color-primary)] text-[var(--color-accent)]";
  }
}



