import Link from "next/link";
import { redirect } from "next/navigation";
import { createCustomer } from "@/lib/auth";

export const metadata = { title: "إنشاء حساب | وصلها لي" };

type RegisterSearchParams = Promise<{ error?: string }>;

export default async function RegisterPage({ searchParams }: { searchParams: RegisterSearchParams }) {
  const params = await searchParams;

  async function registerAction(formData: FormData) {
    "use server";
    const result = await createCustomer({
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      password: String(formData.get("password") || ""),
    });
    if (!result.ok) redirect(`/register?error=${encodeURIComponent(result.error)}`);
    redirect("/account/china-address");
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--color-bg)] px-4 py-6 text-[var(--color-text)] sm:px-6 sm:py-12">
      <section className="mx-auto max-w-md rounded-lg border border-[var(--color-border)] bg-white p-5 shadow-xl shadow-slate-900/8 sm:p-6">
        <Link href="/" className="text-sm font-bold text-[var(--color-primary)]">العودة للرئيسية</Link>
        <h1 className="mt-4 text-[26px] font-bold text-[var(--color-primary-dark)] sm:text-3xl">إنشاء حساب</h1>
        <p className="mt-2 text-sm font-semibold leading-7 text-[var(--color-muted)]">أنشئ حسابك للحصول على Customer ID وعنوانك في الصين.</p>
        {params.error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{params.error}</p>}
        <form action={registerAction} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-bold">الاسم<input name="name" required className="input" /></label>
          <label className="grid gap-2 text-sm font-bold">البريد الإلكتروني<input name="email" type="email" required className="input" /></label>
          <label className="grid gap-2 text-sm font-bold">رقم الجوال<input name="phone" inputMode="tel" className="input" /></label>
          <label className="grid gap-2 text-sm font-bold">كلمة المرور<input name="password" type="password" required minLength={8} className="input" /></label>
          <button className="h-12 rounded-lg bg-[var(--color-accent)] px-4 text-base font-bold text-[var(--color-primary-dark)] sm:h-14 sm:px-5">إنشاء الحساب</button>
        </form>
        <p className="mt-5 text-sm font-semibold text-[var(--color-muted)]">لديك حساب؟ <Link href="/login" className="font-bold text-[var(--color-primary)]">تسجيل الدخول</Link></p>
      </section>
    </main>
  );
}

