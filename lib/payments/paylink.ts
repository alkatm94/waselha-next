import "server-only";
import { Prisma } from "@prisma/client";

const REQUEST_TIMEOUT_MS = 12_000;
const TOKEN_TTL_MS = 25 * 60 * 1000;
let cachedToken: { value: string; expiresAt: number } | null = null;

export const PAYMENT_STATUSES = ["UNPAID", "PENDING", "PAID", "FAILED", "CANCELED", "EXPIRED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type PaylinkInvoice = {
  transactionNo: string;
  orderStatus: string;
  amount: Prisma.Decimal;
  url: string | null;
  qrUrl: string | null;
  mobileUrl: string | null;
  checkUrl: string | null;
  gatewayOrderRequest: { orderNumber: string };
  paymentReceipt: { receiptUrl: string | null; passcode: string | null; paymentMethod: string | null; paymentDate: Date | null; bankCardNumber: string | null } | null;
  paymentErrors: Array<{ errorCode: string | null; errorTitle: string | null }>;
};

export class PaylinkError extends Error {
  constructor(public readonly code: string, message: string, public readonly retryable = false) { super(message); this.name = "PaylinkError"; }
}

function record(value: unknown): Record<string, unknown> | null { return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null; }
function text(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : null; }
function decimal(value: unknown) { try { const result = new Prisma.Decimal(String(value)); return result.isPositive() ? result : null; } catch { return null; } }
function date(value: unknown) { const raw = text(value); if (!raw) return null; const result = new Date(raw); return Number.isNaN(result.getTime()) ? null : result; }
function lastFour(value: unknown) { const digits = (text(value) || "").replace(/\D/g, ""); return digits.length >= 4 ? digits.slice(-4) : null; }

function config() {
  const baseUrl = process.env.PAYLINK_BASE_URL || "https://restpilot.paylink.sa";
  const apiId = process.env.PAYLINK_API_ID;
  const secretKey = process.env.PAYLINK_SECRET_KEY;
  let parsed: URL;
  try { parsed = new URL(baseUrl); } catch { throw new PaylinkError("INVALID_CONFIG", "عنوان Paylink غير صالح."); }
  if (process.env.PAYLINK_MODE !== "test" || parsed.origin !== "https://restpilot.paylink.sa") throw new PaylinkError("TEST_MODE_REQUIRED", "تكامل Paylink مضبوط للعمل في بيئة الاختبار فقط.");
  if (!apiId || !secretKey) throw new PaylinkError("MISSING_CONFIG", "بيانات اتصال Paylink غير مكتملة.");
  return { baseUrl: parsed.origin, apiId, secretKey };
}

async function jsonResponse(response: Response) {
  const type = response.headers.get("content-type") || "";
  if (!type.toLowerCase().includes("application/json")) { await response.text(); throw new PaylinkError("NON_JSON_RESPONSE", "استجابة Paylink غير متوقعة.", response.status >= 500); }
  try { return await response.json() as unknown; } catch { throw new PaylinkError("INVALID_JSON_RESPONSE", "تعذر قراءة استجابة Paylink.", response.status >= 500); }
}

