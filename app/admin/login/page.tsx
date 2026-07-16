import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "دخول الإدارة | وصلها لي" };

type LoginSearchParams = Promise<{ error?: string }>;

export default async function AdminLoginPage({ searchParams }: { searchParams: LoginSearchParams }) {
  const params = await searchParams;

  async function loginAction(formData: FormData) {
    "use server";
    const result = await loginAdmin({ email: String(formData.get("email") || ""), password: String(formData.get("password") || "") });
    if (!result.ok) redirect(`/admin/login?error=${encodeURIComponent(result.error)}`);
    redirect("/admin");
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--text-primary)] sm:py-12">
      <section className="mx-auto max-w-md rounded-lg border border-[var(--border)] bg-white p-5 shadow-xl shadow-slate-900/8 sm:p-6">
        <Link href="/" className="text-sm font-bold text-[var(--brand-navy)]">وصلها لي</Link>
        <h1 className="mt-5 text-[26px] font-bold text-[var(--brand-navy)]">دخول لوحة الإدارة</h1>
        <p className="mt-2 text-sm font-semibold leading-7 text-[var(--text-secondary)]">هذه اللوحة مخصصة لفريق التشغيل فقط.</p>
        {params.error && <p className="mt-4 rounded-lg bg-[var(--danger-bg)] p-3 text-sm font-bold text-[var(--danger)]">{params.error === "unauthorized" ? "ليست لديك صلاحية كافية." : params.error}</p>}
        <form action={loginAction} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-bold">البريد الإلكتروني<input name="email" type="email" required className="input latin-text" dir="ltr" /></label>
          <label className="grid gap-2 text-sm font-bold">كلمة المرور<input name="password" type="password" required className="input latin-text" dir="ltr" /></label>
          <button className="h-12 rounded-lg bg-[var(--brand-gold)] px-4 text-base font-bold text-[var(--brand-navy)]">دخول</button>
        </form>
      </section>
    </main>
  );
}
