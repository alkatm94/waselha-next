import Link from "next/link";
import { notFound } from "next/navigation";
import { Calculator, History, ImagePlus, PackageCheck } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { calculateVolumetricWeight, getAdminShipment, updateShipmentOperations } from "@/lib/admin-shipments";
import { SHIPMENT_STATUSES, getShipmentStatusLabel } from "@/lib/shipments";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { StatusBadge } from "@/components/account/ShipmentUI";

export const dynamic = "force-dynamic";
export const metadata = { title: "تشغيل الشحنة | وصلها لي" };

type Params = Promise<{ reference: string }>;

export default async function AdminShipmentPage({ params }: { params: Params }) {
  const admin = await requireAdmin();
  const { reference } = await params;
  const shipment = await getAdminShipment(reference);
  if (!shipment) notFound();

  async function updateAction(formData: FormData) {
    "use server";
    const activeAdmin = await requireAdmin();
    await updateShipmentOperations(activeAdmin, formData);
  }

  const volumetric = calculateVolumetricWeight(shipment.lengthCm, shipment.widthCm, shipment.heightCm);

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/admin" className="text-sm font-bold text-[var(--brand-navy)]">العودة للوحة التشغيل</Link>
            <h1 className="mt-1 text-2xl font-bold text-[var(--brand-navy)]">تشغيل الشحنة <span dir="ltr" className="latin-text">{shipment.internalReference}</span></h1>
          </div>
          <div className="flex items-center gap-3"><AdminNotificationBell adminId={admin.id} /><StatusBadge status={shipment.status} /></div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-6">
          <section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--brand-navy)]">بيانات الشحنة والعميل</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Info label="العميل" value={shipment.customer.name} />
              <Info label="Customer ID" value={shipment.customerCode} ltr />
              <Info label="البريد" value={shipment.customer.email} ltr />
              <Info label="رقم التتبع المحلي" value={shipment.localTrackingNumber} ltr />
              <Info label="المتجر" value={shipment.storeName} />
              <Info label="تاريخ التسجيل" value={shipment.createdAt.toLocaleString("ar-SA")} />
            </div>
          </section>

          <form action={updateAction} className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm" encType="multipart/form-data">
            <input type="hidden" name="shipmentId" value={shipment.id} />
            <div className="flex items-center gap-2"><PackageCheck className="h-5 w-5 text-[var(--success)]" /><h2 className="text-xl font-bold text-[var(--brand-navy)]">تحديث التشغيل</h2></div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <label className="grid gap-2 text-sm font-bold">الحالة<select name="status" defaultValue={shipment.status} className="input">{SHIPMENT_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
              <label className="grid gap-2 text-sm font-bold">الوزن الفعلي KG<input name="actualWeightKg" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={shipment.actualWeightKg ?? shipment.weightKg ?? ""} className="input" /></label>
              <label className="grid gap-2 text-sm font-bold">الوزن المحتسب KG<input name="chargeableWeightKg" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={shipment.chargeableWeightKg ?? ""} className="input" /></label>
              <label className="grid gap-2 text-sm font-bold">الطول CM<input name="lengthCm" type="number" inputMode="decimal" min="0" step="0.1" defaultValue={shipment.lengthCm ?? ""} className="input" /></label>
              <label className="grid gap-2 text-sm font-bold">العرض CM<input name="widthCm" type="number" inputMode="decimal" min="0" step="0.1" defaultValue={shipment.widthCm ?? ""} className="input" /></label>
              <label className="grid gap-2 text-sm font-bold">الارتفاع CM<input name="heightCm" type="number" inputMode="decimal" min="0" step="0.1" defaultValue={shipment.heightCm ?? ""} className="input" /></label>
              <label className="grid gap-2 text-sm font-bold">رسوم الشحن SAR<input name="shippingFee" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={shipment.shippingFee ?? ""} className="input" /></label>
              <label className="grid gap-2 text-sm font-bold">رقم التتبع الدولي<input name="internationalTrackingNumber" autoCapitalize="none" defaultValue={shipment.internationalTrackingNumber ?? ""} className="input latin-text" dir="ltr" /></label>
              <label className="grid gap-2 text-sm font-bold">رفع صورة من المستودع<input name="warehousePhoto" type="file" accept="image/*" className="input py-2" /></label>
              <label className="grid gap-2 text-sm font-bold md:col-span-3">ملاحظات للعميل<textarea name="customerNote" rows={3} defaultValue={shipment.customerNote ?? ""} className="input h-24 py-3" /></label>
              <label className="grid gap-2 text-sm font-bold md:col-span-3">ملاحظات داخلية لا يراها العميل<textarea name="internalNote" rows={3} defaultValue={shipment.internalNote ?? ""} className="input h-24 py-3" /></label>
            </div>
            <div className="mt-5 rounded-lg bg-[var(--info-bg)] p-4 text-sm font-bold text-[var(--info)]">
              <Calculator className="mb-2 h-5 w-5" />الوزن الحجمي الحالي: {volumetric ? `${volumetric} KG` : "لم تكتمل الأبعاد بعد"}. إذا تركت الوزن المحتسب فارغًا سيتم اختيار الأكبر بين الوزن الفعلي والحجمي.
            </div>
            <button className="mt-5 h-12 rounded-lg bg-[var(--brand-gold)] px-5 text-sm font-bold text-[var(--brand-navy)]">حفظ التحديث</button>
          </form>
        </div>

        <aside className="grid gap-6 content-start">
          <section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--brand-navy)]">حالات غير مكتملة</h2>
            <div className="mt-4 grid gap-2 text-sm font-bold text-[var(--text-secondary)]">
              <Missing ok={Boolean(shipment.actualWeightKg || shipment.weightKg)} text="لم يتم الوزن بعد" />
              <Missing ok={Boolean(shipment.lengthCm && shipment.widthCm && shipment.heightCm)} text="لم تتم إضافة الأبعاد بعد" />
              <Missing ok={Boolean(shipment.shippingFee)} text="لم تتم إضافة رسوم الشحن بعد" />
              <Missing ok={Boolean(shipment.internationalTrackingNumber)} text="لم تتم إضافة التتبع الدولي بعد" />
            </div>
          </section>

          <section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--brand-navy)]">الخط الزمني للعميل</h2>
            <div className="mt-4 grid gap-3">
              {shipment.events.map((event) => <div key={event.id} className="border-r-2 border-[var(--brand-gold)] pr-3"><p className="font-bold text-[var(--brand-navy)]">{getShipmentStatusLabel(event.status)}</p><p className="text-xs font-semibold text-[var(--text-secondary)]">{event.createdAt.toLocaleString("ar-SA")}</p>{event.note && <p className="text-sm font-semibold leading-7">{event.note}</p>}</div>)}
            </div>
          </section>

          <section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold text-[var(--brand-navy)]"><ImagePlus className="h-5 w-5" />صور المستودع</h2>
            <div className="mt-4 grid gap-2">{shipment.photos.length ? shipment.photos.map((photo) => <a key={photo.id} href={photo.url} target="_blank" className="rounded-lg border border-[var(--border)] p-3 text-sm font-bold text-[var(--brand-navy)]">{photo.caption || "صورة مستودع"}</a>) : <p className="text-sm font-bold text-[var(--text-secondary)]">لا توجد صور بعد.</p>}</div>
          </section>

          <section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold text-[var(--brand-navy)]"><History className="h-5 w-5" />Audit Log</h2>
            <div className="mt-4 grid gap-3">
              {shipment.auditLogs.map((log) => <div key={log.id} className="rounded-lg bg-[var(--background)] p-3 text-sm"><p className="font-bold text-[var(--brand-navy)]">{log.field}</p><p className="text-xs font-semibold text-[var(--text-secondary)]">{log.admin?.name || log.adminEmail} - {log.createdAt.toLocaleString("ar-SA")}</p><p className="mt-1 break-words text-xs"><span className="text-[var(--danger)]">{log.previousValue || "فارغ"}</span> ← <span className="text-[var(--success)]">{log.newValue || "فارغ"}</span></p></div>)}
              {shipment.auditLogs.length === 0 && <p className="text-sm font-bold text-[var(--text-secondary)]">لا توجد تعديلات مسجلة بعد.</p>}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function Info({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) { return <div className="rounded-lg bg-[var(--background)] p-3"><p className="text-xs font-bold text-[var(--text-secondary)]">{label}</p><p className="mt-1 break-words text-sm font-bold" dir={ltr ? "ltr" : "rtl"}>{value}</p></div>; }
function Missing({ ok, text }: { ok: boolean; text: string }) { return <p className={`rounded-lg p-3 ${ok ? "bg-[var(--success-bg)] text-[var(--success)]" : "bg-[var(--warning-bg)] text-[var(--warning)]"}`}>{ok ? "مكتمل" : text}</p>; }

