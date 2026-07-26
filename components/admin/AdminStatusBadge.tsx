const tones: Record<string, string> = {
  PENDING: "warning",
  QUOTED: "info",
  APPROVED: "success",
  AVAILABLE: "success",
  UNAVAILABLE: "danger",
  REJECTED: "danger",
  CANCELLED: "muted",
  SHIPPED: "info",
  DELIVERED: "success",
  AWAITING_SHIPPING_PAYMENT: "warning",
  READY_TO_SHIP: "success",
};

export function AdminStatusBadge({ status, label }: { status: string; label: string }) {
  return <span className={`admin-status admin-status--${tones[status] || "info"}`}>{label}</span>;
}
