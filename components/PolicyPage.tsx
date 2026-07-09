import Link from "next/link";
import type { ReactNode } from "react";

export type PolicySection = {
  title?: string;
  body?: string;
  items?: string[];
  note?: string;
};

const policyLinks = [
  ["الشروط والأحكام", "/terms"],
  ["سياسة الخصوصية", "/privacy"],
  ["سياسة الطلب والدفع", "/order-policy"],
  ["سياسة الشحن والتوصيل", "/shipping-policy"],
  ["سياسة الإلغاء والاسترجاع", "/refund-policy"],
  ["المنتجات غير المقبولة", "/prohibited-items"],
];

export function PolicyPage({
  title,
  intro,
  sections,
  children,
}: {
  title: string;
  intro?: string;
  sections: PolicySection[];
  children?: ReactNode;
}) {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f5f7fb] text-[#111827]">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#111827] text-lg font-bold text-[#f4c76b]">و</span>
            <span className="text-xl font-bold">وصلها لي</span>
          </Link>
          <Link href="/" className="rounded-full bg-[#f4c76b] px-5 py-3 text-sm font-bold text-[#111827] transition hover:bg-[#e7bd5d]">
            العودة للرئيسية
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <div className="rounded-lg border border-black/10 bg-white p-6 shadow-sm md:p-10">
          <p className="text-sm font-bold text-[#9f741b]">سياسات وصلها لي</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-[#0f172a] md:text-5xl">{title}</h1>
          {intro && <p className="mt-5 max-w-3xl text-base font-medium leading-8 text-[#6b7280]">{intro}</p>}
        </div>

        <div className="mt-6 grid gap-5">
          {sections.map((section, index) => (
            <article key={index} className="rounded-lg border border-black/10 bg-white p-6 shadow-sm md:p-8">
              {section.title && <h2 className="text-2xl font-bold text-[#111827]">{section.title}</h2>}
              {section.body && <p className="mt-4 text-base font-medium leading-8 text-[#4b5563]">{section.body}</p>}
              {section.items && (
                <ul className="mt-5 grid gap-3">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3 rounded-lg bg-[#f5f7fb] p-4 text-sm font-semibold leading-7 text-[#374151]">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#d7b46a]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {section.note && <p className="mt-5 rounded-lg bg-[#111827] p-4 text-sm font-bold leading-7 text-white">{section.note}</p>}
            </article>
          ))}
          {children}
        </div>
      </section>

      <footer className="border-t border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-8">
          <div className="flex flex-wrap gap-3 text-sm font-bold text-[#6b7280]">
            {policyLinks.map(([label, href]) => (
              <Link key={href} href={href} className="transition hover:text-[#111827]">
                {label}
              </Link>
            ))}
          </div>
          <p className="mt-5 text-sm font-semibold text-[#6b7280]">© وصلها لي — خدمة وسيط طلب من الخارج للسعودية</p>
        </div>
      </footer>
    </main>
  );
}
