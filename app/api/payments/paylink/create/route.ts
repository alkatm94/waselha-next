import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { createPaymentForOrder, PaymentFlowError } from "@/lib/payments/payment-service";
import { PaylinkError } from "@/lib/payments/paylink";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  try {
    const body: unknown = await request.json();
    const orderNumber = typeof body === "object" && body && "orderNumber" in body && typeof body.orderNumber === "string" ? body.orderNumber.trim() : "";
    if (!/^WPO-\d{4}-\d{6}$/.test(orderNumber)) return NextResponse.json({ error: "رقم الطلب غير صالح." }, { status: 400 });
    const result = await createPaymentForOrder(customer.id, orderNumber);
    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof PaymentFlowError ? error.status : error instanceof PaylinkError && error.retryable ? 503 : 500;
    const message = error instanceof PaymentFlowError || error instanceof PaylinkError ? error.message : "تعذر إنشاء رابط الدفع حاليًا.";
    console.error("[paylink-create] failed", { code: error instanceof PaymentFlowError || error instanceof PaylinkError ? error.code : "UNKNOWN" });
    return NextResponse.json({ error: message }, { status });
  }
}
