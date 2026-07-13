"use client";

import Image from "next/image";
import { useMemo, useState, type ReactNode } from "react";
import { AlertCircle, Calculator, Check, CheckCircle2, ChevronDown, CircleDollarSign, ClipboardCheck, HandCoins, Menu, MessageCircle, ReceiptText, ShieldCheck, Store, Truck, X } from "lucide-react";
import { GlobalShoppingHero } from "@/components/home/GlobalShoppingHero";
import { ProductLinkImporter, type ImportedProduct } from "@/components/ProductLinkImporter";
import { calculateQuote, type QuoteInput } from "@/lib/pricing";

type Currency = QuoteInput["currency"];
type Country = QuoteInput["country"];
type ServiceTier = QuoteInput["serviceTier"];
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "966500000000";
const navItems = [["الرئيسية", "#home"], ["احسب التكلفة", "#calculator"], ["كيف نعمل", "#how"], ["المتاجر المدعومة", "#stores"], ["الأسئلة الشائعة", "#faq"], ["تواصل معنا", "#contact"]];
const policyLinks = [["الشروط والأحكام", "/terms"], ["سياسة الخصوصية", "/privacy"], ["سياسة الطلب والدفع", "/order-policy"], ["سياسة الشحن والتوصيل", "/shipping-policy"], ["سياسة الإلغاء والاسترجاع", "/refund-policy"], ["المنتجات غير المقبولة", "/prohibited-items"]];
const currencyLabels: Record<Currency, string> = { USD: "دولار USD", CNY: "يوان CNY", JPY: "ين JPY", EUR: "يورو EUR" };
const countryLabels: Record<Country, string> = { china: "الصين", japan: "اليابان", usa: "أمريكا", europe: "أوروبا" };
const serviceTiers: { value: ServiceTier; label: string; hint: string }[] = [
  { value: "quote", label: "تسعير الطلب", hint: "مراجعة الرابط وإرسال تقدير" },
  { value: "standard", label: "شراء منتج واحد", hint: "شراء ومتابعة أساسية" },
  { value: "plus", label: "شراء ومتابعة", hint: "مناسب للطلبات التي تحتاج متابعة أكثر" },
  { value: "pro", label: "طلب خاص / مورد", hint: "للموردين والطلبات الأعلى تعقيدًا" },
];
const stores = ["Alibaba", "AliExpress", "Taobao", "1688", "Goofish", "Amazon", "eBay", "متاجر عالمية أخرى"];
const trustStripItems = ["خدمة داخل السعودية", "متابعة عبر واتساب", "تكلفة تقديرية قبل الطلب", "سياسات واضحة"];
const faqItems = [
  ["كيف أرسل رابط المنتج؟", "انسخ رابط المنتج من المتجر وضعه في النموذج أو أرسله مباشرة عبر واتساب."],
  ["هل السعر في الحاسبة نهائي؟", "لا، الحاسبة تقديرية. نؤكد السعر النهائي بعد مراجعة الرابط وتفاصيل الشحن."],
  ["كم تستغرق مدة التوصيل؟", "تختلف حسب المتجر والمورد وطريقة الشحن، ونوضح التقدير عند مراجعة الطلب."],
  ["هل يمكنكم الطلب من أي متجر؟", "نراجع روابط المتاجر العالمية، وقد نرفض المنتجات غير المناسبة أو صعبة الشحن."],
  ["كيف أعرف حالة طلبي؟", "تكون المتابعة عبر واتساب حسب تفاصيل الطلب المتفق عليها."],
  ["هل توجد منتجات لا يمكن شحنها؟", "نعم، بعض المنتجات ممنوعة أو تحتاج متطلبات خاصة، ونوضح ذلك بعد مراجعة الرابط."],
  ["متى يتم شراء المنتج؟", "بعد مراجعة الرابط وإرسال السعر النهائي وموافقتك على الطلب."],
  ["ماذا يحدث إذا لم يشحن المورد؟", "نتابع الحالة مع المورد ونوضح الخيارات المتاحة حسب حالة الطلب وسياساته."],
  ["هل التوصيل يشمل مدينتي؟", "نراجع عنوان التوصيل داخل السعودية ونوضح الخيارات المتاحة قبل تأكيد الطلب."],
  ["كيف أتواصل معكم؟", "أفضل طريقة هي إرسال الرابط أو الاستفسار عبر واتساب من أزرار التواصل في الموقع."],
];
function openWhatsApp(message: string) { window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer"); }
function formatSar(value: number) { return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.max(0, Math.ceil(value))); }
function isLikelyUrl(value: string) { try { const parsed = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`); return ["http:", "https:"].includes(parsed.protocol) && parsed.hostname.includes("."); } catch { return false; } }

export function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [productUrl, setProductUrl] = useState("");
  const [productNote, setProductNote] = useState("");
  const [linkError, setLinkError] = useState("");
  const [productName, setProductName] = useState("");
  const [productStoreName, setProductStoreName] = useState("");
  const [price, setPrice] = useState("400");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [country, setCountry] = useState<Country>("china");
  const [weightKg, setWeightKg] = useState("3");
  const [serviceTier, setServiceTier] = useState<ServiceTier>("standard");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [calculatorTouched, setCalculatorTouched] = useState(false);
  const quote = useMemo(() => calculateQuote({ productPrice: Number(price || 0), currency, weightKg: Number(weightKg || 0), country, serviceTier }), [country, currency, price, serviceTier, weightKg]);
  const calculatorReady = Number(price) > 0 && Number(weightKg) > 0;
  function sendBasicWhatsApp() { openWhatsApp("السلام عليكم، أرغب بإرسال رابط منتج ومراجعته عبر وصلها لي."); }
  function sendLinkRequest() { setLinkError(""); if (!isLikelyUrl(productUrl)) { setLinkError("أدخل رابط منتج صحيح قبل الإرسال."); return; } openWhatsApp(`السلام عليكم، أرغب بطلب هذا المنتج عبر وصلها لي:\n\nرابط المنتج:\n${productUrl}\n\nملاحظاتي:\n${productNote || "لا توجد"}`); }
  function sendCalculatorWhatsApp() { setCalculatorTouched(true); if (!calculatorReady) return; openWhatsApp(`السلام عليكم، أرغب بطلب منتج من الخارج عبر وصلها لي.\n\nالاسم: ${customerName || "غير محدد"}\nالجوال: ${customerPhone || "غير محدد"}\nاسم المنتج: ${productName || "غير محدد"}\nرابط المنتج: ${productUrl || "غير مرفق"}\nالمتجر: ${productStoreName || "غير محدد"}\nدولة الطلب: ${countryLabels[country]}\nسعر المنتج: ${price} ${currencyLabels[currency]}\nالوزن التقريبي: ${weightKg} KG\nنوع الخدمة: ${serviceTiers.find((item) => item.value === serviceTier)?.label}\n\nملخص الحاسبة:\nقيمة المنتج: ${formatSar(quote.productSar)} ريال\nالشحن التقديري: ${formatSar(quote.shippingSar)} ريال\nرسوم الخدمة: ${formatSar(quote.serviceFee)} ريال\nالإجمالي التقديري: ${formatSar(quote.total)} ريال\n\nأرغب بمراجعة الرابط وإرسال السعر النهائي.`); }
  function handleImportedProduct(product: ImportedProduct) { setProductUrl(product.originalUrl); setProductName(product.title); setProductStoreName(product.storeName); setCountry("china"); if (product.currency === "USD" || product.currency === "CNY") setCurrency(product.currency); if (typeof product.price === "number" && product.price > 0) setPrice(String(product.price)); window.requestAnimationFrame(() => document.querySelector("#calculator")?.scrollIntoView({ behavior: "smooth" })); }
  return (
    <main id="home" dir="rtl" className="min-h-screen overflow-x-hidden bg-[var(--color-bg)] text-[var(--color-text)]">
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} onPrimary={sendBasicWhatsApp} />
      <GlobalShoppingHero />
      <ProductLinkForm productUrl={productUrl} productNote={productNote} linkError={linkError} setProductUrl={setProductUrl} setProductNote={setProductNote} onSubmit={sendLinkRequest} />
      <ProductLinkImporter onUseProduct={handleImportedProduct} />
      <TrustStrip />
      <TrustSection />
      <ProcessSteps />
      <CalculatorSection productUrl={productUrl} productName={productName} country={country} currency={currency} price={price} weightKg={weightKg} serviceTier={serviceTier} customerName={customerName} customerPhone={customerPhone} quote={quote} calculatorTouched={calculatorTouched} calculatorReady={calculatorReady} setProductUrl={setProductUrl} setProductName={setProductName} setCountry={setCountry} setCurrency={setCurrency} setPrice={setPrice} setWeightKg={setWeightKg} setServiceTier={setServiceTier} setCustomerName={setCustomerName} setCustomerPhone={setCustomerPhone} onSend={sendCalculatorWhatsApp} />
      <SupportedStores onSend={sendBasicWhatsApp} />
      <WhySection />
      <OrderJourney />
      <TransparencySection />
      <FAQSection />
      <FinalCTA onPrimary={sendBasicWhatsApp} />
      <Footer onWhatsApp={sendBasicWhatsApp} />
      <FloatingWhatsApp onClick={sendBasicWhatsApp} />
    </main>
  );
}

function Header({ menuOpen, setMenuOpen, onPrimary }: { menuOpen: boolean; setMenuOpen: (value: boolean) => void; onPrimary: () => void }) {
  return <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--color-border)] bg-white/88 shadow-sm backdrop-blur-xl"><div className="mx-auto max-w-7xl px-4 sm:px-6"><nav className="flex h-20 items-center justify-between gap-4 lg:h-24"><a href="#home" className="flex shrink-0 items-center" aria-label="وصلها لي - الرئيسية"><Image src="/images/logo.png" alt="وصلها لي" width={300} height={120} priority className="h-16 w-auto object-contain sm:h-[4.5rem] lg:h-20" /></a><div className="hidden items-center gap-7 lg:flex">{navItems.map(([label, href]) => <a key={href} href={href} className="text-[15px] font-bold text-[var(--color-muted)] transition hover:text-[var(--color-primary)]">{label}</a>)}</div><div className="flex items-center gap-2"><a href="#calculator" className="hidden h-12 items-center justify-center rounded-lg border border-[var(--color-border)] bg-white px-5 text-[15px] font-bold text-[var(--color-text)] transition hover:border-[var(--color-accent)] sm:inline-flex">احسب التكلفة</a><button onClick={onPrimary} className="h-12 rounded-lg bg-[var(--color-accent)] px-5 text-[15px] font-bold text-[var(--color-primary-dark)] shadow-md shadow-amber-900/10 transition hover:-translate-y-0.5 hover:bg-[var(--color-accent-dark)]">أرسل رابط المنتج</button><button onClick={() => setMenuOpen(!menuOpen)} className="grid h-12 w-12 place-items-center rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-primary)] lg:hidden" aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"} aria-expanded={menuOpen}>{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div></nav></div>{menuOpen && <div className="border-t border-[var(--color-border)] bg-white px-4 py-4 shadow-lg lg:hidden"><nav className="mx-auto grid max-w-7xl gap-2">{navItems.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 text-lg font-bold text-[var(--color-text)] hover:bg-[var(--color-surface)]">{label}</a>)}</nav></div>}</header>;
}

function ProductLinkForm(props: { productUrl: string; productNote: string; linkError: string; setProductUrl: (value: string) => void; setProductNote: (value: string) => void; onSubmit: () => void }) {
  return <section id="product-link-form" className="scroll-mt-28 px-4 py-8 sm:px-6"><div className="mx-auto max-w-7xl rounded-lg border border-[var(--color-border)] bg-white p-4 shadow-xl shadow-slate-900/6 sm:p-6"><div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_auto] lg:items-end"><Field label="رابط المنتج"><input value={props.productUrl} onChange={(event) => props.setProductUrl(event.target.value)} placeholder="https://..." className="input" inputMode="url" /></Field><Field label="ملاحظات اختيارية"><input value={props.productNote} onChange={(event) => props.setProductNote(event.target.value)} placeholder="اللون، المقاس، الكمية..." className="input" /></Field><button onClick={props.onSubmit} className="inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-6 text-base font-bold text-[var(--color-primary-dark)] transition hover:bg-[var(--color-accent-dark)]"><MessageCircle className="h-5 w-5" />أرسل الطلب عبر واتساب</button></div>{props.linkError && <p className="mt-3 flex items-center gap-2 text-sm font-bold text-[var(--color-error)]"><AlertCircle className="h-4 w-4" />{props.linkError}</p>}</div></section>;
}
function TrustStrip() {
  return <section className="px-4 pb-4 sm:px-6"><div className="mx-auto grid max-w-7xl gap-3 rounded-lg border border-[var(--color-border)] bg-white p-3 shadow-lg shadow-slate-900/5 sm:grid-cols-2 lg:grid-cols-4">{trustStripItems.map((item) => <div key={item} className="flex min-h-12 items-center gap-2 rounded-lg bg-[var(--color-surface)] px-4 py-3 text-[15px] font-bold text-[var(--color-primary)]"><CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-success)]" />{item}</div>)}</div></section>;
}

function TrustSection() {
  const cards: [string, string, typeof HandCoins][] = [["نشتري بالنيابة عنك", "نرتب عملية الشراء بعد موافقتك على التفاصيل.", HandCoins], ["نراجع التكلفة قبل الدفع", "يصلك تقدير واضح قبل اعتماد الطلب.", ReceiptText], ["نتابع الشحنة مع المورد", "نوضح لك التحديثات حسب حالة الطلب.", ClipboardCheck], ["نوصل الطلب إلى السعودية", "نساعدك في اختيار مسار شحن مناسب للطلب.", Truck]];
  return <section className="px-4 py-12 sm:px-6"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="الثقة أولاً" title="خدمة واضحة من أول رابط" desc="نحافظ على التجربة بسيطة: رابط، مراجعة، موافقة، شراء، متابعة." /><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([title, desc, Icon]) => <article key={title} className="rounded-lg border border-[var(--color-border)] bg-white p-5 shadow-lg shadow-slate-900/5"><div className="grid h-12 w-12 place-items-center rounded-lg bg-[var(--color-primary)] text-[var(--color-accent)]"><Icon className="h-5 w-5" /></div><h3 className="mt-5 text-xl font-bold text-[var(--color-text)]">{title}</h3><p className="mt-2 text-[15px] font-semibold leading-7 text-[var(--color-muted)]">{desc}</p></article>)}</div></div></section>;
}

function ProcessSteps() {
  const steps = ["أرسل رابط المنتج", "نراجع المنتج والتكلفة", "توافق على السعر", "نشتري ونتابع الشحنة", "يصلك الطلب إلى بابك"];
  return <section id="how" className="bg-[var(--color-surface)] px-4 py-12 sm:px-6"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="كيف نعمل؟" title="كيف تطلب من وصلها لي؟" desc="خطوات مختصرة وواضحة تساعدك تعرف ماذا يحدث قبل وبعد الشراء." /><div className="mt-8 grid gap-4 lg:grid-cols-5">{steps.map((step, index) => <article key={step} className="relative rounded-lg border border-[var(--color-border)] bg-white p-5 shadow-sm"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-accent)] text-sm font-bold text-[var(--color-primary-dark)]">{index + 1}</span><h3 className="mt-5 text-lg font-bold leading-7 text-[var(--color-text)]">{step}</h3></article>)}</div></div></section>;
}

type CalculatorProps = { productUrl: string; productName: string; country: Country; currency: Currency; price: string; weightKg: string; serviceTier: ServiceTier; customerName: string; customerPhone: string; quote: ReturnType<typeof calculateQuote>; calculatorTouched: boolean; calculatorReady: boolean; setProductUrl: (value: string) => void; setProductName: (value: string) => void; setCountry: (value: Country) => void; setCurrency: (value: Currency) => void; setPrice: (value: string) => void; setWeightKg: (value: string) => void; setServiceTier: (value: ServiceTier) => void; setCustomerName: (value: string) => void; setCustomerPhone: (value: string) => void; onSend: () => void };
function CalculatorSection(props: CalculatorProps) {
  return <section id="calculator" className="px-4 py-12 sm:px-6"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="حاسبة تقديرية" title="احسب تكلفة الطلب قبل الشراء" desc="نستخدم نفس منطق الحاسبة الحالي، والتأكيد النهائي يكون بعد مراجعة رابط المنتج والشحن الفعلي." /><div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]"><div className="rounded-lg border border-[var(--color-border)] bg-white p-5 shadow-xl shadow-slate-900/6 sm:p-7"><div className="grid gap-4 sm:grid-cols-2"><Field label="رابط المنتج" className="sm:col-span-2"><input value={props.productUrl} onChange={(event) => props.setProductUrl(event.target.value)} placeholder="ضع رابط المنتج هنا" className="input" /></Field><Field label="اسم المنتج"><input value={props.productName} onChange={(event) => props.setProductName(event.target.value)} placeholder="مثال: جهاز، قطعة، إكسسوار" className="input" /></Field><Field label="دولة الشراء"><select value={props.country} onChange={(event) => props.setCountry(event.target.value as Country)} className="input">{Object.entries(countryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="سعر المنتج"><input type="number" min="0" value={props.price} onChange={(event) => props.setPrice(event.target.value)} className="input" /></Field><Field label="العملة"><select value={props.currency} onChange={(event) => props.setCurrency(event.target.value as Currency)} className="input">{Object.entries(currencyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="الوزن التقريبي KG"><input type="number" min="0" step="0.5" value={props.weightKg} onChange={(event) => props.setWeightKg(event.target.value)} className="input" /></Field><Field label="نوع الخدمة"><select value={props.serviceTier} onChange={(event) => props.setServiceTier(event.target.value as ServiceTier)} className="input">{serviceTiers.map((tier) => <option key={tier.value} value={tier.value}>{tier.label}</option>)}</select></Field><Field label="الاسم"><input value={props.customerName} onChange={(event) => props.setCustomerName(event.target.value)} placeholder="اختياري" className="input" /></Field><Field label="رقم الجوال"><input value={props.customerPhone} onChange={(event) => props.setCustomerPhone(event.target.value)} placeholder="اختياري" className="input" inputMode="tel" /></Field></div>{props.calculatorTouched && !props.calculatorReady && <p className="mt-4 flex items-center gap-2 text-sm font-bold text-[var(--color-error)]"><AlertCircle className="h-4 w-4" />أدخل سعر المنتج والوزن التقريبي لعرض النتيجة.</p>}<button onClick={props.onSend} className="mt-6 inline-flex h-[60px] min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-6 text-lg font-bold text-[#062d18] shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:brightness-95"><MessageCircle className="h-5 w-5" />أرسل النتيجة مع رابط المنتج</button></div><CalculatorSummary quote={props.quote} ready={props.calculatorReady} serviceTier={props.serviceTier} /></div></div></section>;
}

function CalculatorSummary({ quote, ready, serviceTier }: { quote: ReturnType<typeof calculateQuote>; ready: boolean; serviceTier: ServiceTier }) {
  return <aside className="rounded-lg bg-[var(--color-primary-dark)] p-5 text-white shadow-2xl shadow-slate-950/20 sm:p-6"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-lg bg-[var(--color-accent)] text-[var(--color-primary-dark)]"><CircleDollarSign className="h-5 w-5" /></span><div><p className="text-[15px] font-bold text-white/68">ملخص الحاسبة</p><h3 className="text-2xl font-bold">تفصيل التكلفة التقديرية</h3></div></div><div className="mt-6 rounded-lg border border-[var(--color-accent)]/30 bg-white/[0.08] p-5"><p className="text-sm font-bold text-white/65">الإجمالي التقديري</p><p className="mt-2 text-5xl font-bold leading-none text-[var(--color-accent)] sm:text-6xl">{ready ? formatSar(quote.total) : "—"}<span className="mr-2 align-middle text-lg text-white">ريال</span></p><p className="mt-3 text-[15px] font-semibold leading-7 text-white/70">{serviceTiers.find((item) => item.value === serviceTier)?.hint}</p></div><div className="mt-5 grid gap-3 text-[15px]"><SummaryLine label="سعر المنتج" value={ready ? `${formatSar(quote.productSar)} ريال` : "—"} /><SummaryLine label="الشحن الدولي" value={ready ? `${formatSar(quote.shippingSar)} ريال` : "—"} /><SummaryLine label="رسوم الخدمة" value={ready ? `${formatSar(quote.serviceFee)} ريال` : "—"} /><div className="rounded-lg border border-white/10 bg-white/[0.045] p-4"><p className="text-sm font-bold text-white/55">الجمارك وضريبة القيمة المضافة</p><p className="mt-1 text-base font-bold text-white">تحدد بعد مراجعة المنتج والشحن الفعلي</p></div></div><p className="mt-5 rounded-lg border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/10 p-4 text-[15px] font-semibold leading-7 text-[#f9e7aa]">هذه الحسبة تقديرية، ويعتمد السعر النهائي على مراجعة المنتج وتكلفة الشحن الفعلية.</p></aside>;
}
function SupportedStores({ onSend }: { onSend: () => void }) {
  return <section id="stores" className="bg-[var(--color-surface)] px-4 py-12 sm:px-6"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="المتاجر المدعومة" title="نراجع روابط من أشهر المتاجر العالمية" desc="نعرض أسماء المتاجر للتوضيح فقط، ووصلها لي خدمة مستقلة وليست تابعة لهذه المنصات." /><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{stores.map((store) => <div key={store} className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-white p-4 shadow-sm"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-primary)] text-xs font-bold text-[var(--color-accent)]">{store.slice(0, 2).toUpperCase()}</span><b className="text-base text-[var(--color-text)]">{store}</b></div>)}</div><div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-lg border border-[var(--color-border)] bg-white p-5 sm:flex-row"><p className="text-sm font-bold leading-7 text-[var(--color-muted)]">يمكننا مراجعة روابط من متاجر أخرى أيضًا.</p><button onClick={onSend} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-5 text-sm font-bold text-[var(--color-primary-dark)]"><Store className="h-4 w-4" />أرسل متجرك لنا</button></div></div></section>;
}

function WhySection() {
  const benefits = ["ما تحتاج حساب صيني", "ما تحتاج تتواصل مع المورد", "ما تحتاج بطاقة دفع دولية", "نساعدك في مراجعة تفاصيل المنتج", "نتابع المورد والشحنة", "تحصل على تكلفة أوضح قبل الشراء"];
  return <section className="px-4 py-12 sm:px-6"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center"><SectionHeading align="right" eyebrow="ليش وصلها لي؟" title="نختصر عليك تعقيد الطلب من الخارج" desc="الفكرة ليست وعود كبيرة، بل خطوات عملية تقلل الغموض قبل الشراء." /><div className="grid gap-3 sm:grid-cols-2">{benefits.map((benefit) => <div key={benefit} className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-white p-4 shadow-sm"><Check className="h-5 w-5 shrink-0 text-[var(--color-success)]" /><span className="font-bold text-[var(--color-text)]">{benefit}</span></div>)}</div></div></section>;
}

function OrderJourney() {
  const statuses = ["تم استلام الرابط", "تمت مراجعة التكلفة", "تم شراء المنتج", "وصل إلى المستودع", "تم الشحن الدولي", "خرج للتوصيل", "تم التسليم"];
  return <section className="bg-[var(--color-primary-dark)] px-4 py-14 text-white sm:px-6"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="مثال توضيحي" title="رحلة الطلب بشكل مبسط" desc="هذا تصور يشرح مراحل الخدمة، ولا يعني وجود تتبع حي داخل الموقع." inverse /><div className="mt-8 grid gap-3 md:grid-cols-7">{statuses.map((status, index) => <div key={status} className="rounded-lg border border-white/10 bg-white/[0.06] p-4"><span className="text-xs font-bold text-[var(--color-accent)]">{String(index + 1).padStart(2, "0")}</span><p className="mt-3 text-sm font-bold leading-7">{status}</p></div>)}</div></div></section>;
}

function TransparencySection() {
  const items = ["الأسعار التقديرية ليست عروضًا نهائية.", "بعض المنتجات قد تكون ممنوعة أو صعبة الشحن.", "مدة الشحن تختلف حسب المورد وطريقة الشحن.", "يتم تأكيد الطلب بعد مراجعة الرابط.", "أي رسوم إضافية يجب توضيحها للعميل قبل اعتماد الطلب."];
  return <section className="px-4 py-12 sm:px-6"><div className="mx-auto max-w-7xl rounded-lg border border-[var(--color-border)] bg-white p-6 shadow-xl shadow-slate-900/6"><SectionHeading eyebrow="شفافية الخدمة" title="ما الذي يجب معرفته قبل الطلب؟" desc="نوضح النقاط المهمة مبكرًا حتى تكون الموافقة مبنية على تفاصيل واضحة." /><div className="mt-8 grid gap-3 md:grid-cols-2">{items.map((item) => <div key={item} className="flex gap-3 rounded-lg bg-[var(--color-surface)] p-4"><ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[var(--color-primary)]" /><p className="text-[15px] font-bold leading-7 text-[var(--color-text)]">{item}</p></div>)}</div></div></section>;
}

function FAQSection() {
  return <section id="faq" className="bg-[var(--color-surface)] px-4 py-12 sm:px-6"><div className="mx-auto grid max-w-7xl items-start gap-6 lg:grid-cols-[0.74fr_1.26fr]"><SectionHeading align="right" eyebrow="الأسئلة الشائعة" title="إجابات مختصرة قبل إرسال الرابط" desc="إذا كان سؤالك مرتبطًا بمنتج محدد، أرسل الرابط ونراجعه مباشرة." /><div className="rounded-lg border border-[var(--color-border)] bg-white px-4 shadow-lg shadow-slate-900/5">{faqItems.map(([q, a]) => <FAQ key={q} q={q} a={a} />)}</div></div></section>;
}

function FinalCTA({ onPrimary }: { onPrimary: () => void }) {
  return <section id="contact" className="px-4 py-12 sm:px-6"><div className="mx-auto max-w-7xl rounded-lg bg-[var(--color-primary)] p-6 text-center text-white shadow-2xl shadow-slate-950/16 sm:p-10"><h2 className="mx-auto max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">لقيت المنتج؟ أرسل الرابط والباقي علينا</h2><p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-8 text-white/75">أرسل رابط المنتج عبر واتساب، وسنراجع لك التفاصيل والتكلفة قبل تأكيد الطلب.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={onPrimary} className="inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-6 text-base font-bold text-[var(--color-primary-dark)]"><MessageCircle className="h-5 w-5" />أرسل رابط المنتج</button><a href="#calculator" className="inline-flex h-14 items-center justify-center gap-2 rounded-lg border border-white/20 px-6 text-base font-bold text-white"><Calculator className="h-5 w-5" />احسب التكلفة</a></div></div></section>;
}

function Footer({ onWhatsApp }: { onWhatsApp: () => void }) {
  return <footer className="bg-slate-950 text-white"><div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.25fr_0.85fr_1fr_1fr] lg:gap-14"><div><a href="#home" className="inline-flex rounded-lg bg-white p-3"><Image src="/images/logo.png" alt="وصلها لي" width={220} height={88} className="h-12 w-auto object-contain" /></a><p className="mt-5 max-w-sm text-base font-semibold leading-8 text-slate-300">وصلها لي خدمة مستقلة للشراء والشحن من المتاجر العالمية إلى السعودية. نراجع الرابط ونوضح التكلفة قبل اعتماد الطلب.</p><p className="mt-4 text-sm font-semibold leading-7 text-slate-400">وصلها لي ليست تابعة رسميًا للمتاجر أو المنصات الخارجية المذكورة في الموقع.</p></div><FooterColumn title="روابط سريعة" links={navItems.slice(0, 5)} /><FooterColumn title="السياسات" links={policyLinks} /><div><h3 className="text-base font-bold">الدعم</h3><div className="mt-5 grid gap-3 text-[15px] font-semibold text-slate-300"><button onClick={onWhatsApp} className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-5 text-sm font-bold text-[var(--color-primary-dark)]"><MessageCircle className="h-4 w-4" />واتساب</button><span>نستقبل روابط المنتجات والاستفسارات عبر واتساب.</span></div></div></div><div className="border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-base font-semibold text-slate-400 sm:px-6 md:flex-row md:items-center md:justify-between"><p>© 2026 وصلها لي. جميع الحقوق محفوظة.</p><p>خدمة شراء وشحن مستقلة إلى السعودية.</p></div></div></footer>;
}
function FloatingWhatsApp({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} className="fixed bottom-4 left-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-[#062d18] shadow-xl shadow-black/20 transition hover:-translate-y-0.5" aria-label="تواصل عبر واتساب"><MessageCircle className="h-6 w-6" /></button>;
}
function FooterColumn({ title, links }: { title: string; links: string[][] }) {
  return <div><h3 className="text-base font-bold">{title}</h3><nav className="mt-5 grid gap-3 text-[15px] font-semibold text-slate-300">{links.map(([label, href]) => <a key={href} href={href} className="transition hover:text-[var(--color-accent)]">{label}</a>)}</nav></div>;
}
function FAQ({ q, a }: { q: string; a: string }) {
  return <details className="group border-t border-[var(--color-border)] py-4 first:border-t-0"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-right text-lg font-bold text-[var(--color-text)]">{q}<ChevronDown className="h-5 w-5 shrink-0 text-[var(--color-primary)] transition group-open:rotate-180" /></summary><p className="mt-3 text-base font-semibold leading-8 text-[var(--color-muted)]">{a}</p></details>;
}
function SectionHeading({ eyebrow, title, desc, inverse = false, align = "center" }: { eyebrow: string; title: string; desc: string; inverse?: boolean; align?: "center" | "right" }) {
  return <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl text-right"}><p className={`text-sm font-bold ${inverse ? "text-[var(--color-accent)]" : "text-[var(--color-accent-dark)]"}`}>{eyebrow}</p><h2 className={`mt-3 text-3xl font-bold leading-tight sm:text-5xl ${inverse ? "text-white" : "text-[var(--color-text)]"}`}>{title}</h2><p className={`mt-4 text-base font-medium leading-8 ${inverse ? "text-white/68" : "text-[var(--color-muted)]"}`}>{desc}</p></div>;
}
function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return <label className={`block ${className}`}><span className="mb-2 block text-[15px] font-bold text-[var(--color-text)]">{label}</span>{children}</label>;
}
function SummaryLine({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3"><span className="font-semibold text-white/62">{label}</span><b className="text-left text-white">{value}</b></div>;
}