export async function authenticatePaylink(force = false) {
  if (!force && cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  const { baseUrl, apiId, secretKey } = config();
  let response: Response;
  try { response = await fetch(`${baseUrl}/api/auth`, { method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify({ apiId, secretKey, persistToken: false }), cache: "no-store", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }); }
  catch (error) { console.error("[paylink] auth transport failure", { name: error instanceof Error ? error.name : "UnknownError" }); throw new PaylinkError("AUTH_TIMEOUT", "تعذر الاتصال بخدمة الدفع.", true); }
  const body = await jsonResponse(response);
  const token = text(record(body)?.id_token);
  if (!response.ok || !token) { console.error("[paylink] auth rejected", { status: response.status }); throw new PaylinkError("AUTH_FAILED", "تعذرت المصادقة مع خدمة الدفع.", response.status >= 500); }
  cachedToken = { value: token, expiresAt: Date.now() + TOKEN_TTL_MS };
  return token;
}

async function authorizedRequest(path: string, init: RequestInit) {
  const { baseUrl } = config();
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const token = await authenticatePaylink(attempt === 1);
    let response: Response;
    try { response = await fetch(`${baseUrl}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, accept: "application/json", "content-type": "application/json", ...init.headers }, cache: "no-store", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }); }
    catch (error) { console.error("[paylink] transport failure", { path, name: error instanceof Error ? error.name : "UnknownError" }); throw new PaylinkError("PAYLINK_TIMEOUT", "تعذر الاتصال بخدمة الدفع.", true); }
    if ((response.status === 401 || response.status === 403) && attempt === 0) { cachedToken = null; await response.text(); continue; }
    const body = await jsonResponse(response);
    if (!response.ok) { console.error("[paylink] request rejected", { path, status: response.status }); throw new PaylinkError("PAYLINK_REQUEST_FAILED", "لم تكتمل عملية Paylink.", response.status >= 500); }
    return body;
  }
  throw new PaylinkError("PAYLINK_AUTH_FAILED", "تعذرت المصادقة مع خدمة الدفع.");
}

export function normalizePaylinkStatus(value: unknown): PaymentStatus {
  const status = (text(value) || "").toLowerCase();
  if (status === "paid") return "PAID";
  if (status === "canceled" || status === "cancelled") return "CANCELED";
  if (status === "expired") return "EXPIRED";
  if (status === "failed") return "FAILED";
  return "PENDING";
}

export async function createPaylinkInvoice(input: { orderNumber: string; amount: Prisma.Decimal; clientName: string; clientEmail: string | null; clientMobile: string; callbackUrl: string; cancelUrl: string }) {
  const body = await authorizedRequest("/api/addInvoice", { method: "POST", body: JSON.stringify({ orderNumber: input.orderNumber, amount: input.amount.toNumber(), callBackUrl: input.callbackUrl, cancelUrl: input.cancelUrl, clientName: input.clientName, ...(input.clientEmail ? { clientEmail: input.clientEmail } : {}), clientMobile: input.clientMobile, currency: "SAR", products: [{ title: "طلب شراء عبر وصلها لي", price: input.amount.toNumber(), qty: 1, description: `طلب رقم ${input.orderNumber}`, isDigital: false }], supportedCardBrands: ["mada", "visaMastercard"], displayPending: true, note: `طلب شراء عبر وصلها لي - ${input.orderNumber}` }) });
  return parseInvoice(body);
}

export async function getPaylinkInvoice(transactionNo: string) { return parseInvoice(await authorizedRequest(`/api/getInvoice/${encodeURIComponent(transactionNo)}`, { method: "GET" })); }

function parseInvoice(value: unknown): PaylinkInvoice {
  const root = record(value); const gateway = record(root?.gatewayOrderRequest); const receipt = record(root?.paymentReceipt);
  const amount = decimal(root?.amount); const transactionNo = text(root?.transactionNo); const orderStatus = text(root?.orderStatus); const orderNumber = text(gateway?.orderNumber);
  if (!root || !amount || !transactionNo || !orderStatus || !orderNumber) throw new PaylinkError("INVALID_INVOICE", "بيانات فاتورة Paylink غير مكتملة.");
  const errors = Array.isArray(root.paymentErrors) ? root.paymentErrors.map(record).filter(Boolean).map(item => ({ errorCode: text(item?.errorCode), errorTitle: text(item?.errorTitle) })).slice(0, 5) : [];
  return { transactionNo, orderStatus, amount, url: text(root.url), qrUrl: text(root.qrUrl), mobileUrl: text(root.mobileUrl), checkUrl: text(root.checkUrl), gatewayOrderRequest: { orderNumber }, paymentReceipt: receipt ? { receiptUrl: text(receipt.receiptUrl), passcode: text(receipt.passcode), paymentMethod: text(receipt.paymentMethod), paymentDate: date(receipt.paymentDate), bankCardNumber: lastFour(receipt.bankCardNumber) } : null, paymentErrors: errors };
}

export function verifyPaylinkInvoice(invoice: PaylinkInvoice, expected: { transactionNo: string; orderNumber: string; amount: Prisma.Decimal }) {
  if (invoice.transactionNo !== expected.transactionNo) throw new PaylinkError("TRANSACTION_MISMATCH", "رقم عملية Paylink غير مطابق.");
  if (invoice.gatewayOrderRequest.orderNumber !== expected.orderNumber) throw new PaylinkError("ORDER_MISMATCH", "رقم الطلب في Paylink غير مطابق.");
  if (!invoice.amount.equals(expected.amount)) throw new PaylinkError("AMOUNT_MISMATCH", "مبلغ Paylink غير مطابق لعرض السعر.");
  return normalizePaylinkStatus(invoice.orderStatus);
}
