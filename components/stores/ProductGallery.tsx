"use client";

import Image from "next/image";
import { ExternalLink, ImageIcon, Maximize2, X } from "lucide-react";
import { useState } from "react";

export function ProductGallery({
  images,
  productName,
  originalUrl,
}: {
  images: string[];
  productName: string;
  originalUrl: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const activeImage = images[activeIndex] || null;

  function selectImage(index: number) {
    setActiveIndex(index);
    setLoaded(false);
    setFailed(false);
  }

  if (!activeImage || failed) {
    return (
      <section className="grid aspect-square min-h-[320px] place-items-center rounded-xl border border-[var(--color-border)] bg-white p-7 text-center">
        <div>
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--color-bg)] text-[var(--color-muted)]">
            <ImageIcon className="h-7 w-7" />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-[var(--color-text)]">صورة المنتج غير متوفرة حاليًا</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">يمكنك مراجعة الصور والتفاصيل في صفحة المنتج الأصلية.</p>
          <a href={originalUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-primary)] hover:border-[var(--color-primary)]">
            <ExternalLink className="h-4 w-4" />
            فتح المنتج الأصلي
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="min-w-0">
      <button type="button" onClick={() => setLightboxOpen(true)} className="group relative block aspect-square w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-white" aria-label="فتح صورة المنتج بحجم أكبر">
        {!loaded && <span className="absolute inset-0 animate-pulse bg-slate-100" aria-label="جار تحميل صورة المنتج" />}
        <Image src={activeImage} alt={productName} fill priority quality={90} sizes="(max-width: 1024px) 100vw, 590px" className={`object-contain p-4 transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`} unoptimized onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
        <span className="absolute bottom-3 left-3 grid h-10 w-10 place-items-center rounded-full border border-[var(--color-border)] bg-white/95 text-[var(--color-primary)] opacity-90 transition group-hover:opacity-100">
          <Maximize2 className="h-4 w-4" />
        </span>
      </button>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2" aria-label="صور المنتج المصغرة">
          {images.map((image, index) => (
            <button key={`${image}-${index}`} type="button" onClick={() => selectImage(index)} className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-white ${activeIndex === index ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]" : "border-[var(--color-border)] hover:border-[var(--color-muted)]"}`} aria-label={`عرض صورة المنتج ${index + 1}`}>
              <Image src={image} alt={`${productName} - صورة ${index + 1}`} fill sizes="80px" className="object-contain p-1.5" unoptimized />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/80 p-4" role="dialog" aria-modal="true" aria-label="صورة المنتج بحجم أكبر">
          <button type="button" onClick={() => setLightboxOpen(false)} className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white text-[var(--color-primary)]" aria-label="إغلاق الصورة">
            <X className="h-5 w-5" />
          </button>
          <div className="relative h-[85vh] w-full max-w-5xl">
            <Image src={activeImage} alt={productName} fill sizes="90vw" className="object-contain" unoptimized />
          </div>
        </div>
      )}
    </section>
  );
}
