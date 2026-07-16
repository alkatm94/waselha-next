import Link from "next/link";
import { redirect } from "next/navigation";
import { loginCustomer } from "@/lib/auth";

export const metadata = { title: "تسجيل الدخول | وصلها لي" };

type LoginSearchParams = Promise<{ error?: string; next?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: LoginSearchParams }) {
  const params = await searchParams;

  async function loginAction(formData: FormData) {
    "use server";
    const next = String(formData.get("next") || "/account/china-address");
    const result = await loginCustomer({
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
    });
    if (!result.ok) redirect(`/login?error=${encodeURIComponent(result.error)}&next=${encodeURIComponent(next)}`);
    redirect(next.startsWith("/") ? next : "/account/china-address");
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--color-bg)] px-4 py-6 text-[var(--color-text)] sm:px-6 sm:py-12">
      <section className="mx-auto max-w-md rounded-lg border border-[var(--color-border)] bg-white p-5 shadow-xl shadow-slate-900/8 sm:p-6">
        <Link href="/" className="text-sm font-bold text-[var(--color-primary)]">العودة للرئيسية</Link>
        <h1 className="mt-4 text-[26px] font-bold text-[var(--color-primary-dark)] sm:text-3xl">تسجيل الدخول</h1>
        <p className="mt-2 text-sm font-semibold leading-7 text-[var(--color-muted)]">ادخل إلى حسابك لعرض عنوانك في الصين.</p>
        {params.error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{params.error}</p>}
        <form action={loginAction} className="mt-6 grid gap-4">
          <input type="hidden" name="next" value={params.next || "/account/china-address"} />
          <label className="grid gap-2 text-sm font-bold">البريد الإلكتروني<input name="email" type="email" required className="input" /></label>
          <label className="grid gap-2 text-sm font-bold">كلمة المرور<input name="password" type="password" required className="input" /></label>
          <button className="h-12 rounded-lg bg-[var(--color-accent)] px-4 text-base font-bold text-[var(--color-primary-dark)] sm:h-14 sm:px-5">دخول</button>
        </form>
        <p className="mt-5 text-sm font-semibold text-[var(--color-muted)]">ليس لديك حساب؟ <Link href="/register" className="font-bold text-[var(--color-primary)]">إنشاء حساب جديد</Link></p>
      </section>
    </main>
  );
}

