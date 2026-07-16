import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

type NotificationTarget =
  | { userId: number; adminUserId?: never }
  | { adminUserId: number; userId?: never };

type CreateNotificationInput = NotificationTarget & {
  shipmentId?: number | null;
  type: string;
  title: string;
  message: string;
  dedupeKey?: string | null;
};

export async function createNotification(input: CreateNotificationInput) {
  if (!input.userId && !input.adminUserId) throw new Error("Notification target is required.");
  if (input.userId && input.adminUserId) throw new Error("Notification must target either customer or admin.");

  const data = {
    userId: input.userId || null,
    adminUserId: input.adminUserId || null,
    shipmentId: input.shipmentId || null,
    type: input.type,
    title: input.title,
    message: input.message,
    dedupeKey: input.dedupeKey || null,
  };

  if (data.dedupeKey) {
    return prisma.notification.upsert({ where: { dedupeKey: data.dedupeKey }, update: {}, create: data });
  }

  return prisma.notification.create({ data });
}

export async function notifyAllAdmins(input: Omit<CreateNotificationInput, "adminUserId" | "userId">) {
  const admins = await prisma.adminUser.findMany({ select: { id: true } });
  await Promise.all(admins.map((admin) => createNotification({ ...input, adminUserId: admin.id, dedupeKey: input.dedupeKey ? `${input.dedupeKey}:admin:${admin.id}` : null })));
}

export async function getCustomerNotificationSummary(userId: number) {
  const [unread, recent] = await Promise.all([
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.notification.findMany({ where: { userId }, include: { shipment: { select: { internalReference: true } } }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  return { unread, recent };
}

export async function getAdminNotificationSummary(adminUserId: number) {
  const [unread, recent] = await Promise.all([
    prisma.notification.count({ where: { adminUserId, isRead: false } }),
    prisma.notification.findMany({ where: { adminUserId }, include: { shipment: { select: { internalReference: true } } }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  return { unread, recent };
}

export async function getCustomerNotifications(userId: number) {
  return prisma.notification.findMany({ where: { userId }, include: { shipment: { select: { internalReference: true, productName: true } } }, orderBy: { createdAt: "desc" } });
}

export async function markCustomerNotificationRead(userId: number, id: number) {
  const notification = await prisma.notification.findFirst({ where: { id, userId }, include: { shipment: true } });
  if (!notification) redirect("/account/notifications");
  if (!notification.isRead) await prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } });
  redirect(notification.shipment ? `/account/shipments/${notification.shipment.internalReference}` : "/account/notifications");
}

export async function markAdminNotificationRead(adminUserId: number, id: number) {
  const notification = await prisma.notification.findFirst({ where: { id, adminUserId }, include: { shipment: true } });
  if (!notification) redirect("/admin");
  if (!notification.isRead) await prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } });
  redirect(notification.shipment ? `/admin/shipments/${notification.shipment.internalReference}` : "/admin");
}

export async function markAllCustomerNotificationsRead(userId: number) {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true, readAt: new Date() } });
}

export async function markAllAdminNotificationsRead(adminUserId: number) {
  await prisma.notification.updateMany({ where: { adminUserId, isRead: false }, data: { isRead: true, readAt: new Date() } });
}

export function notificationIcon(type: string) {
  if (type.includes("ARRIVED")) return "وصلت";
  if (type.includes("WEIGHT")) return "وزن";
  if (type.includes("FEE")) return "رسوم";
  if (type.includes("TRACKING") || type.includes("SHIPPED")) return "شحن";
  if (type.includes("PHOTO")) return "صور";
  if (type.includes("ADMIN")) return "إدارة";
  return "تنبيه";
}
