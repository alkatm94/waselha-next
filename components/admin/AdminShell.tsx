"use client";

import { ReactNode, useState } from "react";
import { Menu, Search, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";

const titles: Array<[string, string]> = [
  ["/admin/store-products/new", "إضافة منتج"],
  ["/admin/store-products", "منتجات المتاجر"],
  ["/admin/orders/", "تفاصيل طلب الشراء"],
  ["/admin/orders", "طلبات الشراء"],
  ["/admin/shipments/", "تفاصيل الشحنة"],
  ["/admin/china-shipments", "الشحنات"],
  ["/admin", "لوحة التحكم"],
];

export function AdminShell({ admin, notifications, children }: { admin: { name: string; role: string }; notifications: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const title = titles.find(([path]) => path === "/admin" ? pathname === path : pathname.startsWith(path))?.[1] || "لوحة الإدارة";
  function search(formData: FormData) {
    const q = String(formData.get("q") || "").trim();
    router.push(`${pathname}${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  }
  return (
    <div className="admin-shell" dir="rtl">
      <AdminSidebar open={open} onClose={() => setOpen(false)} admin={admin} />
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <button className="admin-menu" onClick={() => setOpen(true)} aria-label="فتح القائمة"><Menu /></button>
            <div><span>الإدارة / {title}</span><strong>{title}</strong></div>
          </div>
          <form action={search} className="admin-global-search">
            <Search /><input name="q" placeholder="بحث في الصفحة الحالية" aria-label="بحث" />
          </form>
          <div className="admin-topbar-actions">{notifications}<div className="admin-user"><UserRound /><span>{admin.name}</span></div></div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
