import { NextResponse } from "next/server";
import { reconcilePayment } from "@/lib/payments/payment-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const transactionNo = url.searchParams.get("TransactionNo") || url.searchParams.get("transactionNo");
  const orderNumber = url.searchParams.get("OrderNumber") || url.searchParams.get("orderNumber");
  if (!transactionNo) return NextResponse.redirect(new URL("/account/orders?payment=failed", url.origin));
  try {
    const result = await reconcilePayment(transactionNo, "callback");
    if (orderNumber && orderNumber !== result.orderNumber) return NextResponse.redirect(new URL("/account/orders?payment=failed", url.origin));
    const state = result.status === "PAID" ? "success" : result.status === "CANCELED" ? "canceled" : result.status === "PENDING" ? "pending" : "failed";
    return NextResponse.redirect(new URL(`/account/orders/${encodeURIComponent(result.orderNumber)}?payment=${state}`, url.origin));
  } catch (error) {
    console.error("[paylink-callback] verification failed", { code: error instanceof Error && "code" in error ? String(error.code) : "UNKNOWN" });
    return NextResponse.redirect(new URL("/account/orders?payment=failed", url.origin));
  }
}
