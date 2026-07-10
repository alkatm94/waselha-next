"use client";

import { useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, ExternalLink, Link2, Loader2, PackageSearch, Search } from "lucide-react";
import { detectProductStore, resolveCurrency, type ProductStore, type StoreId, type SupportedCurrency } from "@/lib/product-links";

export type ImportedProduct = {
  originalUrl: string;
  normalizedUrl: string;
  storeId: StoreId;
  storeName: string;
  title: string;
  image?: string;
  price?: number;
  currency: SupportedCurrency;
};

type ProductPreview = ImportedProduct & {
  finalUrl?: string;
};

type MetadataResponse = {
  ok: boolean;
  status: "recognized" | "needs_review" | "unsupported";
  message?: string;
  product?: ProductPreview;
};

export function ProductLinkImporter({ onUseProduct }: { onUseProduct: (product: ImportedProduct) => void }) {
  const [url, setUrl] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<ProductPreview | null>(null);
  const [status, setStatus] = useState<MetadataResponse["status"] | null>(null);
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
      setStatus(detection.reason === "unsupported" ? "unsupported" : "needs_review");
      setError(detection.reason === "unsupported" ? "الرابط غير مدعوم حاليًا" : "تأكد من صحة الرابط وحاول مرة أخرى");
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

      if (data.product) {
        setPreview(withFallbacks(data.product, detection.store));
      } else {
        setPreview(createFallbackPreview(detection));
      }
      setStatus(data.status === "unsupported" ? "unsupported" : "recognized");
      setMessage(data.product?.price ? data.message || "تم التعرف على الرابط" : "تعذر جلب السعر تلقائيًا، أدخل سعر المنتج يدويًا");
    } catch {
      if (requestKeyRef.current !== requestKey) return;
      setPreview(createFallbackPreview(detection));
      setStatus("recognized");
      setMessage("تعذر جلب السعر تلقائيًا، أدخل سعر المنتج يدويًا");
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
    });
  }

  return (
    <section id="product-importer" className="bg-[#F8F5EF] px-5 pb-12 pt-2 md:pb-16">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold text-[#9f741b]">مستورد رابط ذكي</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-[#0F172A] md:text-5xl">ألصق رابط المنتج وخذ تسعيرتك</h2>
          <p className="mt-4 text-base font-medium leading-8 text-[#64748B]">ندعم روابط Taobao و1688 وAliExpress وAlibaba وGoofish</p>
        </div>

        <div className="mt-8 rounded-[28px] border border-white/80 bg-white/90 p-3 shadow-2xl shadow-slate-900/10 backdrop-blur md:p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex min-h-[64px] flex-1 items-center gap-3 rounded-[22px] border border-slate-900/10 bg-[#F7F8FA] px-4 transition focus-within:border-[#D6A84F] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(214,168,79,0.18)] md:px-5">
              <Link2 className="h-5 w-5 shrink-0 text-[#9f741b]" />
              <input
                value={url}
                onBlur={() => setTouched(true)}
                onChange={(event) => updateUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && canAnalyze) analyzeLink();
                }}
                placeholder="الصق رابط المنتج هنا"
                className="h-14 min-w-0 flex-1 bg-transparent text-right text-base font-bold text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
              />
              {detectedStore && <StorePill store={detectedStore} />}
            </div>

            <button
              onClick={analyzeLink}
              disabled={!canAnalyze}
              className="inline-flex h-16 items-center justify-center gap-2 rounded-full bg-[#111827] px-8 text-base font-bold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-[#0F172A] disabled:cursor-not-allowed disabled:opacity-55 md:min-w-44"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              تحليل الرابط
            </button>
          </div>

          {(inputError || error) && (
            <div className="mt-3 flex items-center gap-2 px-3 text-sm font-bold text-red-600">
              <AlertCircle className="h-4 w-4" />
              {error || "تأكد من صحة الرابط أو استخدم رابطًا من متجر مدعوم"}
            </div>
          )}
        </div>

        {loading && (
          <div className="mt-5 flex items-center justify-center gap-3 rounded-lg border border-[#D6A84F]/25 bg-white/80 p-5 text-sm font-bold text-[#8A641C] shadow-lg shadow-slate-900/5">
            <Loader2 className="h-5 w-5 animate-spin" />
            جارٍ تحليل رابط المنتج...
          </div>
        )}

        {!loading && preview && (
          <ProductPreviewCard product={preview} status={status || "recognized"} message={message} onUseProduct={useProduct} />
        )}
      </div>
    </section>
  );
}

