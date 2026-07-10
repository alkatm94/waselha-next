"use client";

import Image from "next/image";
import { useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Calculator, CheckCircle2, ChevronDown, ClipboardCheck, ExternalLink, Globe2, Menu, MessageCircle, PackageCheck, Search, SearchCheck, Send, ShieldCheck, Store, Truck, X } from "lucide-react";
import { ProductLinkImporter, type ImportedProduct } from "@/components/ProductLinkImporter";

type Country = "china" | "japan" | "usa" | "other";
type Currency = "USD" | "CNY" | "JPY" | "SAR";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "966500000000";

const currencyRates: Record<Currency, number> = { USD: 3.75, CNY: 0.53, JPY: 0.026, SAR: 1 };
const countryLabels: Record<Country, string> = { china: "الصين", japan: "اليابان", usa: "أمريكا", other: "دولة أخرى" };
const currencyLabels: Record<Currency, string> = { USD: "دولار USD", CNY: "يوان CNY", JPY: "ين JPY", SAR: "ريال SAR" };

const navItems = [["المنصات", "#platforms"], ["الحاسبة", "#calculator"], ["كيف نعمل؟", "#how"], ["الأسئلة", "#faq"]];
const quickLinks = [["المنصات", "#platforms"], ["الحاسبة", "#calculator"], ["كيف نعمل؟", "#how"], ["الأسئلة الشائعة", "#faq"]];
const policyLinks = [
  ["الشروط والأحكام", "/terms"],
  ["سياسة الخصوصية", "/privacy"],
  ["سياسة الطلب والدفع", "/order-policy"],
  ["سياسة الشحن والتوصيل", "/shipping-policy"],
  ["سياسة الإلغاء والاسترجاع", "/refund-policy"],
  ["المنتجات غير المقبولة", "/prohibited-items"],
];

const platforms = [
  { name: "Alibaba", initials: "AL", url: "https://www.alibaba.com", desc: "موردين وطلبات كبيرة ومنتجات بالجملة.", type: "موردين وجملة" },
  { name: "AliExpress", initials: "AE", url: "https://www.aliexpress.com", desc: "منتجات فردية وطلبات صغيرة من متاجر عالمية.", type: "تجزئة عالمية" },
  { name: "Taobao", initials: "TB", url: "https://www.taobao.com", desc: "منتجات صينية متنوعة بأسعار محلية.", type: "سوق صيني" },
  { name: "1688", initials: "16", url: "https://www.1688.com", desc: "مصانع وموردين داخل الصين بأسعار تنافسية.", type: "جملة صينية" },
  { name: "Goofish / Xianyu", initials: "GX", url: "https://www.goofish.com", desc: "منتجات صينية مستعملة ونادرة.", type: "مستعمل ونادر" },
  { name: "Mercari Japan", initials: "MJ", url: "https://jp.mercari.com", desc: "منتجات يابانية مستعملة ونادرة.", type: "سوق ياباني" },
];

const steps: { title: string; desc: string; icon: LucideIcon }[] = [
  { title: "أرسل الرابط", desc: "انسخ رابط المنتج من المتجر وأرسله لنا على واتساب.", icon: Send },
  { title: "نراجع المنتج والبائع", desc: "نتأكد من تفاصيل المنتج ووضوح بيانات البائع.", icon: SearchCheck },
  { title: "نرسل السعر النهائي", desc: "يصلك عرض واضح قبل تنفيذ عملية الشراء.", icon: ClipboardCheck },
  { title: "نشتري ونتابع الطلب", desc: "بعد موافقتك نكمل الشراء ونرسل لك التحديثات.", icon: Truck },
];

const reasons: { title: string; desc: string; icon: LucideIcon }[] = [
  { title: "مراجعة قبل الدفع", desc: "نتأكد من الرابط والبائع وتفاصيل المنتج قبل إرسال العرض.", icon: ShieldCheck },
  { title: "سعر واضح قبل الشراء", desc: "تعرف التكلفة النهائية قبل تنفيذ الطلب.", icon: CheckCircle2 },
  { title: "تحديثات واتساب", desc: "تواصل مباشر وسريع حسب تفاصيل طلبك.", icon: MessageCircle },
  { title: "خدمة موجهة للسعودية", desc: "تجربة مرتبة من أول رابط حتى وصول الطلب.", icon: Globe2 },
];

