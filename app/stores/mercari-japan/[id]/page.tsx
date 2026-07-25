import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  ExternalLink,
  PackageCheck,
  SearchCheck,
  Send,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { requireCustomer } from "@/lib/auth";
import {
  createPurchaseOrderFromStoreProduct,
  formatApproxSar,
  formatJpy,
  getPublishedMercariProduct,
  imageUrlsFromJson,
} from "@/lib/store-products";

export const dynamic = "force-dynamic";
export const metadata = { title: "تفاصيل منتج Mercari Japan | وصلها لي" };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ error?: string }>;

export default async function MercariProductPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();
  const product = await getPublishedMercariProduct(productId);
  if (!product) notFound();
  const images = imageUrlsFromJson(product.imageUrlsJson);
  const checkedAt = product.lastCheckedAt
    ? product.lastCheckedAt.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })
    : "غير محدد";

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
    <main dir="rtl" className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:py-8">
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm font-bold text-[var(--text-secondary)]" aria-label="Breadcrumb">
          <Link href="/stores" className="transition hover:text-[var(--brand-navy)]">
            المتاجر
          </Link>
          <ChevronLeft className="h-4 w-4" />
          <Link href="/stores/mercari-japan" className="transition hover:text-[var(--brand-navy)]">
            Mercari Japan
          </Link>
          <ChevronLeft className="h-4 w-4" />
          <span className="line-clamp-1 max-w-[520px] text-[var(--brand-navy)]">{product.arabicName}</span>
        </nav>

        {query.error && <p className="mb-5 rounded-lg bg-[var(--danger-bg)] p-4 text-sm font-bold text-[var(--danger)]">{query.error}</p>}

        <section className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start xl:gap-9">
          <div className="grid gap-7">
            <div className="grid gap-7 rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5 lg:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.05fr)] xl:p-6">
              <ProductGallery images={images} productName={product.arabicName} />

              <section className="min-w-0 py-1 lg:py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-navy)] px-3 py-1.5 text-xs font-bold text-white">
                    <BadgeCheck className="h-3.5 w-3.5 text-[var(--brand-gold)]" />
                    Mercari Japan
                  </span>
                  <StatusPill tone="success">متوفر للمراجعة</StatusPill>
                  {product.productCondition && <StatusPill>{product.productCondition}</StatusPill>}
                  <StatusPill tone="info">يتم التحقق منه</StatusPill>
                </div>

                <h1 title={product.arabicName} className="mt-5 line-clamp-3 text-2xl font-extrabold leading-tight text-[var(--brand-navy)] sm:text-3xl lg:text-[34px]">
                  {product.arabicName}
                </h1>
                {product.originalName && <p className="mt-3 line-clamp-2 text-sm font-semibold leading-7 text-[var(--text-secondary)] lg:text-base">{product.originalName}</p>}

                <div className="mt-6 border-y border-[var(--border)] py-5">
                  <p className="text-xs font-bold text-[var(--text-secondary)]">السعر المسجل في آخر مراجعة</p>
                  <p className="mt-1 text-[38px] font-extrabold leading-none text-[var(--brand-navy)] sm:text-5xl">{formatJpy(product.priceJpy)}</p>
                  <p className="mt-3 text-lg font-extrabold text-[var(--brand-gold-dark)]">{formatApproxSar(product.approxPriceSar)}</p>
                </div>

                <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Spec label="التصنيف" value={product.category || "غير محدد"} />
                  <Spec label="الماركة" value={product.brand || "غير محدد"} />
                  <Spec label="حالة المنتج" value={product.productCondition || "تحتاج تحقق"} />
                  <Spec label="آخر تحقق" value={checkedAt} />
                </dl>
              </section>
            </div>

            <section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-2xl font-extrabold text-[var(--brand-navy)]">تفاصيل المنتج</h2>
              <p className="mt-4 whitespace-pre-wrap text-[15px] font-medium leading-8 text-[var(--text-primary)]">{product.description || "لا يوجد وصف مفصل لهذا المنتج حاليًا."}</p>
            </section>

            <section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-2xl font-extrabold text-[var(--brand-navy)]">معلومات الشراء</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <InfoPoint icon={SearchCheck} title="تحقق يدوي" text="نراجع توفر المنتج والسعر قبل تأكيد الطلب." />
                <InfoPoint icon={PackageCheck} title="مصدر المنتج" text="المنتج من Mercari Japan ورابطه الأصلي محفوظ." />
                <InfoPoint icon={ShieldCheck} title="بدون دفع الآن" text="لا يتم الدفع أو الشراء قبل موافقتك النهائية." />
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-6">
            <form action={orderAction} className="overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-[0_18px_50px_rgba(11,42,61,0.10)]">
              <div className="border-b border-[var(--border)] p-5">
                <p className="text-sm font-bold text-[var(--text-secondary)]">السعر الحالي</p>
                <p className="mt-1 text-3xl font-extrabold text-[var(--brand-navy)]">{formatJpy(product.priceJpy)}</p>
                <p className="mt-1 text-base font-extrabold text-[var(--brand-gold-dark)]">{formatApproxSar(product.approxPriceSar)}</p>
              </div>

              <div className="p-5">
                <div className="flex gap-3 rounded-lg bg-[var(--warning-bg)] p-4 text-sm font-bold leading-7 text-[var(--warning)]">
                  <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
                  <p>السعر والتوفر يخضعان للمراجعة قبل تأكيد الطلب. إرسال الطلب لا يعني الشراء أو الدفع الآن.</p>
                </div>

                <button className="mt-5 inline-flex h-14 min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-gold)] px-5 text-base font-extrabold text-[var(--brand-navy)] shadow-sm transition hover:bg-[var(--brand-gold-dark)]">
                  <Send className="h-5 w-5" />
                  اطلبه عن طريق وصلها لي
                </button>
                <a href={product.originalUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-white px-5 text-sm font-bold text-[var(--brand-navy)] transition hover:border-[var(--brand-gold)]">
                  <ExternalLink className="h-4 w-4" />
                  فتح المنتج الأصلي
                </a>

                <div className="mt-5 grid gap-3 border-t border-[var(--border)] pt-5 text-sm font-semibold leading-7 text-[var(--text-secondary)]">
                  <TrustLine>مراجعة السعر قبل الشراء.</TrustLine>
                  <TrustLine>حفظ رابط المنتج ولقطة السعر.</TrustLine>
                  <TrustLine>عدم الدفع قبل التأكيد النهائي.</TrustLine>
                </div>
              </div>
            </form>
          </aside>
        </section>
      </section>
    </main>
  );
}

