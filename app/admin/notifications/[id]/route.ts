import { requireAdmin } from "@/lib/admin-auth";
import { markAdminNotificationRead } from "@/lib/notifications";

type Params = Promise<{ id: string }>;
export async function GET(_: Request, { params }: { params: Params }) {
  const admin = await requireAdmin();
  const { id } = await params;
  await markAdminNotificationRead(admin.id, Number(id));
}