const faqs = [
  ["هل السعر في الحاسبة نهائي؟", "لا، السعر تقديري ويتم تأكيد السعر النهائي بعد مراجعة الرابط."],
  ["هل أقدر أطلب من أي موقع؟", "نراجع الرابط أولًا ونتأكد هل المنتج مناسب للشراء والشحن."],
  ["متى أدفع؟", "بعد إرسال العرض النهائي وموافقتك عليه."],
  ["هل تتابعون الشحنة؟", "نعم حسب طبيعة الطلب والتفاصيل المتفق عليها."],
];

function formatSar(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value)));
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [productUrl, setProductUrl] = useState("");
  const [productName, setProductName] = useState("");
  const [country, setCountry] = useState<Country>("china");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [price, setPrice] = useState<number | string>(400);
  const [productStoreName, setProductStoreName] = useState("");
  const [productImage, setProductImage] = useState("");
  const [priceHelper, setPriceHelper] = useState("");
  const [weight, setWeight] = useState(3);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [searchProductName, setSearchProductName] = useState("");
  const [searchBudget, setSearchBudget] = useState("");
  const [searchCountry, setSearchCountry] = useState("غير محدد");
  const [searchNotes, setSearchNotes] = useState("");

  const estimate = useMemo(() => {
    const shippingByCountry: Record<Country, number> = { china: 38, japan: 52, usa: 65, other: 70 };
    const productSar = Number(price || 0) * currencyRates[currency];
    const shippingSar = Math.max(80, Number(weight || 0) * shippingByCountry[country]);
    return { productSar, shippingSar, total: productSar + shippingSar };
  }, [price, weight, currency, country]);

  function openLinkQuoteWhatsApp() {
    const message = "السلام عليكم، عندي رابط منتج وأرغب بمراجعته ومعرفة السعر النهائي قبل الشراء.";
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
  }

  function handleImportedProduct(product: ImportedProduct) {
    setProductUrl(product.originalUrl);
    setProductName(product.title);
    setProductStoreName(product.storeName);
    setProductImage(product.image || "");
    setCurrency(product.currency);
    setCountry("china");

    if (typeof product.price === "number" && product.price > 0) {
      setPrice(product.price);
      setPriceHelper("");
    } else {
      setPrice("");
      setPriceHelper("تعذر جلب السعر تلقائيًا، أدخل سعر المنتج يدويًا");
    }

    window.requestAnimationFrame(() => {
      document.querySelector("#calculator")?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (!product.price) {
        window.setTimeout(() => document.querySelector<HTMLInputElement>("#product-price-input")?.focus(), 650);
      }
    });
  }
  function openPlatformWhatsApp(platformName: string) {
    const message = `السلام عليكم، أرغب بطلب منتج من منصة ${platformName}. سأرسل لكم رابط المنتج للمراجعة وإرسال السعر النهائي.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
  }

  function openWhatsApp() {
    const message = `السلام عليكم، أرغب بطلب منتج من الخارج عبر وصلها لي.\n\nالاسم: ${customerName || "غير محدد"}\nالجوال: ${customerPhone || "غير محدد"}\nاسم المنتج: ${productName || "غير محدد"}\nرابط المنتج: ${productUrl || "غير مرفق"}\nدولة الطلب: ${countryLabels[country]}\nسعر المنتج: ${price || "غير محدد"} ${currencyLabels[currency]}\nالمتجر: ${productStoreName || "غير محدد"}\nصورة المنتج: ${productImage || "غير متاحة"}\nالوزن التقريبي: ${weight} KG\nالسعر التقديري الظاهر لي: ${formatSar(estimate.total)} ريال\n\nأرغب بمراجعة الرابط وإرسال السعر النهائي.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
  }

  function openSearchWhatsApp() {
    const message = `السلام عليكم، ما عندي رابط وأرغب أن تبحثوا لي عن منتج.\n\nاسم المنتج:\n${searchProductName || "غير محدد"}\n\nالميزانية التقريبية:\n${searchBudget || "غير محددة"}\n\nالدولة المفضلة:\n${searchCountry}\n\nملاحظات:\n${searchNotes || "لا توجد"}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
  }

  function openFooterWhatsApp() {
    const message = "السلام عليكم، أرغب بالاستفسار عن خدمة وصلها لي وطلب منتج من الخارج.";
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
  }

  return (
    <main dir="rtl" className="min-h-screen overflow-hidden bg-[#F8F5EF] text-[#0F172A]">
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} openLinkQuoteWhatsApp={openLinkQuoteWhatsApp} />

      <section id="home" className="relative overflow-hidden px-5 pb-16 pt-28 md:pb-20 md:pt-36">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#F8F5EF_0%,#F7F8FA_48%,#E9EEF5_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_20%,rgba(214,168,79,0.18),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(15,23,42,0.10),transparent_30%),linear-gradient(to_right,rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.055)_1px,transparent_1px)] bg-[size:auto,auto,42px_42px,42px_42px]" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div className="text-center lg:text-right">
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-[#D6A84F]/35 bg-white/75 px-4 py-2 text-sm font-bold text-[#8A641C] shadow-sm backdrop-blur lg:mx-0"><PackageCheck className="h-4 w-4" />خدمة وسيط طلب من الخارج للسعودية</div>
            <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight text-[#0f172a] md:text-6xl lg:mx-0">اطلب أي منتج من الخارج ونوصله لك للسعودية</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-9 text-[#4b5563] lg:mx-0">أرسل رابط المنتج من الصين، اليابان، أمريكا أو أي متجر عالمي، ونراجع لك السعر ونرسل عرض نهائي قبل الشراء.</p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <button onClick={openLinkQuoteWhatsApp} className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#111827] px-7 text-base font-bold text-white shadow-xl shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-[#0F172A]"><MessageCircle className="h-5 w-5" />أرسل الرابط الآن</button>
              <a href="#calculator" className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-[#111827]/15 bg-white/85 px-7 text-base font-bold shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-[#D6A84F] hover:text-[#8A641C]"><Calculator className="h-5 w-5" />احسب السعر التقريبي</a>
            </div>
          </div>
          <HeroPreview />
        </div>
      </section>

      <ProductLinkImporter onUseProduct={handleImportedProduct} />

      <section id="platforms" className="bg-[#F7F8FA] px-5 py-16">
        <div className="mx-auto max-w-7xl">
          <SectionHeading eyebrow="منصات مدعومة" title="اطلب من أشهر المنصات العالمية" desc="أرسل لنا رابط المنتج من أي منصة، ونراجع لك السعر والتوفر قبل الشراء." />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {platforms.map((platform) => <PlatformCard key={platform.name} platform={platform} onSend={openPlatformWhatsApp} />)}
          </div>
          <p className="mt-5 text-center text-sm font-bold text-[#64748B]">وندعم أيضًا Amazon و Yahoo Japan ومنصات عالمية أخرى حسب رابط المنتج.</p>
        </div>
      </section>

      <section id="calculator" className="relative overflow-hidden bg-[#EEF2F6] px-5 py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(214,168,79,0.13),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl">
          <SectionHeading eyebrow="حاسبة سعر تقديرية" title="احصل على تقدير سريع قبل إرسال الطلب" desc="السعر تقديري فقط، والسعر النهائي يرسل بعد مراجعة الرابط." />
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-lg border border-slate-900/10 bg-white p-5 shadow-xl shadow-slate-900/5 md:p-7">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="رابط المنتج" className="md:col-span-2">{productUrl ? <div className="flex flex-col gap-3 rounded-lg border border-slate-900/10 bg-[#F7F8FA] p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-[#0F172A]">تم حفظ رابط المنتج الكامل</p>{productStoreName && <p className="text-xs font-bold text-[#64748B]">{productStoreName}</p>}</div><div className="flex gap-2"><a href={productUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#D6A84F]/35 bg-white px-4 text-sm font-bold text-[#8A641C] transition hover:border-[#D6A84F]"><ExternalLink className="h-4 w-4" />فتح رابط المنتج</a><button type="button" onClick={() => { setProductUrl(""); setProductStoreName(""); setProductImage(""); }} className="h-11 rounded-full border border-slate-900/10 px-4 text-sm font-bold text-[#64748B]">تغيير</button></div></div> : <input value={productUrl} onChange={(e) => setProductUrl(e.target.value)} placeholder="ضع رابط المنتج هنا" className="input" />}</Field>
                <Field label="اسم المنتج"><input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="مثال: ساعة، قطعة سيارة، جهاز" className="input" /></Field>
                <Field label="دولة الطلب"><select value={country} onChange={(e) => setCountry(e.target.value as Country)} className="input"><option value="china">الصين</option><option value="japan">اليابان</option><option value="usa">أمريكا</option><option value="other">دولة أخرى</option></select></Field>
                <Field label="العملة"><select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="input"><option value="USD">دولار USD</option><option value="CNY">يوان CNY</option><option value="JPY">ين JPY</option><option value="SAR">ريال SAR</option></select></Field>
                <Field label="سعر المنتج"><input id="product-price-input" type="number" value={price} onChange={(e) => { setPrice(e.target.value); if (Number(e.target.value) > 0) setPriceHelper(""); }} className="input" />{priceHelper && <p className="mt-2 text-xs font-bold text-[#9f741b]">{priceHelper}</p>}</Field>
                <Field label="الوزن التقريبي"><input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="input" /></Field>
                <Field label="الاسم"><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="اختياري" className="input" /></Field>
                <Field label="رقم الجوال"><input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="اختياري" className="input" /></Field>
              </div>
              <button onClick={openWhatsApp} className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#25d366] px-6 text-base font-bold text-[#062d18] transition hover:-translate-y-0.5 hover:brightness-95"><MessageCircle className="h-5 w-5" />إرسال الطلب على واتساب</button>
            </div>
            <aside className="relative overflow-hidden rounded-lg border border-white/10 bg-[#0f172a] p-6 text-white shadow-2xl shadow-slate-950/20 md:p-8">
              <div className="absolute -left-16 -top-16 h-44 w-44 rounded-full bg-[#F2C66D]/20 blur-3xl" />
              <div className="relative">
                <span className="inline-flex rounded-full border border-[#F2C66D]/30 bg-[#F2C66D]/10 px-3 py-1 text-xs font-bold text-[#F2C66D]">تقدير سريع</span>
                <p className="mt-5 text-sm font-bold text-white/60">التقدير المبدئي</p>
                <h3 className="mt-2 text-2xl font-bold leading-tight">السعر التقديري</h3>
                <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-5">
                  <p className="text-5xl font-bold leading-none text-[#F2C66D] md:text-6xl">{formatSar(estimate.total)}<span className="mr-2 align-middle text-xl font-bold text-white">ريال</span></p>
                  <p className="mt-4 text-sm font-semibold leading-7 text-white/65">السعر تقديري فقط، والسعر النهائي يرسل بعد مراجعة الرابط.</p>
                </div>
                <div className="mt-5 space-y-3 text-sm">
                  <PriceLine label="سعر المنتج بالريال" value={estimate.productSar} />
                  <PriceLine label="التوصيل التقريبي" value={estimate.shippingSar} />
                  <PriceNoteLine label="رسوم الخدمة" value="تحدد بعد المراجعة" />
                  <PriceLine label="الإجمالي التقديري" value={estimate.total} strong />
                </div>
                <p className="mt-5 rounded-lg border border-[#F2C66D]/20 bg-[#F2C66D]/10 p-4 text-sm font-semibold leading-7 text-[#f8df9d]">يعتمد السعر النهائي على مراجعة رابط المنتج وتفاصيل الشحن.</p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="find-product" className="bg-[#F8F5EF] px-5 py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-6 rounded-lg border border-[#D6A84F]/20 bg-white/90 p-6 shadow-xl shadow-slate-900/5 lg:grid-cols-[0.8fr_1.2fr] lg:p-8">
          <div><p className="text-sm font-bold text-[#9f741b]">خدمة البحث</p><h2 className="mt-2 text-3xl font-bold text-[#0f172a]">ما عندك رابط؟ نبحث لك</h2><p className="mt-3 text-sm font-semibold leading-7 text-[#64748B]">اكتب اسم المنتج والميزانية التقريبية، ونرتب لك الطلب عبر واتساب.</p></div>
          <div className="grid gap-3 md:grid-cols-4"><input value={searchProductName} onChange={(e) => setSearchProductName(e.target.value)} placeholder="اسم المنتج" className="input" /><input value={searchBudget} onChange={(e) => setSearchBudget(e.target.value)} placeholder="الميزانية" className="input" /><select value={searchCountry} onChange={(e) => setSearchCountry(e.target.value)} className="input"><option>الصين</option><option>اليابان</option><option>أمريكا</option><option>غير محدد</option></select><input value={searchNotes} onChange={(e) => setSearchNotes(e.target.value)} placeholder="ملاحظات" className="input" /></div>
          <button onClick={openSearchWhatsApp} className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#111827] px-6 text-base font-bold text-white transition hover:-translate-y-0.5 hover:bg-black lg:col-start-2"><Search className="h-5 w-5" />اطلب البحث عبر واتساب</button>
        </div>
      </section>

      <section id="how" className="bg-[#F7F8FA] px-5 py-16">
        <div className="mx-auto max-w-7xl"><SectionHeading eyebrow="كيف نعمل؟" title="خطوات واضحة من الرابط حتى الطلب" desc="مسار مختصر وواضح، وكل خطوة هدفها توصيلك لقرار شراء مطمئن." />
          <div className="mt-8 grid gap-4 md:grid-cols-4">{steps.map((step, index) => <StepCard key={step.title} {...step} number={index + 1} />)}</div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0F172A] px-5 py-16 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(214,168,79,0.14),transparent_30%),linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:auto,56px_56px,56px_56px]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center"><p className="text-sm font-bold text-[#F2C66D]">لماذا وصلها لي؟</p><h2 className="mt-3 text-3xl font-bold leading-tight md:text-5xl">طلب أوضح وأسهل من الخارج</h2><p className="mt-4 text-base font-medium leading-8 text-slate-300">نختصر عليك المراجعة والتواصل والمتابعة، ونخلي القرار مبني على عرض واضح قبل الشراء.</p></div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{reasons.map(({ title, desc, icon: Icon }) => <div key={title} className="rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-xl shadow-black/10 backdrop-blur transition hover:-translate-y-1 hover:border-[#D6A84F]/50 hover:bg-white/[0.075]"><div className="grid h-11 w-11 place-items-center rounded-lg bg-[#F2C66D] text-[#0F172A]"><Icon className="h-5 w-5" /></div><h3 className="mt-5 text-xl font-bold text-white">{title}</h3><p className="mt-2 text-sm font-semibold leading-7 text-slate-300">{desc}</p></div>)}</div>
        </div>
      </section>

      <section id="faq" className="bg-[#F8F5EF] px-5 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="text-sm font-bold text-[#9f741b]">الأسئلة الشائعة</p><h2 className="mt-3 text-3xl font-bold leading-tight text-[#0f172a] md:text-5xl">قبل ما ترسل الرابط</h2></div><div className="rounded-lg border border-slate-900/10 bg-white px-5 shadow-lg shadow-slate-900/5">{faqs.map(([q, a]) => <FAQ key={q} q={q} a={a} />)}</div></div>
      </section>

      <section className="bg-[#F7F8FA] px-5 py-16"><div className="mx-auto max-w-7xl"><div className="relative overflow-hidden rounded-lg bg-[#111827] px-6 py-14 text-center text-white shadow-2xl shadow-slate-950/20 md:px-10"><div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(242,198,109,0.18),transparent_28%),linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:auto,64px_48px,64px_48px]" /><div className="relative"><h2 className="mx-auto max-w-3xl text-3xl font-bold leading-tight md:text-5xl">عندك رابط منتج؟ أرسله ونراجع لك السعر</h2><button onClick={openLinkQuoteWhatsApp} className="mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#F2C66D] px-8 text-base font-bold text-[#111827] shadow-lg shadow-[#F2C66D]/20 transition hover:-translate-y-0.5 hover:bg-[#D6A84F]"><MessageCircle className="h-5 w-5" />أرسل الرابط واتساب</button></div></div></div></section>

      <Footer openWhatsApp={openFooterWhatsApp} />
    </main>
  );
}

function Header({ menuOpen, setMenuOpen, openLinkQuoteWhatsApp }: { menuOpen: boolean; setMenuOpen: (value: boolean) => void; openLinkQuoteWhatsApp: () => void }) {
  return <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-900/10 bg-white/78 shadow-sm shadow-slate-900/5 backdrop-blur-xl"><div className="mx-auto max-w-7xl px-5"><nav className="flex items-center justify-between py-3"><a href="#home" className="flex items-center gap-3"><Image src="/images/logo.png" alt="وصلها لي" width={280} height={112} priority className="h-14 w-auto object-contain md:h-20" /></a><div className="hidden items-center gap-6 md:flex">{navItems.map(([label, href]) => <a key={href} href={href} className="text-sm font-bold text-[#334155] transition hover:text-[#8A641C]">{label}</a>)}<button onClick={openLinkQuoteWhatsApp} className="rounded-full bg-[#F2C66D] px-6 py-3 text-sm font-bold text-[#111827] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#D6A84F]">أرسل الرابط</button></div><button onClick={() => setMenuOpen(!menuOpen)} className="grid h-10 w-10 place-items-center rounded-full bg-[#F2C66D] text-[#111827] md:hidden" aria-label="فتح القائمة">{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></nav></div>{menuOpen && <div className="border-t border-slate-900/10 bg-white/95 px-5 pb-6 pt-2 shadow-lg backdrop-blur md:hidden"><div className="mx-auto flex max-w-7xl flex-col gap-4">{navItems.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)} className="py-2 text-base font-bold">{label}</a>)}<button onClick={() => { setMenuOpen(false); openLinkQuoteWhatsApp(); }} className="rounded-full bg-[#111827] px-6 py-4 text-sm font-bold text-white">أرسل الرابط واتساب</button></div></div>}</header>;
}

function Footer({ openWhatsApp }: { openWhatsApp: () => void }) {
  return (
    <footer className="bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-2 lg:grid-cols-[1.25fr_0.8fr_1fr_1fr] lg:py-16">
        <div>
          <a href="#home" className="inline-flex rounded-lg bg-white p-3 shadow-lg shadow-black/20">
            <Image src="/images/logo.png" alt="وصلها لي" width={220} height={88} className="h-12 w-auto object-contain md:h-14" />
          </a>
          <p className="mt-5 max-w-sm text-sm font-semibold leading-8 text-slate-300">خدمة وسيط طلب من الخارج للسعودية. أرسل رابط المنتج ونراجع لك السعر قبل الشراء.</p>
          <button onClick={openWhatsApp} className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#F2C66D] px-5 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-[#D6A84F]">
            <MessageCircle className="h-4 w-4" />
            أرسل الرابط واتساب
          </button>
        </div>

        <FooterColumn title="روابط سريعة" links={quickLinks} />
        <FooterColumn title="السياسات" links={policyLinks} />

        <div>
          <h3 className="text-base font-bold text-white">تواصل معنا</h3>
          <div className="mt-5 space-y-4 text-sm font-semibold leading-7 text-slate-300">
            <p>واتساب: تواصل عبر واتساب</p>
            <p>نستقبل روابط المنتجات ونراجعها قبل الشراء.</p>
          </div>
          <button onClick={openWhatsApp} className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#F2C66D]/40 px-5 text-sm font-bold text-[#F2C66D] transition hover:-translate-y-0.5 hover:border-[#F2C66D] hover:bg-[#F2C66D] hover:text-slate-950">
            <MessageCircle className="h-4 w-4" />
            فتح واتساب
          </button>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-sm font-semibold text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>© 2026 وصلها لي. جميع الحقوق محفوظة.</p>
          <p>خدمة وسيط طلب من الخارج للسعودية.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[][] }) {
  return (
    <div>
      <h3 className="text-base font-bold text-white">{title}</h3>
      <nav className="mt-5 grid gap-3 text-sm font-semibold text-slate-300">
        {links.map(([label, href]) => (
          <a key={href} href={href} className="transition hover:translate-x-[-2px] hover:text-[#F2C66D]">
            {label}
          </a>
        ))}
      </nav>
    </div>
  );
}
function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:ml-0 lg:mr-auto">
      <div className="absolute -inset-5 -z-10 rounded-full bg-[#D6A84F]/15 blur-3xl" />
      <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/45 p-2 shadow-2xl shadow-slate-950/15 backdrop-blur">
        <Image
          src="/images/hero-shipping-ar.png"
          alt="خدمة وصلها لي لطلب وشحن المنتجات من الخارج للسعودية"
          width={900}
          height={720}
          priority
          className="h-auto w-full rounded-xl object-cover"
        />
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) { return <div className="mx-auto max-w-3xl text-center"><p className="text-sm font-bold text-[#9f741b]">{eyebrow}</p><h2 className="mt-3 text-3xl font-bold leading-tight text-[#0F172A] md:text-5xl">{title}</h2><p className="mt-4 text-base font-medium leading-8 text-[#64748B]">{desc}</p></div>; }
function StepCard({ title, desc, icon: Icon, number }: { title: string; desc: string; icon: LucideIcon; number: number }) { return <div className="relative rounded-lg border border-slate-900/10 bg-white p-5 shadow-lg shadow-slate-900/5 transition hover:-translate-y-1 hover:border-[#D6A84F]/60 hover:shadow-xl"><div className="absolute right-8 top-16 h-[calc(100%-5rem)] w-px bg-gradient-to-b from-[#D6A84F]/50 to-transparent md:hidden" /><div className="flex items-center justify-between"><div className="grid h-11 w-11 place-items-center rounded-lg bg-[#111827] text-[#F2C66D]"><Icon className="h-5 w-5" /></div><span className="text-sm font-bold text-[#9f741b]">{String(number).padStart(2, "0")}</span></div><h3 className="mt-5 text-xl font-bold text-[#0F172A]">{title}</h3><p className="mt-3 text-sm font-semibold leading-7 text-[#64748B]">{desc}</p></div>; }
function PlatformCard({ platform, onSend }: { platform: (typeof platforms)[number]; onSend: (platformName: string) => void }) { return <article className="flex h-full flex-col rounded-lg border border-slate-900/10 bg-white p-5 shadow-lg shadow-slate-900/5 transition hover:-translate-y-1 hover:border-[#D6A84F]/70 hover:shadow-xl"><div className="flex items-start justify-between gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#111827] text-sm font-bold text-[#F2C66D]">{platform.initials}</div><span className="rounded-full border border-[#D6A84F]/20 bg-[#F8F5EF] px-3 py-1 text-xs font-bold text-[#7a5a15]">{platform.type}</span></div><h3 className="mt-5 text-2xl font-bold">{platform.name}</h3><p className="mt-2 text-sm font-semibold leading-7 text-[#64748B]">{platform.desc}</p><div className="mt-auto grid gap-3 pt-5"><a href={platform.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-900/10 px-4 text-sm font-bold transition hover:border-[#D6A84F] hover:text-[#8A641C]"><ExternalLink className="h-4 w-4" />زيارة الموقع</a><button onClick={() => onSend(platform.name)} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#111827] px-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#0F172A]"><MessageCircle className="h-4 w-4" />أرسل رابط من هنا</button></div></article>; }
function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) { return <label className={`block ${className}`}><span className="mb-2 block text-sm font-bold text-[#374151]">{label}</span>{children}</label>; }
function PriceLine({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) { return <div className={strong ? "flex items-center justify-between rounded-lg border border-[#F2C66D]/20 bg-white/5 px-4 py-3" : "flex items-center justify-between border-t border-white/10 pt-3"}><span className={strong ? "font-bold text-white" : "font-semibold text-white/60"}>{label}</span><b className={strong ? "text-[#F2C66D]" : "text-white"}>{formatSar(value)} ريال</b></div>; }
function PriceNoteLine({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between border-t border-white/10 pt-3"><span className="font-semibold text-white/60">{label}</span><b className="text-white">{value}</b></div>; }
function FAQ({ q, a }: { q: string; a: string }) { return <details className="group border-t border-black/10 py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-right text-lg font-bold">{q}<ChevronDown className="h-5 w-5 shrink-0 transition group-open:rotate-180" /></summary><p className="mt-4 text-sm font-semibold leading-8 text-[#64748B]">{a}</p></details>; }


