function ProductGallery({ images, productName }: { images: string[]; productName: string }) {
  const mainImage = images[0] || null;
  return (
    <section className="min-w-0">
      <a href={mainImage || "#"} target={mainImage ? "_blank" : undefined} rel="noreferrer" className="relative block aspect-square overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]">
        {mainImage ? (
          <Image src={mainImage} alt={productName} fill priority sizes="(max-width: 1024px) 100vw, 520px" className="object-contain p-3" unoptimized />
        ) : (
          <div className="grid h-full place-items-center text-sm font-bold text-[var(--text-secondary)]">لا توجد صورة</div>
        )}
        {mainImage && <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[var(--brand-navy)] shadow-sm">اضغط للتكبير</span>}
      </a>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {images.slice(0, 5).map((image, index) => (
            <a key={image} href={image} target="_blank" rel="noreferrer" className="relative aspect-square overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] transition hover:border-[var(--brand-gold)]">
              <Image src={image} alt={`${productName} - ${index + 1}`} fill sizes="96px" className="object-cover" unoptimized />
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

function StatusPill({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "success" | "info" }) {
  const classes =
    tone === "success"
      ? "bg-[var(--success-bg)] text-[var(--success)]"
      : tone === "info"
        ? "bg-[var(--info-bg)] text-[var(--info)]"
        : "bg-[var(--surface-muted)] text-[var(--text-secondary)]";
  return <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${classes}`}>{children}</span>;
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
      <dt className="text-xs font-bold text-[var(--text-secondary)]">{label}</dt>
      <dd className="mt-1 line-clamp-2 text-sm font-extrabold text-[var(--brand-navy)]">{value}</dd>
    </div>
  );
}

function InfoPoint({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="rounded-lg bg-[var(--background)] p-4">
      <Icon className="h-5 w-5 text-[var(--brand-gold-dark)]" />
      <h3 className="mt-3 text-base font-extrabold text-[var(--brand-navy)]">{title}</h3>
      <p className="mt-1 text-sm font-semibold leading-7 text-[var(--text-secondary)]">{text}</p>
    </div>
  );
}

function TrustLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2">
      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[var(--success)]" />
      {children}
    </p>
  );
}