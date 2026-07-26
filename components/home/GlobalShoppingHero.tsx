"use client";

import Image from "next/image";
import { Calculator, Check, MessageCircle } from "lucide-react";

const trustItems = ["مراجعة قبل الشراء", "تكلفة واضحة", "متابعة حتى الاستلام"];

export function GlobalShoppingHero() {
  return (
    <section className="bg-white px-4 pb-10 pt-24 sm:px-6 sm:pb-14 sm:pt-28 lg:pt-32" aria-labelledby="home-hero-title">
      <div className="mx-auto grid max-w-[1220px] gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div className="order-2 lg:order-1">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#e8ecee]">
            <Image src="/images/home/shipping-fulfillment.webp" alt="موظف شحن يجهز طرود العملاء للنقل والتوصيل" fill priority quality={90} sizes="(max-width: 1023px) 100vw, 48vw" className="object-cover" />
          </div>
          <p className="mt-3 text-xs font-medium text-[var(--color-muted)]">تجهيز الطلبات ومتابعة الشحن حتى وصولها إلى السعودية.</p>
        </div>
        <div className="order-1 text-right lg:order-2">
          <p className="text-sm font-semibold text-[var(--color-accent-dark)]">شراء وشحن دولي إلى السعودية</p>
          <h1 id="home-hero-title" className="mt-4 max-w-2xl text-[34px] font-bold leading-[1.28] text-[var(--color-primary-dark)] sm:text-5xl lg:text-[56px]">أرسل رابط المنتج، ونشتريه ونشحنه إلى بابك</h1>
          <p className="mt-5 max-w-xl text-base font-normal leading-8 text-[var(--color-muted)] sm:text-lg">نراجع الرابط والسعر والتوفر، ونوضح لك التكلفة قبل الشراء، ثم نتابع طلبك حتى وصوله إلى السعودية.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a href="#product-link-form" className="inline-flex h-[50px] items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-6 font-semibold text-[var(--color-primary-dark)] transition hover:bg-[var(--color-accent-dark)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"><MessageCircle className="h-5 w-5" />أرسل رابط المنتج</a>
            <a href="#calculator" className="inline-flex h-[50px] items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-6 font-semibold text-[var(--color-primary)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"><Calculator className="h-5 w-5" />احسب التكلفة</a>
          </div>
          <ul className="mt-8 grid gap-3 text-sm font-medium text-[var(--color-text)] sm:grid-cols-3">
            {trustItems.map((item) => <li key={item} className="flex items-center gap-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#eef4f6] text-[var(--color-primary)]"><Check className="h-3.5 w-3.5" /></span>{item}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
