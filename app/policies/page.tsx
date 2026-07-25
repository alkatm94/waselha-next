import Link from "next/link";
import { PolicyPage } from "@/components/PolicyPage";

export const metadata = { title: "السياسات | وصلها لي" };

const links = [
  ["الشروط والأحكام", "/terms"],
  ["سياسة الخصوصية", "/privacy"],
  ["سياسة الطلب والدفع", "/order-policy"],
  ["سياسة الشحن والتوصيل", "/shipping-policy"],
  ["سياسة الإلغاء والاسترجاع", "/refund-policy"],
  ["المنتجات غير المقبولة", "/prohibited-items"],
];

export default function PoliciesPage() {
  return (
    <PolicyPage title="السياسات" intro="روابط السياسات الأساسية لخدمة وصلها لي." sections={[]}>
      <article className="rounded-lg border border-black/10 bg-white p-6 shadow-sm md:p-8">
        <div className="grid gap-3 sm:grid-cols-2">
          {links.map(([label, href]) => <Link key={href} href={href} className="rounded-lg bg-[#f5f7fb] p-4 text-sm font-bold text-[#111827] transition hover:bg-[#eef3f7]">{label}</Link>)}
        </div>
      </article>
    </PolicyPage>
  );
}