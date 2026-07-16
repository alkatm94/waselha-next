import { requireCustomer } from "@/lib/auth";
import { markCustomerNotificationRead } from "@/lib/notifications";

type Params = Promise<{ id: string }>;
export async function GET(_: Request, { params }: { params: Params }) {
  const customer = await requireCustomer("/account/notifications");
  const { id } = await params;
  await markCustomerNotificationRead(customer.id, Number(id));
}
