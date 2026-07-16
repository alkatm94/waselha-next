import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { markAllAdminNotificationsRead } from "@/lib/notifications";

export async function POST() {
  const admin = await requireAdmin();
  await markAllAdminNotificationsRead(admin.id);
  redirect("/admin");
}
