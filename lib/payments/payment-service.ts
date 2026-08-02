import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createPaylinkInvoice, getPaylinkInvoice, normalizePaylinkStatus, PaylinkError, type PaylinkInvoice, verifyPaylinkInvoice } from "@/lib/payments/paylink";

const PENDING_TTL_MS = 24 * 60 * 60 * 1000;

export class PaymentFlowError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 400) { super(message); this.name = "PaymentFlowError"; }
}

function appUrl() { const value = process.env.NEXT_PUBLIC_APP_URL; if (!value) throw new PaymentFlowError("MISSING_APP_URL", "رابط الموقع غير مضبوط.", 500); const url = new URL(value); if (!["http:", "https:"].includes(url.protocol)) throw new PaymentFlowError("INVALID_APP_URL", "رابط الموقع غير صالح.", 500); return url.origin; }
function mobile(value: string | null) { const digits = (value || "").replace(/\D/g, ""); const normalized = digits.startsWith("966") ? digits : digits.startsWith("05") ? `966${digits.slice(1)}` : digits.startsWith("5") ? `966${digits}` : ""; if (!/^9665\d{8}$/.test(normalized)) throw new PaymentFlowError("INVALID_MOBILE", "رقم الجوال المسجل غير صالح للدفع. حدّث بيانات حسابك أولًا."); return normalized; }
function safeFailure(error: unknown) { return error instanceof PaylinkError ? error.code : error instanceof PaymentFlowError ? error.code : "PAYMENT_REQUEST_FAILED"; }

export async function createPaymentForOrder(customerId: number, orderNumber: string) {
  const order = await prisma.purchaseOrder.findFirst({ where: { customerId, orderNumber }, include: { customer: true } });
  if (!order) throw new PaymentFlowError("ORDER_NOT_FOUND", "الطلب غير موجود.", 404);
  if (order.status === "PAID" || order.paymentStatus === "PAID") throw new PaymentFlowError("ALREADY_PAID", "تم دفع هذا الطلب مسبقًا.", 409);
  if (order.status !== "QUOTED" || !order.finalTotal || order.finalTotal.lessThan(5)) throw new PaymentFlowError("ORDER_NOT_PAYABLE", "الطلب غير جاهز للدفع أو أن المبلغ أقل من الحد الأدنى.", 409);

  const pendingFresh = order.paymentStatus === "PENDING" && order.paymentCreatedAt && Date.now() - order.paymentCreatedAt.getTime() < PENDING_TTL_MS;
  if (pendingFresh && order.paylinkPaymentUrl) return { url: order.paylinkPaymentUrl, reused: true };
  if (pendingFresh) throw new PaymentFlowError("PAYMENT_CREATING", "جاري إنشاء رابط الدفع. حاول بعد لحظات.", 409);

  const acquired = await prisma.purchaseOrder.updateMany({ where: { id: order.id, paymentStatus: order.paymentStatus, updatedAt: order.updatedAt }, data: { paymentStatus: "PENDING", paymentCreatedAt: new Date(), paymentFailureReason: null } });
  if (!acquired.count) throw new PaymentFlowError("CONCURRENT_REQUEST", "يوجد طلب دفع قيد المعالجة.", 409);

  try {
    const base = appUrl();
    const invoice = await createPaylinkInvoice({ orderNumber: order.orderNumber, amount: order.finalTotal, clientName: order.customer.name, clientEmail: order.customer.email || null, clientMobile: mobile(order.customer.phone), callbackUrl: `${base}/api/payments/paylink/callback`, cancelUrl: `${base}/account/orders/${encodeURIComponent(order.orderNumber)}?payment=canceled` });
    await prisma.$transaction([
      prisma.purchaseOrder.update({ where: { id: order.id }, data: { paymentStatus: normalizePaylinkStatus(invoice.orderStatus), paylinkTransactionNo: invoice.transactionNo, paylinkPaymentUrl: invoice.url, paylinkOrderStatus: invoice.orderStatus, paylinkQrUrl: invoice.qrUrl, paylinkMobileUrl: invoice.mobileUrl, paylinkCheckUrl: invoice.checkUrl, paymentCreatedAt: new Date() } }),
      prisma.purchaseOrderAuditLog.create({ data: { purchaseOrderId: order.id, adminEmail: "paylink@system", field: "PAYMENT_INVOICE_CREATED", previousValue: null, newValue: `${invoice.transactionNo}|${order.finalTotal.toFixed(2)}` } }),
    ]);
    if (!invoice.url) throw new PaymentFlowError("PAYMENT_URL_MISSING", "لم ترسل Paylink رابط الدفع.", 502);
    return { url: invoice.url, reused: false };
  } catch (error) {
    await prisma.purchaseOrder.update({ where: { id: order.id }, data: { paymentStatus: "FAILED", paymentFailureReason: safeFailure(error) } }).catch(() => null);
    console.error("[paylink-payment] invoice creation failed", { orderId: order.id, code: safeFailure(error) });
    throw error;
  }
}

