import Link from "next/link";
import { Bell, Home, LogOut, MapPinned, Package, PackagePlus, UserRound } from "lucide-react";
import { getCustomerNotificationSummary, notificationIcon } from "@/lib/notifications";

type DashboardStats = {
  active: number;
  arrived: number;
  needsAction: number;
};

type DashboardShellProps = {
  customer: { id: number; name: string; customerId: string };
  stats: DashboardStats;
  active: "overview" | "address" | "new-shipment" | "shipments" | "account";
  title: string;
  description?: string;
  children: React.ReactNode;
};

const navItems = [
  { key: "overview", href: "/account", label: "نظرة عامة", icon: Home },
  { key: "address", href: "/account/china-address", label: "عنواني في الصين", icon: MapPinned },
  { key: "new-shipment", href: "/account/china-address/shipments/new", label: "تسجيل شحنة", icon: PackagePlus },
  { key: "shipments", href: "/account/shipments", label: "شحناتي", icon: Package },
  { key: "account", href: "/account", label: "حسابي", icon: UserRound },
] as const;

export async function DashboardShell({ customer, stats, active, title, description, children }: DashboardShellProps) {
  const notifications = await getCustomerNotificationSummary(customer.id);
  return (
    <main dir="rtl" className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div className="mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen border-l border-[var(--border)] bg-[var(--brand-navy)] px-5 py-6 text-white lg:block">
          <Link href="/" className="block text-2xl font-bold text-white">وصلها لي</Link>
          <p className="mt-1 text-sm font-medium text-white/65">لوحة العميل</p>

          <div className="mt-7 rounded-lg bg-white/8 p-4">
            <p className="text-sm font-semibold text-white/65">مرحبًا</p>
            <p className="mt-1 text-lg font-bold text-white">{customer.name}</p>
            <p className="mt-2 w-fit rounded-lg bg-white/10 px-3 py-1 text-sm font-bold text-[var(--brand-gold)]" dir="ltr">{customer.customerId}</p>
          </div>

          <nav className="mt-7 grid gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const selected = item.key === active;
              return (
                <Link key={item.key} href={item.href} className={`flex h-12 items-center gap-3 rounded-lg px-3 text-sm font-bold transition ${selected ? "bg-[var(--brand-gold)] text-[var(--brand-navy)]" : "text-white/78 hover:bg-white/10 hover:text-white"}`}>
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
            <form action="/logout" method="post" className="mt-3 border-t border-white/10 pt-3">
              <button className="flex h-12 w-full items-center gap-3 rounded-lg px-3 text-sm font-bold text-white/78 transition hover:bg-white/10 hover:text-white">
                <LogOut className="h-5 w-5" />تسجيل الخروج
              </button>
            </form>
          </nav>
        </aside>

        <section className="min-w-0 pb-[calc(78px+env(safe-area-inset-bottom))] lg:pb-0">
          <header className="border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8 lg:py-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--brand-gold-dark)]">{customer.customerId}</p>
                <h1 className="mt-1 text-[26px] font-bold leading-tight text-[var(--brand-navy)] sm:text-[34px]">{title}</h1>
                {description && <p className="mt-2 max-w-3xl text-[15px] font-medium leading-7 text-[var(--text-secondary)]">{description}</p>}
              </div>
              <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-3 sm:min-w-[430px]">
                <Stat label="نشطة" value={stats.active} />
                <Stat label="وصلت" value={stats.arrived} />
                <Stat label="تحتاج إجراء" value={stats.needsAction} tone="warning" />
              </div>
            </div>
          </header>

          <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[var(--border)] bg-white px-2 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(11,42,61,0.08)] lg:hidden">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const selected = item.key === active;
          return (
            <Link key={item.key} href={item.href} className={`grid min-h-11 place-items-center gap-0.5 rounded-lg text-[10px] font-bold ${selected ? "bg-[var(--info-bg)] text-[var(--brand-navy)]" : "text-[var(--text-secondary)]"}`}>
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </main>
  );
}

function Stat({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "warning" }) {
  return (
    <div className={`rounded-lg border p-3 ${tone === "warning" ? "border-[var(--warning-bg)] bg-[var(--warning-bg)]" : "border-[var(--border)] bg-[var(--surface)]"}`}>
      <p className="text-[13px] font-semibold text-[var(--text-secondary)]">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-[var(--brand-navy)]">{value}</p>
    </div>
  );
}


function NotificationBell({ unread, recent }: { unread: number; recent: { id: number; type: string; title: string; message: string; isRead: boolean; createdAt: Date; shipment: { internalReference: string } | null }[] }) {
  return (
    <details className="relative">
      <summary className="flex h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-white px-4 text-sm font-bold text-[var(--brand-navy)]">
        <Bell className="h-4 w-4" />الإشعارات
        {unread > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-[var(--danger)] px-1.5 text-xs text-white">{unread}</span>}
      </summary>
      <div className="absolute left-0 top-12 z-50 w-[min(360px,calc(100vw-32px))] rounded-lg border border-[var(--border)] bg-white p-3 shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-2">
          <b className="text-sm text-[var(--brand-navy)]">أحدث الإشعارات</b>
          <form action="/account/notifications/mark-all" method="post"><button className="text-xs font-bold text-[var(--info)]">تحديد الكل كمقروء</button></form>
        </div>
        <div className="mt-2 grid max-h-80 gap-2 overflow-y-auto">
          {recent.map((item) => (
            <a key={item.id} href={`/account/notifications/${item.id}`} className={`rounded-lg p-3 text-sm ${item.isRead ? "bg-white" : "bg-[var(--info-bg)]"}`}>
              <span className="text-xs font-bold text-[var(--info)]">{notificationIcon(item.type)}</span>
              <p className="font-bold text-[var(--brand-navy)]">{item.title}</p>
              <p className="line-clamp-2 text-xs font-semibold leading-5 text-[var(--text-secondary)]">{item.message}</p>
            </a>
          ))}
          {recent.length === 0 && <p className="p-3 text-sm font-bold text-[var(--text-secondary)]">لا توجد إشعارات.</p>}
        </div>
        <a href="/account/notifications" className="mt-2 block rounded-lg border border-[var(--border)] p-2 text-center text-sm font-bold text-[var(--brand-navy)]">عرض كل الإشعارات</a>
      </div>
    </details>
  );
}
