"use client";

import Image from "next/image";
import { CheckCircle2, MapPin, MessageCircle, PackageCheck, ReceiptText, ShoppingBag, Warehouse } from "lucide-react";

const process = [
  ["01", "ترسل رابط المنتج"],
  ["02", "نراجع السعر والشحن"],
  ["03", "نشتري بعد موافقتك"],
  ["04", "نستلم ونشحن للسعودية"],
];

export function GlobalShoppingHero() {
  return (
    <section className="relative bg-white px-4 pb-8 pt-20 sm:px-6 sm:pt-28 lg:pb-14 lg:pt-32" aria-labelledby="global-shopping-title">
      <div className="absolute inset-x-0 bottom-0 h-28 bg-[var(--color-bg)]" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl gap-9 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="order-2 lg:order-1">
          <div className="relative overflow-hidden rounded-lg border border-[var(--color-border)] bg-[#e9eef2] shadow-2xl shadow-slate-900/10">
            <Image src="/images/hero-shipping-ar.png" alt="تغليف وشحن طلبات المتاجر العالمية إلى السعودية" width={900} height={720} priority className="aspect-[5/4] w-full object-cover" />
            <div className="absolute inset-x-3 bottom-3 rounded-lg border border-white/70 bg-white/94 p-3 sm:inset-x-4 sm:bottom-4 sm:p-4 shadow-xl shadow-slate-900/12 backdrop-blur">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[var(--color-primary)] text-[var(--color-accent)]"><PackageCheck className="h-5 w-5" /></span>
                <div>
                  <p className="text-sm font-bold text-[var(--color-accent-dark)]">من الرابط إلى التسليم</p>
                  <p className="mt-1 text-base font-bold leading-7 text-[var(--color-primary-dark)]">مراجعة، شراء، استلام، تغليف، وشحن بتحديثات واضحة عبر واتساب.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="order-1 text-right lg:order-2">
          <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-sm font-bold text-[var(--color-primary)]">
            <Warehouse className="h-4 w-4 text-[var(--color-accent-dark)]" /> خدمة شراء وشحن دولي إلى السعودية
          </div>
          <h1 id="global-shopping-title" className="mt-4 max-w-3xl text-[28px] font-bold leading-tight text-[var(--color-primary-dark)] sm:text-5xl lg:text-6xl">أرسل رابط المنتج، ووصلها لي تتولى الشراء والشحن حتى بابك.</h1>
          <p className="mt-4 max-w-2xl text-[15px] font-medium leading-7 text-[var(--color-muted)] sm:text-lg sm:leading-9">نراجع المنتج، نحسب التكلفة، نشتري بعد موافقتك، نستلم الطلب ونغلفه عند الحاجة، ثم نشحنه لك داخل السعودية مع تحديثات واضحة.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <a href="#product-link-form" className="group rounded-lg border border-[var(--color-accent)] bg-[var(--color-accent)] p-3 sm:p-4 text-[var(--color-primary-dark)] shadow-lg shadow-amber-900/12 transition hover:-translate-y-0.5 hover:bg-[var(--color-accent-dark)]">
              <span className="flex items-center gap-2 text-base font-bold sm:text-lg"><ShoppingBag className="h-5 w-5" />نشتري لك</span>
              <span className="mt-2 block text-sm font-semibold leading-7">أرسل الرابط، نراجع التكلفة، ونشتري بعد موافقتك.</span>
            </a>
            <a href="/account/china-address" className="group rounded-lg border border-[var(--color-border)] bg-white p-3 sm:p-4 text-[var(--color-primary)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--color-accent)]">
              <span className="flex items-center gap-2 text-base font-bold sm:text-lg"><MapPin className="h-5 w-5 text-[var(--color-accent-dark)]" />اشتر بنفسك واحصل على عنوانك في الصين</span>
              <span className="mt-2 block text-sm font-semibold leading-7 text-[var(--color-muted)]">أنشئ حسابك وخذ Customer ID لاستخدامه مع عنوان المستودع.</span>
            </a>
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <a href="#example-order" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border sm:h-12 border-[var(--color-border)] bg-white px-5 text-sm font-bold text-[var(--color-primary)] transition hover:border-[var(--color-accent)]"><ReceiptText className="h-4 w-4" />شاهد مثال تكلفة</a>
            <a href="#product-importer" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border sm:h-12 border-[var(--color-border)] bg-white px-5 text-sm font-bold text-[var(--color-primary)] transition hover:border-[var(--color-accent)]"><MessageCircle className="h-4 w-4" />محلل رابط المنتج</a>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {process.map(([number, label]) => <div key={number} className="flex min-h-16 items-center gap-3 rounded-lg border border-[var(--color-border)] bg-white p-3 shadow-sm"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--color-primary)] text-sm font-bold text-[var(--color-accent)]">{number}</span><b className="text-[15px] text-[var(--color-text)]">{label}</b></div>)}
          </div>
          <div className="mt-5 flex items-center gap-2 text-sm font-bold text-[var(--color-muted)]"><CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" />السعر النهائي يرسل بعد مراجعة الرابط والتوفر والشحن.</div>
        </div>
      </div>
    </section>
  );
}


