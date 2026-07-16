import { redirect } from "next/navigation";
import { logoutAdmin } from "@/lib/admin-auth";

export async function POST() {
  await logoutAdmin();
  redirect("/admin/login");
}

export async function GET() {
  await logoutAdmin();
  redirect("/admin/login");
}
