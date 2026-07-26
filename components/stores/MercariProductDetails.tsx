import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Check, ExternalLink, Send } from "lucide-react";
import { formatApproxSar, formatJpy, formatStoreStatus, primaryImage } from "@/lib/store-products";

export type ProductDetailData = {
  id: number;
  storeName: string;
  originalUrl: string;
  arabicName: string;
  originalName: string | null;
  description: string | null;
  priceJpy: number | null;
  approxPriceSar: string | null;
  category: string | null;
  brand: string | null;
  productCondition: string | null;
  availabilityStatus: string;
  lastCheckedLabel: string | null;
};

export type RelatedProductData = {
  id: number;
  arabicName: string;
  priceJpy: number | null;
  approxPriceSar: unknown;
  availabilityStatus: string;
  imageUrlsJson: string | null;
};

function isArabic(value: string) {
  return /[\u0600-\u06ff]/.test(value);
}

export function ProductHeader({ product }: { product: ProductDetailData }) {
  const isSold = product.availabilityStatus === "SOLD";
  return (
    <header>
      <div className="flex flex-wrap gap-2">
        <Badge tone="navy">{product.storeName}</Badge>
        {product.productCondition && <Badge>{product.productCondition}</Badge>}
        <Badge tone={isSold ? "danger" : "success"}>{isSold ? "مباع" : "متوفر للطلب"}</Badge>
      </div>
      <h1 className="mt-4 text-3xl font-bold leading-[1.3] text-[var(--color-primary-dark)] sm:text-4xl">{product.arabicName}</h1>
      {product.originalName && product.originalName !== product.arabicName && (
        <p dir={isArabic(product.originalName) ? "rtl" : "ltr"} className={`mt-2 max-w-[560px] text-sm font-normal leading-6 text-[var(--color-muted)] ${isArabic(product.originalName) ? "text-right" : "text-left"}`}>
          {product.originalName}
        </p>
      )}
    </header>
  );
}

export function ProductPrice({ product }: { product: ProductDetailData }) {
  return (
    <section className="mt-5 border-y border-[var(--color-border)] py-4" aria-label="سعر المنتج">
      <p className="text-4xl font-bold text-[var(--color-primary-dark)] sm:text-5xl">{formatJpy(product.priceJpy)}</p>
      <p className="mt-2 text-xl font-semibold leading-8 text-[var(--color-accent-dark)] [font-variant-numeric:tabular-nums]">{formatApproxSar(product.approxPriceSar)}</p>
      <p className="mt-2 text-sm font-normal leading-6 text-[var(--color-muted)]">السعر قبل رسوم الخدمة والشحن الدولي، ويخضع للمراجعة قبل التأكيد.</p>
    </section>
  );
}