export async function reconcilePayment(transactionNo: string, source: "webhook" | "callback" | "manual-check", webhook?: { amount: Prisma.Decimal; merchantOrderNumber: string }) {
  const order = await prisma.purchaseOrder.findUnique({ where: { paylinkTransactionNo: transactionNo } });
  if (!order) throw new PaymentFlowError("ORDER_NOT_FOUND", "لا يوجد طلب مرتبط بعملية الدفع.", 404);
  if (order.paymentStatus === "PAID" && order.status === "PAID") return { status: "PAID" as const, orderNumber: order.orderNumber, alreadyProcessed: true };
  if (!order.finalTotal) throw new PaymentFlowError("QUOTE_MISSING", "إجمالي عرض السعر غير موجود.", 409);

  const invoice = await getPaylinkInvoice(transactionNo);
  if (webhook && (webhook.merchantOrderNumber !== order.orderNumber || !webhook.amount.equals(invoice.amount))) throw new PaymentFlowError("WEBHOOK_MISMATCH", "بيانات إشعار Paylink غير مطابقة.", 409);
  let status: ReturnType<typeof normalizePaylinkStatus>;
  try { status = verifyPaylinkInvoice(invoice, { transactionNo, orderNumber: order.orderNumber, amount: order.finalTotal }); }
  catch (error) {
    await prisma.purchaseOrder.update({ where: { id: order.id }, data: { paymentFailureReason: safeFailure(error) } });
    await prisma.purchaseOrderAuditLog.create({ data: { purchaseOrderId: order.id, adminEmail: "paylink@system", field: "PAYMENT_VERIFICATION_FAILED", previousValue: source, newValue: safeFailure(error) } });
    throw error;
  }

  if (status !== "PAID") {
    const failure = invoice.paymentErrors.map(item => item.errorCode || item.errorTitle).filter(Boolean).join(",").slice(0, 250) || null;
    await prisma.purchaseOrder.update({ where: { id: order.id }, data: { paymentStatus: status, paylinkOrderStatus: invoice.orderStatus, paymentFailureReason: failure } });
    return { status, orderNumber: order.orderNumber, alreadyProcessed: false };
  }
  return confirmPaidOrder(order, invoice, source);
}

async function confirmPaidOrder(order: { id: number; customerId: number; orderNumber: string; paymentStatus: string; paylinkTransactionNo: string | null }, invoice: PaylinkInvoice, source: string) {
  const receipt = invoice.paymentReceipt;
  return prisma.$transaction(async tx => {
    const changed = await tx.purchaseOrder.updateMany({ where: { id: order.id, paymentStatus: { not: "PAID" }, paylinkTransactionNo: invoice.transactionNo }, data: { status: "PAID", paymentStatus: "PAID", paylinkOrderStatus: invoice.orderStatus, paidAmount: invoice.amount, paidAt: receipt?.paymentDate || new Date(), paymentMethod: receipt?.paymentMethod, paymentReceiptUrl: receipt?.receiptUrl, paymentReceiptPasscode: receipt?.passcode, paymentCardLastFour: receipt?.bankCardNumber, paymentFailureReason: null } });
    if (!changed.count) return { status: "PAID" as const, orderNumber: order.orderNumber, alreadyProcessed: true };
    await tx.purchaseOrderAuditLog.create({ data: { purchaseOrderId: order.id, adminEmail: "paylink@system", field: "PAYMENT_CONFIRMED", previousValue: source, newValue: `${invoice.transactionNo}|${invoice.amount.toFixed(2)}|${receipt?.paymentMethod || "unknown"}` } });
    const customerKey = `customer:${order.customerId}:purchase-order:${order.id}:paid:${invoice.transactionNo}`;
    await tx.notification.upsert({ where: { dedupeKey: customerKey }, update: {}, create: { userId: order.customerId, purchaseOrderId: order.id, type: "CUSTOMER_PURCHASE_ORDER_PAID", title: "تم تأكيد استلام الدفعة", message: `تم تأكيد دفع طلب الشراء ${order.orderNumber}.`, dedupeKey: customerKey } });
    const admins = await tx.adminUser.findMany({ select: { id: true } });
    for (const admin of admins) { const key = `admin:purchase-order:${order.id}:paid:${invoice.transactionNo}:admin:${admin.id}`; await tx.notification.upsert({ where: { dedupeKey: key }, update: {}, create: { adminUserId: admin.id, purchaseOrderId: order.id, type: "ADMIN_PURCHASE_ORDER_PAID", title: "تم دفع طلب شراء", message: `تم تأكيد دفع الطلب ${order.orderNumber}.`, dedupeKey: key } }); }
    return { status: "PAID" as const, orderNumber: order.orderNumber, alreadyProcessed: false };
  });
}
