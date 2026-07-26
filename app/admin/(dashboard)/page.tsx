import Link from "next/link";
import { Boxes, CircleDollarSign, Clock3, PackageCheck, Truck, UsersRound } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminDashboardData } from "@/lib/admin-shipments";
import { getAdminPurchaseOrders, getPurchaseOrderStatusLabel, formatMoney } from "@/lib/purchase-orders";
import { getAdminStoreProducts } from "@/lib/store-products";
import { AdminEmptyState, AdminPageHeader, AdminPanel, AdminStatCard } from "@/components/admin/AdminUI";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { getShipmentStatusLabel } from "@/lib/shipments";

export const dynamic = "force-dynamic";
export const metadata = { title: "لوحة الإدارة | وصلها لي" };

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [{ shipments, stats }, orderData, products] = await Promise.all([getAdminDashboardData(), getAdminPurchaseOrders({}), getAdminStoreProducts({})]);
  const activeShipments = Math.max(0, stats.total - stats.shipped);
  const publishedProducts = products.filter((product) => product.availabilityStatus === "AVAILABLE").length;
  const shipmentGroups = [["بانتظار الوصول", stats.awaiting], ["وصلت المستودع", stats.arrived], ["تحتاج إجراء", stats.needsAction], ["جاهزة للشحن", stats.ready], ["تم الشحن أو التسليم", stats.shipped]] as const;
  return <>
    <AdminPageHeader eyebrow="نظرة تشغيلية" title="لوحة التحكم" description="ملخص مباشر لأداء الشحنات وطلبات الشراء والمنتجات." />
    <div className="admin-stats-grid">
      <AdminStatCard label="إجمالي الشحنات" value={stats.total} icon={<Truck />} />
      <AdminStatCard label="الشحنات النشطة" value={activeShipments} icon={<PackageCheck />} tone="blue" />
      <AdminStatCard label="طلبات شراء معلقة" value={orderData.stats.pending} icon={<Clock3 />} tone="red" />
      <AdminStatCard label="الطلبات المسعّرة" value={orderData.stats.quoted} icon={<CircleDollarSign />} tone="green" />
      <AdminStatCard label="المنتجات المنشورة" value={publishedProducts} icon={<Boxes />} />
      <AdminStatCard label="عدد العملاء" value={stats.customers} icon={<UsersRound />} tone="blue" />
    </div>
    <div className="admin-dashboard-grid">
      <AdminPanel title="آخر طلبات الشراء" description="أحدث الطلبات حسب آخر تحديث" action={<Link href="/admin/orders" className="admin-table-link">عرض الكل</Link>}>
        {orderData.orders.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>رقم الطلب</th><th>العميل</th><th>المنتج</th><th>الإجمالي</th><th>الحالة</th></tr></thead><tbody>{orderData.orders.slice(0, 6).map((order) => <tr key={order.id}><td><Link className="admin-table-link" href={`/admin/orders/${order.orderNumber}`}>{order.orderNumber}</Link></td><td><strong>{order.customer.name}</strong><span className="admin-ellipsis">{order.customer.email}</span></td><td><span className="admin-ellipsis">{order.productName}</span></td><td>{formatMoney(order.finalTotal)}</td><td><AdminStatusBadge status={order.status} label={getPurchaseOrderStatusLabel(order.status)} /></td></tr>)}</tbody></table></div> : <AdminEmptyState title="لا توجد طلبات شراء" />}
      </AdminPanel>
      <AdminPanel title="حالات الشحنات" description="توزيع جميع الشحنات الحالية"><div className="admin-progress-list">{shipmentGroups.map(([label, value]) => <div className="admin-progress-row" key={label}><div><span>{label}</span><strong>{value}</strong></div><div className="admin-progress-track"><i style={{ width: `${stats.total ? Math.max(4, value / stats.total * 100) : 0}%` }} /></div></div>)}</div></AdminPanel>
    </div>
    <AdminPanel className="mt-4" title="آخر الشحنات" description="أحدث الشحنات التي جرى تحديثها" action={<Link href="/admin/china-shipments" className="admin-table-link">إدارة الشحنات</Link>}>
      {shipments.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>رقم الشحنة</th><th>العميل</th><th>رقم التتبع</th><th>المنتج</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody>{shipments.slice(0, 7).map((shipment) => <tr key={shipment.id}><td><strong dir="ltr">{shipment.internalReference}</strong></td><td>{shipment.customer.name}</td><td dir="ltr">{shipment.localTrackingNumber}</td><td><span className="admin-ellipsis">{shipment.productName}</span></td><td><AdminStatusBadge status={shipment.status} label={getShipmentStatusLabel(shipment.status)} /></td><td><Link className="admin-table-action" href={`/admin/shipments/${shipment.internalReference}`}>التفاصيل</Link></td></tr>)}</tbody></table></div> : <AdminEmptyState title="لا توجد شحنات" />}
    </AdminPanel>
  </>;
}