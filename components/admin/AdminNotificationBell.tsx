import { Bell } from "lucide-react";
import { getAdminNotificationSummary, notificationIcon } from "@/lib/notifications";

export async function AdminNotificationBell({ adminId }: { adminId: number }) {
  const { unread, recent } = await getAdminNotificationSummary(adminId);
  return (
    <details className="relative">
      <summary className="flex h-10 cursor-pointer list-none items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 text-sm font-bold text-[var(--brand-navy)]">
        <Bell className="h-4 w-4" />
        {unread > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-[var(--danger)] px-1.5 text-xs text-white">{unread}</span>}
      </summary>
      <div className="absolute left-0 top-11 z-50 w-[min(360px,calc(100vw-32px))] rounded-lg border border-[var(--border)] bg-white p-3 shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-2"><b className="text-sm text-[var(--brand-navy)]">إشعارات الإدارة</b><form action="/admin/notifications/mark-all" method="post"><button className="text-xs font-bold text-[var(--info)]">تحديد الكل كمقروء</button></form></div>
        <div className="mt-2 grid max-h-80 gap-2 overflow-y-auto">
          {recent.map((item) => <a key={item.id} href={`/admin/notifications/${item.id}`} className={`rounded-lg p-3 text-sm ${item.isRead ? "bg-white" : "bg-[var(--warning-bg)]"}`}><span className="text-xs font-bold text-[var(--warning)]">{notificationIcon(item.type)}</span><p className="font-bold text-[var(--brand-navy)]">{item.title}</p><p className="line-clamp-2 text-xs font-semibold leading-5 text-[var(--text-secondary)]">{item.message}</p></a>)}
          {recent.length === 0 && <p className="p-3 text-sm font-bold text-[var(--text-secondary)]">لا توجد إشعارات.</p>}
        </div>
      </div>
    </details>
  );
}
