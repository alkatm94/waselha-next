import { redirect } from "next/navigation";
import { requireCustomer } from "@/lib/auth";
import { markAllCustomerNotificationsRead } from "@/lib/notifications";

export async function POST() {
  const customer = await requireCustomer("/account/notifications");
  await markAllCustomerNotificationsRead(customer.id);
  redirect("/account/notifications");
}