function StorePill({ store }: { store: ProductStore }) {
  return (
    <span className="hidden items-center gap-2 rounded-full border border-[#D6A84F]/25 bg-white px-3 py-2 text-xs font-bold text-[#7a5a15] shadow-sm sm:inline-flex">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-[#111827] text-[10px] text-[#F2C66D]">{store.icon}</span>
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
  status: MetadataResponse["status"];
  message: string;
  onUseProduct: () => void;
}) {
  const hasPrice = typeof product.price === "number" && product.price > 0;

  return (
    <article className="mt-6 overflow-hidden rounded-lg border border-slate-900/10 bg-white shadow-xl shadow-slate-900/7">
      <div className="grid gap-0 md:grid-cols-[260px_1fr]">
        <div className="flex min-h-56 items-center justify-center bg-[#EEF2F6] p-4 md:min-h-full">
          <ProductImage src={product.image} alt={product.title} storeName={product.storeName} />
        </div>

        <div className="p-5 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#111827] text-sm font-bold text-[#F2C66D]">
                {product.storeName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-[#64748B]">المتجر</p>
                <h3 className="text-lg font-bold text-[#0F172A]">{product.storeName}</h3>
              </div>
            </div>
            <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${status === "unsupported" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
              <CheckCircle2 className="h-4 w-4" />
              {status === "unsupported" ? "الرابط غير مدعوم" : "تم التعرف على الرابط"}
            </span>
          </div>

          <h4 className="mt-4 line-clamp-2 text-lg font-bold leading-8 text-[#0F172A]" title={product.title}>{product.title}</h4>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a href={product.originalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#D6A84F]/35 bg-[#F8F5EF] px-4 text-sm font-bold text-[#8A641C] transition hover:border-[#D6A84F] hover:bg-white">
              <ExternalLink className="h-4 w-4" />
              فتح رابط المنتج
            </a>
            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-[#64748B]">{product.currency}</span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoBox label="السعر" value={hasPrice ? String(product.price) : "السعر غير متاح تلقائيًا"} />
            <InfoBox label="العملة الأصلية" value={product.currency} />
          </div>

          {message && <p className="mt-4 rounded-lg border border-[#D6A84F]/20 bg-[#F8F5EF] p-3 text-sm font-bold leading-7 text-[#7a5a15]">{message}</p>}

          <button onClick={onUseProduct} className="mt-5 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#F2C66D] px-8 text-base font-bold text-[#111827] shadow-lg shadow-[#F2C66D]/25 transition hover:-translate-y-0.5 hover:bg-[#D6A84F] md:w-[min(100%,420px)]">
            احسب التكلفة واصل لبابك
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductImage({ src, alt, storeName }: { src?: string; alt: string; storeName: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <ProductPlaceholder storeName={storeName} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onError={() => setFailed(true)} className="max-h-56 w-full rounded-lg object-contain" />
  );
}
function ProductPlaceholder({ storeName }: { storeName: string }) {
  return (
    <div className="flex h-40 w-40 flex-col items-center justify-center rounded-2xl border border-slate-900/10 bg-white text-[#111827] shadow-sm">
      <PackageSearch className="h-10 w-10 text-[#D6A84F]" />
      <span className="mt-3 text-sm font-bold">{storeName}</span>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-900/10 bg-[#F7F8FA] p-3">
      <p className="text-xs font-bold text-[#64748B]">{label}</p>
      <p className="mt-1 text-base font-bold text-[#0F172A]">{value}</p>
    </div>
  );
}

function createFallbackPreview(detection: Extract<ReturnType<typeof detectProductStore>, { ok: true }>): ProductPreview {
  return {
    originalUrl: detection.originalUrl,
    normalizedUrl: detection.normalizedUrl,
    storeId: detection.store.id,
    storeName: detection.store.name,
    title: `منتج من ${detection.store.name}`,
    currency: detection.store.defaultCurrency,
  };
}

function withFallbacks(product: ProductPreview, store: ProductStore): ProductPreview {
  return {
    ...product,
    originalUrl: product.originalUrl || "",
    normalizedUrl: product.normalizedUrl || product.originalUrl || "",
    title: product.title || `منتج من ${product.storeName || store.name}`,
    storeName: product.storeName || store.name,
    currency: resolveCurrency(store, product.currency),
  };
}