export function ProductSpecifications({ product }: { product: ProductDetailData }) {
  const rows = [
    ["المتجر", product.storeName],
    ["الحالة", product.productCondition],
    ["الماركة", product.brand],
    ["التصنيف", product.category],
    ["بلد الشحن", "اليابان"],
    ["آخر تحقق", product.lastCheckedLabel],
  ].filter((row): row is [string, string] => Boolean(row[1]));
  return (
    <section className="mt-5">
      <h2 className="text-xl font-semibold text-[var(--color-text)]">معلومات المنتج</h2>
      <dl className="mt-4 overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[120px_1fr] border-t border-[var(--color-border)] first:border-t-0 sm:grid-cols-[160px_1fr]">
            <dt className="bg-[var(--color-bg)] px-4 py-2.5 text-sm font-medium text-[var(--color-muted)]">{label}</dt>
            <dd className="px-4 py-2.5 text-sm font-semibold leading-6 text-[var(--color-text)]">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ProductBuyBox({ product, orderAction }: { product: ProductDetailData; orderAction: () => Promise<void> }) {
  const isSold = product.availabilityStatus === "SOLD";
  return (
    <aside className="lg:sticky lg:top-24">
      <form action={orderAction} className="rounded-xl border border-[var(--color-border)] bg-white p-4">
        <p className="text-sm font-medium text-[var(--color-muted)]">السعر الحالي</p>
        <p className="mt-1 text-2xl font-bold text-[var(--color-primary-dark)]">{formatJpy(product.priceJpy)}</p>
        <p className={`mt-4 text-sm font-semibold ${isSold ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>{isSold ? "هذا المنتج لم يعد متوفرًا" : "متوفر لطلب المراجعة"}</p>
        <div className="mt-4 flex gap-3 rounded-lg bg-[#fff8e9] p-3 text-sm leading-6 text-[#80570f]">
          <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
          <p>السعر والتوفر يخضعان للمراجعة قبل تأكيد الطلب.</p>
        </div>
        {isSold ? (
          <Link href="/stores/mercari-japan" className="mt-5 inline-flex h-[52px] w-full items-center justify-center rounded-lg bg-[var(--color-primary)] px-5 font-semibold text-white">تصفح منتجات مشابهة</Link>
        ) : (
          <button className="mt-5 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-5 font-semibold text-[var(--color-primary-dark)] transition hover:bg-[var(--color-accent-dark)]">
            <Send className="h-5 w-5" />
            اطلبه عن طريق وصلها لي
          </button>
        )}
        <a href={product.originalUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] px-5 text-sm font-semibold text-[var(--color-primary)] hover:border-[var(--color-primary)]">
          <ExternalLink className="h-4 w-4" />
          فتح المنتج الأصلي
        </a>
        <ul className="mt-4 grid gap-2 border-t border-[var(--color-border)] pt-4 text-sm leading-6 text-[var(--color-muted)]">
          {["مراجعة الرابط والسعر قبل الشراء", "لا يتم الدفع قبل التأكيد النهائي", "نتابع الطلب حتى وصوله للمستودع"].map((item) => <li key={item} className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-[var(--success)]" />{item}</li>)}
        </ul>
      </form>
    </aside>
  );
}

export function ProductDescription({ description, product }: { description: string | null; product: ProductDetailData }) {
  const hasDescription = Boolean(description?.trim());
  if (!hasDescription) return null;
  const descriptionIsArabic = hasDescription && isArabic(description!);
  return (
    <section className="border-t border-[var(--color-border)] pt-7">
      <h2 className="text-2xl font-semibold text-[var(--color-primary-dark)]">وصف المنتج</h2>
      {hasDescription ? (
        descriptionIsArabic ? (
          <p className="mt-5 whitespace-pre-line text-[15px] font-normal leading-8 text-[var(--color-text)]">{description}</p>
        ) : (
          <details className="mt-5 rounded-lg border border-[var(--color-border)] bg-white p-4">
            <summary className="cursor-pointer font-semibold text-[var(--color-primary)]">عرض الوصف الأصلي</summary>
            <p dir="ltr" className="mt-4 whitespace-pre-line text-left text-[15px] leading-8 text-[var(--color-text)]">{description}</p>
          </details>
        )
      ) : (
        <p className="mt-4 text-[15px] leading-8 text-[var(--color-muted)]">لا يتوفر وصف تفصيلي لهذا المنتج حاليًا. راجع الرابط الأصلي أو أرسل طلب المراجعة للتأكد من التفاصيل.</p>
      )}
      <dl className="mt-6 grid gap-3 text-[15px] sm:grid-cols-2">
        {product.productCondition && <DescriptionLine label="حالة المنتج" value={product.productCondition} />}
        {product.brand && <DescriptionLine label="الماركة" value={product.brand} />}
        <DescriptionLine label="الشحن من" value="اليابان" />
      </dl>
    </section>
  );
}

export function PurchaseSteps() {
  const steps = ["نراجع الرابط والسعر والتوفر.", "نرسل لك التكلفة النهائية قبل الدفع.", "بعد موافقتك نشتري المنتج ونتابع شحنه."];
  return (
    <section className="border-t border-[var(--color-border)] pt-7">
      <h2 className="text-2xl font-semibold text-[var(--color-primary-dark)]">كيف يتم الطلب؟</h2>
      <ol className="mt-4 grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => <li key={step} className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--color-primary)] text-sm font-bold text-[var(--color-primary)]">{index + 1}</span><p className="pt-1 text-base font-medium leading-7 text-[var(--color-text)]">{step}</p></li>)}
      </ol>
    </section>
  );
}

export function UsedProductNotice() {
  return <div className="flex gap-3 border-t border-[var(--color-border)] pt-7 text-[15px] leading-8 text-[var(--color-muted)]"><AlertTriangle className="mt-1.5 h-5 w-5 shrink-0 text-[var(--color-accent-dark)]" /><p>المنتجات المستعملة قد تُباع بسرعة على المتجر الأصلي، لذلك لا يعتبر الطلب مؤكدًا إلا بعد مراجعة التوفر.</p></div>;
}

export function RelatedProducts({ products }: { products: RelatedProductData[] }) {
  if (products.length === 0) return null;
  return (
    <section className="border-t border-[var(--color-border)] pt-10">
      <h2 className="text-2xl font-semibold text-[var(--color-primary-dark)]">قد يعجبك أيضًا</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.slice(0, 4).map((product) => {
          const image = primaryImage(product.imageUrlsJson);
          return <Link key={product.id} href={`/stores/mercari-japan/${product.id}`} className="min-w-0 overflow-hidden rounded-lg border border-[var(--color-border)] bg-white transition hover:border-[var(--color-primary)]">
            <div className="relative aspect-square bg-[var(--color-bg)]">{image ? <Image src={image} alt={product.arabicName} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-contain p-2" unoptimized /> : <div className="grid h-full place-items-center px-3 text-center text-xs text-[var(--color-muted)]">صورة غير متوفرة</div>}</div>
            <div className="p-3"><h3 className="line-clamp-2 min-h-12 text-sm font-semibold leading-6 text-[var(--color-text)]">{product.arabicName}</h3><p className="mt-2 font-bold text-[var(--color-primary)]">{formatJpy(product.priceJpy)}</p><p className="mt-1 text-xs font-medium text-[var(--color-muted)]">{formatStoreStatus(product.availabilityStatus)}</p></div>
          </Link>;
        })}
      </div>
    </section>
  );
}

function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "navy" | "blue" | "success" | "danger" }) {
  const styles = { muted: "bg-slate-100 text-[var(--color-muted)]", navy: "bg-[var(--color-primary)] text-white", blue: "bg-[#eaf2f5] text-[var(--color-primary)]", success: "bg-[var(--success-bg)] text-[var(--success)]", danger: "bg-[var(--danger-bg)] text-[var(--danger)]" };
  return <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
}

function DescriptionLine({ label, value }: { label: string; value: string }) {
  return <div className="flex gap-2"><dt className="font-semibold text-[var(--color-text)]">{label}:</dt><dd className="text-[var(--color-muted)]">{value}</dd></div>;
}
