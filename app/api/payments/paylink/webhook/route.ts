import { timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { PaymentFlowError, reconcilePayment } from "@/lib/payments/payment-service";
import { PaylinkError } from "@/lib/payments/paylink";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(actual: string | null) {
  const token = process.env.PAYLINK_WEBHOOK_TOKEN;
  if (!token) throw new PaymentFlowError("MISSING_WEBHOOK_TOKEN", "Webhook غير مضبوط.", 500);
  const left = Buffer.from(actual || ""); const right = Buffer.from(`Bearer ${token}`);
  return left.length === right.length && timingSafeEqual(left, right);
}
function parse(body: unknown) {
  if (typeof body !== "object" || !body || Array.isArray(body)) throw new PaymentFlowError("INVALID_PAYLOAD", "بيانات Webhook غير صالحة.");
  const data = body as Record<string, unknown>;
  const required = (key: string) => { const value = data[key]; if (typeof value !== "string" || !value.trim() || value.length > 160) throw new PaymentFlowError("INVALID_PAYLOAD", `Invalid ${key}.`); return value.trim(); };
  let amount: Prisma.Decimal; try { amount = new Prisma.Decimal(String(data.amount)); if (!amount.isPositive() || amount.decimalPlaces() > 2) throw new Error(); } catch { throw new PaymentFlowError("INVALID_PAYLOAD", "Invalid amount."); }
  const apiVersion = required("apiVersion"); if (apiVersion.toLowerCase() !== "v2") throw new PaymentFlowError("UNSUPPORTED_VERSION", "Webhook v2 مطلوب.");
  return { amount, transactionNo: required("transactionNo"), merchantOrderNumber: required("merchantOrderNumber"), orderStatus: required("orderStatus"), paymentType: required("paymentType") };
}

export async function POST(request: Request) {
  try {
    if (!authorized(request.headers.get("authorization"))) return NextResponse.json({ received: false }, { status: 401 });
    const payload = parse(await request.json().catch(() => null));
    const result = await reconcilePayment(payload.transactionNo, "webhook", { amount: payload.amount, merchantOrderNumber: payload.merchantOrderNumber });
    return NextResponse.json({ received: true, alreadyProcessed: result.alreadyProcessed }, { status: 200 });
  } catch (error) {
    const code = error instanceof PaymentFlowError || error instanceof PaylinkError ? error.code : "INTERNAL_ERROR";
    console.error("[paylink-webhook] processing failed", { code });
    if (error instanceof PaymentFlowError && error.code === "ORDER_NOT_FOUND") return NextResponse.json({ received: true, ignored: true }, { status: 200 });
    const status = error instanceof PaymentFlowError ? error.status : error instanceof PaylinkError && error.retryable ? 502 : 500;
    return NextResponse.json({ received: false, code }, { status });
  }
}
