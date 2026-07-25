import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createNotification, notifyAllAdmins } from "@/lib/notifications";

export const PURCHASE_ORDER_STATUSES = [
  { value: "PENDING_REVIEW", label: "بانتظار المراجعة" },
  { value: "QUOTED", label: "تم إصدار عرض السعر" },
  { value: "APPROVED", label: "معتمد" },
  { value: "REJECTED", label: "مرفوض" },
  { value: "CANCELLED", label: "ملغي" },
] as const;

export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number]["value"];

const statusValues = new Set<string>(PURCHASE_ORDER_STATUSES.map((status) => status.value));

export function getPurchaseOrderStatusLabel(status: string) {
  return PURCHASE_ORDER_STATUSES.find((item) => item.value === status)?.label || status;
}

export function formatMoney(value: unknown, currency = "SAR") {
  if (value === null || value === undefined || value === "") return "-";
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return `${value} ${currency}`;
  return `${numberValue.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function requiredText(formData: FormData, key: string, label: string) {
  const value = String(formData.get(key) || "").trim();
  if (!value) throw new Error(`حقل ${label} مطلوب.`);
  return value;
}

function optionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) || "").trim();
  return value || null;
}

function positiveInt(formData: FormData, key: string, label: string) {
  const value = Number(formData.get(key));
  if (!Number.isInteger(value) || value <= 0) throw new Error(`حقل ${label} يجب أن يكون رقمًا صحيحًا أكبر من صفر.`);
  return value;
}

function decimalOrNull(formData: FormData, key: string) {
  const raw = String(formData.get(key) || "").trim();
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw new Error("المبالغ يجب أن تكون صفرًا أو أكبر.");
  return new Prisma.Decimal(value.toFixed(2));
}

function assertUrl(value: string | null, label: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    return url.toString();
  } catch {
    throw new Error(`${label} يجب أن يكون رابطًا صحيحًا يبدأ بـ http أو https.`);
  }
}

function valueString(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Prisma.Decimal) return value.toFixed(2);
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function addMoney(...values: Array<Prisma.Decimal | null>) {
  let sum = new Prisma.Decimal(0);
  for (const value of values) {
    if (value) sum = sum.plus(value);
  }
  return sum;
}

export async function createPurchaseOrder(customer: { id: number; customerId: string }, formData: FormData) {
  const productUrl = assertUrl(requiredText(formData, "productUrl", "رابط المنتج"), "رابط المنتج")!;
  const productName = requiredText(formData, "productName", "اسم المنتج");
  const storeName = requiredText(formData, "storeName", "المتجر");
  const variant = optionalText(formData, "variant");
  const quantity = positiveInt(formData, "quantity", "الكمية");
  const estimatedProductPrice = decimalOrNull(formData, "estimatedProductPrice");
  const productImageUrl = assertUrl(optionalText(formData, "productImageUrl"), "صورة المنتج");
  const notes = optionalText(formData, "notes");

  const order = await prisma.$transaction(async (tx) => {
    const year = new Date().getFullYear();
    const counter = await tx.purchaseOrderCounter.upsert({
      where: { year },
      create: { year, lastNumber: 1 },
      update: { lastNumber: { increment: 1 } },
    });
    const orderNumber = `WPO-${year}-${String(counter.lastNumber).padStart(6, "0")}`;
    return tx.purchaseOrder.create({
      data: {
        orderNumber,
        customerId: customer.id,
        customerCode: customer.customerId,
        productUrl,
        productName,
        storeName,
        variant,
        quantity,
        estimatedProductPrice,
        productImageUrl,
        notes,
        status: "PENDING_REVIEW",
      },
    });
  });

  await notifyAllAdmins({
    purchaseOrderId: order.id,
    type: "ADMIN_NEW_PURCHASE_ORDER",
    title: "طلب شراء جديد",
    message: `وصل طلب شراء جديد ${order.orderNumber} من العميل ${customer.customerId}.`,
    dedupeKey: `admin:new-purchase-order:${order.id}`,
  });

  return order;
}

export async function getCustomerPurchaseOrders(customerId: number) {
  return prisma.purchaseOrder.findMany({ where: { customerId }, orderBy: { createdAt: "desc" } });
}

export async function getCustomerPurchaseOrder(customerId: number, orderNumber: string) {
  return prisma.purchaseOrder.findFirst({ where: { customerId, orderNumber } });
}

export async function getAdminPurchaseOrders(input: { q?: string; status?: string }) {
  const q = (input.q || "").trim();
  const status = input.status && statusValues.has(input.status) ? input.status : "";
  const where = {
    ...(status ? { status } : {}),
    ...(q ? {
      OR: [
        { orderNumber: { contains: q } },
        { customerCode: { contains: q } },
        { productName: { contains: q } },
        { storeName: { contains: q } },
        { customer: { name: { contains: q } } },
        { customer: { email: { contains: q.toLowerCase() } } },
      ],
    } : {}),
  };

  const [orders, counts] = await Promise.all([
    prisma.purchaseOrder.findMany({ where, include: { customer: { select: { name: true, email: true, customerId: true } } }, orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.purchaseOrder.findMany({ select: { status: true } }),
  ]);

  const stat = (statusValue: string) => counts.filter((item) => item.status === statusValue).length;
  return { orders, stats: { total: counts.length, pending: stat("PENDING_REVIEW"), quoted: stat("QUOTED"), approved: stat("APPROVED"), rejected: stat("REJECTED"), cancelled: stat("CANCELLED") } };
}

export async function getAdminPurchaseOrder(orderNumber: string) {
  return prisma.purchaseOrder.findUnique({
    where: { orderNumber },
    include: {
      customer: { select: { name: true, email: true, phone: true, customerId: true } },
      auditLogs: { include: { admin: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function updatePurchaseOrderQuote(admin: { id: number; email: string; name: string }, formData: FormData) {
  const id = Number(formData.get("purchaseOrderId"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("طلب الشراء غير صحيح.");

  const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!existing) throw new Error("طلب الشراء غير موجود.");

  const action = String(formData.get("action") || "save");
  const submittedStatus = String(formData.get("status") || existing.status);
  if (!statusValues.has(submittedStatus)) throw new Error("حالة الطلب غير صحيحة.");

  const quotedProductPrice = decimalOrNull(formData, "quotedProductPrice");
  const domesticShipping = decimalOrNull(formData, "domesticShipping");
  const serviceFee = decimalOrNull(formData, "serviceFee");
  const estimatedTaxes = decimalOrNull(formData, "estimatedTaxes");
  const finalTotal = addMoney(quotedProductPrice, domesticShipping, serviceFee, estimatedTaxes);
  const customerNote = optionalText(formData, "customerNote");
  const status = action === "issueQuote" ? "QUOTED" : submittedStatus;

  const data = {
    status,
    quotedProductPrice,
    domesticShipping,
    serviceFee,
    estimatedTaxes,
    finalTotal,
    customerNote,
    quotedAt: status === "QUOTED" && existing.status !== "QUOTED" ? new Date() : existing.quotedAt,
  };

  const trackedFields = ["status", "quotedProductPrice", "domesticShipping", "serviceFee", "estimatedTaxes", "finalTotal", "customerNote"] as const;
  const changes = trackedFields
    .map((field) => ({ field, previousValue: valueString(existing[field]), newValue: valueString(data[field]) }))
    .filter((change) => change.previousValue !== change.newValue);

  await prisma.$transaction(async (tx) => {
    await tx.purchaseOrder.update({ where: { id }, data });
    if (changes.length > 0) {
      await tx.purchaseOrderAuditLog.createMany({
        data: changes.map((change) => ({ purchaseOrderId: id, adminId: admin.id, adminEmail: admin.email, ...change })),
      });
    }
  });

  if (action === "issueQuote" || (existing.status !== "QUOTED" && status === "QUOTED")) {
    await createNotification({
      userId: existing.customerId,
      purchaseOrderId: id,
      type: "CUSTOMER_PURCHASE_ORDER_QUOTED",
      title: "تم إصدار عرض السعر",
      message: `تم إصدار عرض السعر للطلب ${existing.orderNumber} بإجمالي ${formatMoney(finalTotal)}.`,
      dedupeKey: `customer:${existing.customerId}:purchase-order:${id}:quoted:${finalTotal.toFixed(2)}`,
    });
  }

  if (existing.status !== status) {
    await createNotification({
      userId: existing.customerId,
      purchaseOrderId: id,
      type: "CUSTOMER_PURCHASE_ORDER_STATUS_CHANGED",
      title: "تم تحديث حالة طلب الشراء",
      message: `تم تغيير حالة الطلب ${existing.orderNumber} إلى ${getPurchaseOrderStatusLabel(status)}.`,
      dedupeKey: `customer:${existing.customerId}:purchase-order:${id}:status:${status}`,
    });
  }

  redirect(`/admin/orders/${existing.orderNumber}`);
}
