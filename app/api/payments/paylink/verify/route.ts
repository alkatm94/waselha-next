import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reconcilePayment } from "@/lib/payments/payment-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  const body: unknown = await request.json().catch(() => null);
  const orderNumber = typeof body === "object" && body && "orderNumber" in body && typeof body.orderNumber === "string" ? body.orderNumber.trim() : "";
  const order = await prisma.purchaseOrder.findFirst({ where: { customerId: customer.id, orderNumber }, select: { paylinkTransactionNo: true } });
  if (!order?.paylinkTransactionNo) return NextResponse.json({ error: "لا توجد عملية دفع مرتبطة بهذا الطلب." }, { status: 404 });
  try { return NextResponse.json(await reconcilePayment(order.paylinkTransactionNo, "manual-check")); }
  catch (error) { console.error("[paylink-verify] failed", { code: error instanceof Error && "code" in error ? String(error.code) : "UNKNOWN" }); return NextResponse.json({ error: "تعذر التحقق من الدفع حاليًا." }, { status: 502 }); }
}
