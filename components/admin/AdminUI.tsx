import { ReactNode } from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";

export function AdminPageHeader({ title, description, action, eyebrow }: { title: string; description?: string; action?: ReactNode; eyebrow?: string }) {
  return <div className="admin-page-header"><div>{eyebrow && <span>{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}

export function AdminStatCard({ label, value, icon, hint, tone = "gold" }: { label: string; value: number | string; icon: ReactNode; hint?: string; tone?: "gold" | "blue" | "green" | "red" }) {
  return <article className="admin-stat-card"><div className={`admin-stat-icon ${tone}`}>{icon}</div><div><p>{label}</p><strong>{value}</strong>{hint && <span>{hint}</span>}</div></article>;
}

export function AdminPanel({ title, description, action, children, className = "" }: { title?: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`admin-panel ${className}`}>{(title || action) && <header className="admin-panel-header"><div>{title && <h2>{title}</h2>}{description && <p>{description}</p>}</div>{action}</header>}{children}</section>;
}

export function AdminEmptyState({ title, description = "لا توجد بيانات متاحة حاليًا." }: { title: string; description?: string }) {
  return <div className="admin-empty"><Inbox /><strong>{title}</strong><p>{description}</p></div>;
}

export function AdminActionLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="admin-primary-button">{children}</Link>;
}
