"use client";

import Image from "next/image";
import { useState } from "react";

export function StoreLogo({ src, name, compact = false }: { src: string; name: string; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={compact ? "relative flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200/80 bg-white" : "relative flex h-24 w-full items-center justify-center overflow-hidden rounded-lg border border-slate-200/80 bg-white px-5 py-4 sm:h-28"}>
      {failed ? <span className={`${compact ? "text-[10px]" : "text-base"} text-center font-bold text-[var(--brand-navy)]`}>{name}</span> : <Image src={src} alt={`شعار ${name}`} fill sizes="(max-width: 768px) 80vw, (max-width: 1280px) 40vw, 28vw" className={compact ? "object-contain p-2" : "object-contain p-4"} onError={() => setFailed(true)} />}
    </div>
  );
}