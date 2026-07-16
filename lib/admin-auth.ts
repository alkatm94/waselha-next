import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";

const ADMIN_COOKIE = "waselha_admin_session";
const SESSION_DAYS = 7;

type AdminRole = "ADMIN" | "OPERATOR";

type AdminAuthResult = { ok: true } | { ok: false; error: string };

export async function ensureBootstrapAdmin() {
  const count = await prisma.adminUser.count();
  if (count > 0) return;

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();
  const name = process.env.ADMIN_NAME?.trim() || "مدير النظام";
  if (!email || !password || password.length < 10) return;

  await prisma.adminUser.create({
    data: { name, email, passwordHash: hashPassword(password), role: "ADMIN" },
  });
}

export async function loginAdmin(input: { email: string; password: string }) {
  await ensureBootstrapAdmin();
  const email = input.email.trim().toLowerCase();
  const password = input.password.trim();
  const admin = await prisma.adminUser.findUnique({ where: { email } });

  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    return { ok: false, error: "بيانات دخول الإدارة غير صحيحة." } satisfies AdminAuthResult;
  }

  await createAdminSession(admin.id);
  return { ok: true } satisfies AdminAuthResult;
}

export async function createAdminSession(adminId: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.adminSession.create({ data: { token, adminId, expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    expires: expiresAt,
  });
}

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { token },
    include: { admin: true },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => null);
    return null;
  }

  return session.admin;
}

export async function requireAdmin(roles: AdminRole[] = ["ADMIN", "OPERATOR"]) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (!roles.includes(admin.role as AdminRole)) redirect("/admin/login?error=unauthorized");
  return admin;
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (token) await prisma.adminSession.deleteMany({ where: { token } });
  cookieStore.delete(ADMIN_COOKIE);
}
