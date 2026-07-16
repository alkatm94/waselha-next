import Link from "next/link";
import { Bell } from "lucide-react";
import { DashboardShell } from "@/components/account/DashboardShell";
import { requireCustomer } from "@/lib/auth";
import { getCustomerShipmentStats } from "@/lib/shipments";
import { getCustomerNotifications, notificationIcon } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const metadata = { title: "الإشعارات | وصلها لي" };

export default async function CustomerNotificationsPage() {
  const customer = await requireCustomer("/account/notifications");
  const [stats, notifications] = await Promise.all([getCustomerShipmentStats(customer.id), getCustomerNotifications(customer.id)]);

  return (
    <DashboardShell customer={customer} stats={stats} active="account" title="الإشعارات" description="كل تحديث مهم على شحناتك يظهر هنا داخل حسابك.">
      <div className="mb-4 flex justify-end"><form action="/account/notifications/mark-all" method="post"><button className="h-11 rounded-lg border border-[var(--border)] bg-white px-4 text-sm font-bold text-[var(--brand-navy)]">تحديد الكل كمقروء</button></form></div>
      <div className="grid gap-3">
        {notifications.map((item) => (
          <Link key={item.id} href={`/account/notifications/${item.id}`} className={`grid gap-2 rounded-lg border border-[var(--border)] p-4 shadow-sm ${item.isRead ? "bg-white" : "bg-[var(--info-bg)]"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="inline-flex items-center gap-2 text-sm font-bold text-[var(--info)]"><Bell className="h-4 w-4" />{notificationIcon(item.type)}</span><span className="text-xs font-semibold text-[var(--text-secondary)]">{item.createdAt.toLocaleString("ar-SA")}</span></div>
            <h2 className="text-lg font-bold text-[var(--brand-navy)]">{item.title}</h2>
            <p className="text-sm font-semibold leading-7 text-[var(--text-secondary)]">{item.message}</p>
            {item.shipment && <span className="latin-text text-xs font-bold text-[var(--brand-navy)]" dir="ltr">{item.shipment.internalReference}</span>}
          </Link>
        ))}
        {notifications.length === 0 && <p className="rounded-lg border border-[var(--border)] bg-white p-6 text-center text-sm font-bold text-[var(--text-secondary)]">لا توجد إشعارات بعد.</p>}
      </div>
    </DashboardShell>
  );
}
