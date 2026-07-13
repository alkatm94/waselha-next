"use client";

import Image from "next/image";
import { CheckCircle2, MessageCircle, PackageCheck, PackagePlus, Truck } from "lucide-react";

const HERO_IMAGE = {
  src: "/images/hero-shipping-ar.png",
  alt: "عميلة تتسوق من المتاجر العالمية مع خدمة شحن الطلبات إلى السعودية عبر وصلها لي",
};

const heroPoints = [
  "أرسل رابط المنتج من أي متجر عالمي.",
  "نساعدك في الشراء والاستلام من المورد.",
  "نجمع شحناتك لتقليل تكلفة الشحن قدر الإمكان.",
];

const featureStrip = [
  { label: "شحن إلى جميع مدن السعودية", icon: Truck },
  { label: "تجميع الشحنات لتوفير التكلفة", icon: PackagePlus },
  { label: "دعم ومتابعة عبر واتساب", icon: MessageCircle },
];

export function GlobalShoppingHero() {
  return (
    <section className="relative bg-white px-4 pb-10 pt-[7.5rem] sm:px-6 lg:pb-12 lg:pt-[8.5rem]" aria-labelledby="global-shopping-title">
      <div className="absolute inset-x-0 bottom-0 h-36 bg-[var(--color-bg)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-8 lg:grid-cols-[0.94fr_1.06fr] lg:gap-12">
          <div className="order-2 lg:order-1">
            <div className="relative overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-2xl shadow-slate-900/10 transition duration-300 hover:-translate-y-1 hover:shadow-slate-900/14 sm:p-4">
              <Image
                src={HERO_IMAGE.src}
                alt={HERO_IMAGE.alt}
                width={900}
                height={720}
                priority
                className="aspect-[5/4] w-full rounded-lg object-cover"
              />
              <div className="absolute bottom-6 right-6 max-w-[76%] rounded-lg border border-white/70 bg-white/92 p-4 shadow-xl shadow-slate-900/12 backdrop-blur">
                <p className="text-sm font-bold text-[var(--color-accent-dark)]">من الرابط إلى باب بيتك</p>
                <p className="mt-1 text-base font-bold leading-7 text-[var(--color-primary-dark)]">نراجع الطلب، ننسق الشراء، ونتابع الشحن حتى وصوله.</p>
              </div>
            </div>
          </div>

          <div className="order-1 text-right lg:order-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-sm font-bold text-[var(--color-primary)] shadow-sm">
              <PackageCheck className="h-4 w-4 text-[var(--color-accent-dark)]" aria-hidden="true" />
              خدمة شراء وشحن إلى السعودية
            </div>

            <h1 id="global-shopping-title" className="mt-5 max-w-3xl text-3xl font-bold leading-tight text-[var(--color-primary-dark)] sm:text-4xl lg:text-5xl">
              تسوّق من المتاجر العالمية، ونحن نوصل طلبك إلى
              <span className="text-[var(--color-accent-dark)]"> باب منزلك في السعودية.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-lg font-medium leading-9 text-[var(--color-muted)] sm:text-xl">
              أرسل لنا رابط المنتج من المتجر الذي تريده، وسنتولى مساعدتك في الشراء والشحن بسهولة.
            </p>

            <ul className="mt-7 grid gap-3" aria-label="مميزات خدمة وصلها لي">
              {heroPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-white px-4 py-3 text-base font-bold leading-7 text-[var(--color-text)] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:shadow-md">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[var(--color-success)]" aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <a
                href="#product-link-form"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-7 text-base font-bold text-white shadow-lg shadow-slate-950/15 transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-primary-dark)] focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]/30"
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                ابدأ بطلب منتجك
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-3 rounded-lg border border-[var(--color-border)] bg-white p-3 shadow-lg shadow-slate-900/6 sm:grid-cols-3">
          {featureStrip.map(({ label, icon: Icon }) => (
            <div key={label} className="flex min-h-16 items-center gap-3 rounded-lg bg-[var(--color-surface)] px-4 py-3 text-[15px] font-bold text-[var(--color-primary)] transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--color-primary)] text-[var(--color-accent)]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

