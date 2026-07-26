import { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { AdminShell } from "@/components/admin/AdminShell";
import "../admin.css";

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  return <AdminShell admin={{ name: admin.name, role: admin.role }} notifications={<AdminNotificationBell adminId={admin.id} />}>{children}</AdminShell>;
}
