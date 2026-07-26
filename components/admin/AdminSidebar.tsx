"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, LayoutDashboard, LogOut, PackageSearch, ShoppingBag, X } from "lucide-react";

const links = [
  { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard, exact: true },
  { href: "/admin/china-shipments", label: "الشحنات", icon: PackageSearch },
  { href: "/admin/orders", label: "طلبات الشراء", icon: ShoppingBag },
  { href: "/admin/store-products", label: "منتجات المتاجر", icon: Boxes },
];

export function AdminSidebar({ open, onClose, admin }: { open: boolean; onClose: () => void; admin: { name: string; role: string } }) {
  const pathname = usePathname();
  return (
    <>
      {open && <button aria-label="إغلاق القائمة" className="admin-overlay" onClick={onClose} />}
      <aside className={`admin-sidebar ${open ? "is-open" : ""}`}>
        <div className="admin-brand">
          <div className="admin-brand-mark">و</div>
          <div><strong>وصلها لي</strong><span>لوحة الإدارة</span></div>
          <button className="admin-close" onClick={onClose} aria-label="إغلاق القائمة"><X /></button>
        </div>
        <div className="admin-profile">
          <div className="admin-avatar">{admin.name.slice(0, 1)}</div>
          <div className="min-w-0"><strong className="truncate">{admin.name}</strong><span>{admin.role}</span></div>
        </div>
        <nav className="admin-nav" aria-label="التنقل الإداري">
          <p>الإدارة</p>
          {links.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href) || (href === "/admin/china-shipments" && pathname.startsWith("/admin/shipments"));
            return <Link key={href} href={href} className={active ? "active" : ""} onClick={onClose}><Icon /><span>{label}</span></Link>;
          })}
        </nav>
        <form action="/admin/logout" method="post" className="admin-logout">
          <button><LogOut /><span>تسجيل الخروج</span></button>
        </form>
      </aside>
    </>
  );
}
