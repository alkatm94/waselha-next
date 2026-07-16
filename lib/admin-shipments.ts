import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SHIPMENT_STATUSES, getShipmentStatusLabel } from "@/lib/shipments";
import { createNotification, notifyAllAdmins } from "@/lib/notifications";

const statusValues = new Set<string>(SHIPMENT_STATUSES.map((status) => status.value));

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) || "").trim();
  return value || null;
}

function numberOrNull(formData: FormData, key: string) {
  const raw = String(formData.get(key) || "").trim();
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw new Error("القيم الرقمية يجب أن تكون صفرًا أو أكبر.");
  return value;
}

function valueString(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

export function calculateVolumetricWeight(lengthCm?: number | null, widthCm?: number | null, heightCm?: number | null) {
  if (!lengthCm || !widthCm || !heightCm) return null;
  return Math.round(((lengthCm * widthCm * heightCm) / 6000) * 100) / 100;
}

async function saveWarehousePhoto(file: File | null, shipmentReference: string) {
  if (!file || file.size === 0) return null;
  if (!file.type.startsWith("image/")) throw new Error("صور المستودع يجب أن تكون ملفات صور فقط.");
  if (file.size > 5 * 1024 * 1024) throw new Error("حجم الصورة يجب ألا يتجاوز 5MB.");

  const ext = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
  const folder = path.join(process.cwd(), "public", "uploads", "warehouse");
  await mkdir(folder, { recursive: true });
  const fileName = `${shipmentReference}-${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  await writeFile(path.join(folder, fileName), Buffer.from(await file.arrayBuffer()));
  return `/uploads/warehouse/${fileName}`;
}

export async function getAdminDashboardData(query = "") {
  const q = query.trim();
  const where = q
    ? {
        OR: [
          { internalReference: { contains: q } },
          { localTrackingNumber: { contains: q.replace(/\s+/g, "").toUpperCase() } },
          { customerCode: { contains: q } },
          { customer: { name: { contains: q } } },
          { customer: { email: { contains: q.toLowerCase() } } },
        ],
      }
    : {};

  const [shipments, counts] = await Promise.all([
    prisma.chinaShipment.findMany({
      where,
      include: { customer: { select: { name: true, email: true, customerId: true } } },
      orderBy: { updatedAt: "desc" },
      take: 80,
    }),
    prisma.chinaShipment.findMany({ select: { status: true } }),
  ]);

  const stat = (statuses: string[]) => counts.filter((item) => statuses.includes(item.status)).length;
  return {
    shipments,
    stats: {
      total: counts.length,
      awaiting: stat(["REGISTERED", "AWAITING_WAREHOUSE"]),
      arrived: stat(["ARRIVED_WAREHOUSE", "INSPECTING", "WEIGHED"]),
      needsAction: stat(["AWAITING_SHIPPING_PAYMENT"]),
      ready: stat(["READY_TO_SHIP"]),
      shipped: stat(["SHIPPED", "DELIVERED"]),
    },
  };
}

export async function getAdminShipment(reference: string) {
  return prisma.chinaShipment.findUnique({
    where: { internalReference: reference },
    include: {
      customer: { select: { name: true, email: true, phone: true, customerId: true } },
      events: { orderBy: { createdAt: "asc" } },
      photos: { orderBy: { createdAt: "desc" } },
      auditLogs: { include: { admin: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function updateShipmentOperations(admin: { id: number; email: string; name: string }, formData: FormData) {
  const id = Number(formData.get("shipmentId"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("الشحنة غير صحيحة.");

  const status = text(formData, "status") || "REGISTERED";
  if (!statusValues.has(status)) throw new Error("حالة الشحنة غير صحيحة.");

  const existing = await prisma.chinaShipment.findUnique({ where: { id } });
  if (!existing) throw new Error("الشحنة غير موجودة.");

  const actualWeightKg = numberOrNull(formData, "actualWeightKg");
  const lengthCm = numberOrNull(formData, "lengthCm");
  const widthCm = numberOrNull(formData, "widthCm");
  const heightCm = numberOrNull(formData, "heightCm");
  const volumetricWeightKg = calculateVolumetricWeight(lengthCm, widthCm, heightCm);
  const submittedChargeable = numberOrNull(formData, "chargeableWeightKg");
  const calculatedChargeable = Math.max(actualWeightKg || 0, volumetricWeightKg || 0) || null;
  const chargeableWeightKg = submittedChargeable ?? calculatedChargeable;
  const shippingFee = numberOrNull(formData, "shippingFee");
  const internationalTrackingNumber = text(formData, "internationalTrackingNumber");
  const customerNote = text(formData, "customerNote");
  const internalNote = text(formData, "internalNote");
  const photoFile = formData.get("warehousePhoto") instanceof File ? formData.get("warehousePhoto") as File : null;
  const photoUrl = await saveWarehousePhoto(photoFile, existing.internalReference);

  const data = {
    status,
    actualWeightKg,
    weightKg: actualWeightKg,
    lengthCm,
    widthCm,
    heightCm,
    volumetricWeightKg,
    chargeableWeightKg,
    shippingFee,
    internationalTrackingNumber,
    customerNote,
    internalNote,
    warehouseArrivedAt: status === "ARRIVED_WAREHOUSE" && !existing.warehouseArrivedAt ? new Date() : existing.warehouseArrivedAt,
  };

  const trackedFields = ["status", "actualWeightKg", "lengthCm", "widthCm", "heightCm", "volumetricWeightKg", "chargeableWeightKg", "shippingFee", "internationalTrackingNumber", "customerNote", "internalNote"] as const;
  const changes = trackedFields
    .map((field) => ({ field, previousValue: valueString(existing[field]), newValue: valueString(data[field]) }))
    .filter((change) => change.previousValue !== change.newValue);

  const customerNotifications = [] as { type: string; title: string; message: string; dedupeKey: string }[];
  const changed = new Set(changes.map((change) => change.field));
  const ref = existing.internalReference;

  if (changed.has("status")) {
    if (status === "ARRIVED_WAREHOUSE") {
      customerNotifications.push({ type: "CUSTOMER_SHIPMENT_ARRIVED", title: "وصلت شحنتك إلى المستودع", message: `تم استلام الشحنة ${ref} في مستودع الصين، وسيتم فحصها وتحديث بياناتها.`, dedupeKey: `customer:${existing.customerId}:shipment:${id}:status:${status}` });
    } else if (status === "SHIPPED") {
      customerNotifications.push({ type: "CUSTOMER_SHIPMENT_SHIPPED", title: "تم شحن طلبك", message: `تم شحن الشحنة ${ref}. افتح التفاصيل للاطلاع على معلومات التتبع.`, dedupeKey: `customer:${existing.customerId}:shipment:${id}:status:${status}` });
    } else if (status === "DELIVERED") {
      customerNotifications.push({ type: "CUSTOMER_SHIPMENT_DELIVERED", title: "تم تسليم شحنتك", message: `تم تحديث الشحنة ${ref} إلى تم التسليم.`, dedupeKey: `customer:${existing.customerId}:shipment:${id}:status:${status}` });
    } else {
      customerNotifications.push({ type: "CUSTOMER_STATUS_CHANGED", title: "تم تحديث حالة شحنتك", message: `تم تغيير حالة الشحنة ${ref} إلى ${getShipmentStatusLabel(status)}.`, dedupeKey: `customer:${existing.customerId}:shipment:${id}:status:${status}` });
    }
  }
  if (changed.has("actualWeightKg") || changed.has("lengthCm") || changed.has("widthCm") || changed.has("heightCm")) {
    customerNotifications.push({ type: "CUSTOMER_WEIGHT_UPDATED", title: "تم تحديث وزن شحنتك", message: `تمت إضافة الوزن والأبعاد للشحنة ${ref}.`, dedupeKey: `customer:${existing.customerId}:shipment:${id}:weight:${actualWeightKg}:${lengthCm}:${widthCm}:${heightCm}` });
  }
  if (changed.has("volumetricWeightKg") || changed.has("chargeableWeightKg")) {
    customerNotifications.push({ type: "CUSTOMER_CHARGEABLE_WEIGHT", title: "تم احتساب الوزن المعتمد", message: `تم تحديث الوزن الحجمي أو الوزن المحتسب للشحنة ${ref}.`, dedupeKey: `customer:${existing.customerId}:shipment:${id}:chargeable:${volumetricWeightKg}:${chargeableWeightKg}` });
  }
  if (changed.has("shippingFee") && shippingFee !== null) {
    customerNotifications.push({ type: "CUSTOMER_SHIPPING_FEE", title: "تم احتساب رسوم الشحن", message: "رسوم شحن شحنتك أصبحت متاحة الآن. افتح تفاصيل الشحنة للاطلاع عليها.", dedupeKey: `customer:${existing.customerId}:shipment:${id}:fee:${shippingFee}` });
  }
  if (changed.has("customerNote") && customerNote) {
    customerNotifications.push({ type: "CUSTOMER_VISIBLE_NOTE", title: "تمت إضافة ملاحظة على شحنتك", message: customerNote, dedupeKey: `customer:${existing.customerId}:shipment:${id}:customer-note:${customerNote}` });
  }
  if (changed.has("internationalTrackingNumber") && internationalTrackingNumber) {
    customerNotifications.push({ type: "CUSTOMER_INTERNATIONAL_TRACKING", title: "تم شحن طلبك", message: "تم إضافة رقم التتبع الدولي لشحنتك، ويمكنك متابعتها من صفحة التفاصيل.", dedupeKey: `customer:${existing.customerId}:shipment:${id}:international:${internationalTrackingNumber}` });
  }
  if (photoUrl) {
    customerNotifications.push({ type: "CUSTOMER_WAREHOUSE_PHOTO", title: "تمت إضافة صور من المستودع", message: `تمت إضافة صورة جديدة للشحنة ${ref}.`, dedupeKey: `customer:${existing.customerId}:shipment:${id}:photo:${photoUrl}` });
  }
  await prisma.$transaction(async (tx) => {
    await tx.chinaShipment.update({ where: { id }, data });

    if (photoUrl) {
      await tx.shipmentPhoto.create({ data: { shipmentId: id, url: photoUrl, caption: customerNote || "صورة من المستودع" } });
    }

    await tx.shipmentEvent.create({
      data: {
        shipmentId: id,
        status,
        note: customerNote || `تم تحديث الشحنة بواسطة فريق التشغيل: ${getShipmentStatusLabel(status)}`,
      },
    });

    if (changes.length > 0 || photoUrl) {
      await tx.shipmentAuditLog.createMany({
        data: [
          ...changes.map((change) => ({ shipmentId: id, adminId: admin.id, adminEmail: admin.email, ...change })),
          ...(photoUrl ? [{ shipmentId: id, adminId: admin.id, adminEmail: admin.email, field: "warehousePhoto", previousValue: null, newValue: photoUrl }] : []),
        ],
      });
    }
  });

  await Promise.all(customerNotifications.map((notification) => createNotification({
    userId: existing.customerId,
    shipmentId: id,
    ...notification,
  })));

  if (status === "AWAITING_SHIPPING_PAYMENT") {
    await notifyAllAdmins({ shipmentId: id, type: "ADMIN_NEEDS_ACTION", title: "شحنة تحتاج إجراء", message: `الشحنة ${existing.internalReference} بانتظار دفع رسوم الشحن.`, dedupeKey: `admin:needs-action:${id}:${status}` });
  }

  redirect(`/admin/shipments/${existing.internalReference}`);
}



