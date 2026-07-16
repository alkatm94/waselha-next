import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "waselha_session";
const SESSION_DAYS = 30;

export type AuthResult = { ok: true } | { ok: false; error: string };

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function formatCustomerId(id: number) {
  return `WL${String(100000 + id).padStart(6, "0")}`;
}

export async function createCustomer(input: { name: string; email: string; phone?: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const phone = input.phone?.trim() || null;
  const password = input.password.trim();

  if (!name || !email || !password) return { ok: false, error: "أكمل الاسم والبريد وكلمة المرور." } satisfies AuthResult;
  if (password.length < 8) return { ok: false, error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل." } satisfies AuthResult;

  const exists = await prisma.customer.findUnique({ where: { email } });
  if (exists) return { ok: false, error: "يوجد حساب بهذا البريد الإلكتروني." } satisfies AuthResult;

  const passwordHash = hashPassword(password);
  const customer = await prisma.$transaction(async (tx) => {
    const created = await tx.customer.create({
      data: { name, email, phone, passwordHash, customerId: `PENDING-${randomBytes(8).toString("hex")}` },
    });
    return tx.customer.update({ where: { id: created.id }, data: { customerId: formatCustomerId(created.id) } });
  });

  await createSession(customer.id);
  return { ok: true } satisfies AuthResult;
}

export async function loginCustomer(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const password = input.password.trim();
  const customer = await prisma.customer.findUnique({ where: { email } });

  if (!customer || !verifyPassword(password, customer.passwordHash)) {
    return { ok: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." } satisfies AuthResult;
  }

  await createSession(customer.id);
  return { ok: true } satisfies AuthResult;
}

export async function createSession(customerId: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.customerSession.create({ data: { token, customerId, expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentCustomer() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.customerSession.findUnique({
    where: { token },
    include: { customer: true },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.customerSession.delete({ where: { id: session.id } }).catch(() => null);
    return null;
  }

  return session.customer;
}

export async function requireCustomer(nextPath = "/account/china-address") {
  const customer = await getCurrentCustomer();
  if (!customer) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return customer;
}

export async function logoutCustomer() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await prisma.customerSession.deleteMany({ where: { token } });
  cookieStore.delete(SESSION_COOKIE);
}

