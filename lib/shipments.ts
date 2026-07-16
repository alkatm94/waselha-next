import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createNotification, notifyAllAdmins } from "@/lib/notifications";

export const SHIPMENT_STATUSES = [
  { value: "REGISTERED", label: "تم تسجيل الشحنة" },
  { value: "AWAITING_WAREHOUSE", label: "بانتظار الوصول إلى المستودع" },
  { value: "ARRIVED_WAREHOUSE", label: "وصلت إلى المستودع" },
  { value: "INSPECTING", label: "جاري الفحص" },
  { value: "WEIGHED", label: "تم الوزن" },
  { value: "AWAITING_SHIPPING_PAYMENT", label: "بانتظار دفع رسوم الشحن" },
  { value: "READY_TO_SHIP", label: "جاهزة للشحن" },
  { value: "SHIPPED", label: "تم الشحن" },
  { value: "DELIVERED", label: "تم التسليم" },
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number]["value"];


export function getShipmentStatusLabel(status: string) {
  return SHIPMENT_STATUSES.find((item) => item.value === status)?.label || status;
}

export function normalizeTrackingNumber(value: string) {
  return value.trim().replace(/\s+/g, "").toUpperCase();
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

function positiveNumber(formData: FormData, key: string, label: string) {
  const value = Number(formData.get(key));
  if (!Number.isFinite(value) || value <= 0) throw new Error(`حقل ${label} يجب أن يكون رقمًا صحيحًا أكبر من صفر.`);
  return value;
}

function optionalNumber(formData: FormData, key: string) {
  const raw = String(formData.get(key) || "").trim();
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw new Error("القيم الرقمية يجب أن تكون صفرًا أو أكبر.");
  return value;
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

export async function createChinaShipment(customer: { id: number; customerId: string }, formData: FormData) {
  const productName = requiredText(formData, "productName", "اسم المنتج");
  const productUrl = assertUrl(requiredText(formData, "productUrl", "رابط المنتج"), "رابط المنتج")!;
  const storeName = requiredText(formData, "storeName", "اسم المتجر");
  const localTrackingNumber = normalizeTrackingNumber(requiredText(formData, "localTrackingNumber", "رقم التتبع المحلي"));
  const quantity = Math.trunc(positiveNumber(formData, "quantity", "الكمية"));
  const productPrice = positiveNumber(formData, "productPrice", "سعر المنتج");
  const currency = requiredText(formData, "currency", "العملة").toUpperCase();
  const invoiceImageUrl = assertUrl(optionalText(formData, "invoiceImageUrl"), "صورة الفاتورة");
  const notes = optionalText(formData, "notes");

  try {
    const shipment = await prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const counter = await tx.shipmentCounter.upsert({
        where: { year },
        create: { year, lastNumber: 1 },
        update: { lastNumber: { increment: 1 } },
      });
      const internalReference = `WSH-${year}-${String(counter.lastNumber).padStart(6, "0")}`;
      const shipment = await tx.chinaShipment.create({
        data: {
          internalReference,
          customerId: customer.id,
          customerCode: customer.customerId,
          productName,
          productUrl,
          storeName,
          localTrackingNumber,
          quantity,
          productPrice,
          currency,
          invoiceImageUrl,
          notes,
          status: "REGISTERED",
          events: { create: { status: "REGISTERED", note: "سجل العميل الشحنة القادمة." } },
        },
      });
      return shipment;
    });

    await createNotification({
      userId: customer.id,
      shipmentId: shipment.id,
      type: "CUSTOMER_SHIPMENT_REGISTERED",
      title: "تم تسجيل شحنتك بنجاح",
      message: `تم تسجيل الشحنة ${shipment.internalReference} وربطها بحسابك.`,
      dedupeKey: `customer:${customer.id}:shipment:${shipment.id}:registered`,
    });
    await notifyAllAdmins({
      shipmentId: shipment.id,
      type: "ADMIN_NEW_SHIPMENT",
      title: "تم تسجيل شحنة جديدة",
      message: `سجل العميل ${customer.customerId} شحنة جديدة برقم ${shipment.internalReference}.`,
      dedupeKey: `admin:new-shipment:${shipment.id}`,
    });    if (notes) {
      await notifyAllAdmins({
        shipmentId: shipment.id,
        type: "ADMIN_CUSTOMER_NOTE",
        title: "أضاف العميل ملاحظة على الشحنة",
        message: `أضاف العميل ${customer.customerId} ملاحظة على الشحنة ${shipment.internalReference}: ${notes}`,
        dedupeKey: `admin:customer-note:${shipment.id}:${notes}`,
      });
    }
    return shipment;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      await notifyAllAdmins({ type: "ADMIN_DUPLICATE_TRACKING", title: "رقم تتبع مكرر يحتاج مراجعة", message: `حاول العميل ${customer.customerId} تسجيل رقم التتبع ${localTrackingNumber} مرة أخرى.`, dedupeKey: `admin:duplicate:${customer.id}:${localTrackingNumber}` });
      throw new Error("رقم التتبع مسجل مسبقًا في حسابك.");
    }
    throw error;
  }
}

export async function getCustomerShipments(customerId: number) {
  return prisma.chinaShipment.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
  });
}


export async function getCustomerShipmentStats(customerId: number) {
  const shipments = await prisma.chinaShipment.findMany({
    where: { customerId },
    select: { status: true },
  });

  const active = shipments.filter((shipment) => shipment.status !== "DELIVERED").length;
  const arrived = shipments.filter((shipment) => ["ARRIVED_WAREHOUSE", "INSPECTING", "WEIGHED", "AWAITING_SHIPPING_PAYMENT", "READY_TO_SHIP", "SHIPPED", "DELIVERED"].includes(shipment.status)).length;
  const needsAction = shipments.filter((shipment) => shipment.status === "AWAITING_SHIPPING_PAYMENT").length;

  return { active, arrived, needsAction };
}
export async function getCustomerShipmentByReference(customerId: number, internalReference: string) {
  return prisma.chinaShipment.findFirst({
    where: { customerId, internalReference },
    include: { events: { orderBy: { createdAt: "asc" } }, photos: { orderBy: { createdAt: "desc" } } },
  });
}



