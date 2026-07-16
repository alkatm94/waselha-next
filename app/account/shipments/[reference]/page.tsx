import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, PackageCheck } from "lucide-react";
import { DashboardShell } from "@/components/account/DashboardShell";
import { ProductImagePlaceholder, ProductLinkButton, ShipmentStepper, StatusBadge, cleanProductTitle, productDomain } from "@/components/account/ShipmentUI";
import { requireCustomer } from "@/lib/auth";
import { getCustomerShipmentByReference, getCustomerShipmentStats, getShipmentStatusLabel } from "@/lib/shipments";

export const dynamic = "force-dynamic";
export const metadata = { title: "تفاصيل الشحنة | وصلها لي" };

type ShipmentDetailParams = Promise<{ reference: string }>;

export default async function ShipmentDetailPage({ params }: { params: ShipmentDetailParams }) {
  const { reference } = await params;
  const customer = await requireCustomer(`/account/shipments/${reference}`);
  const [shipment, stats] = await Promise.all([getCustomerShipmentByReference(customer.id, reference), getCustomerShipmentStats(customer.id)]);
  if (!shipment) notFound();

  const hasDimensions = shipment.lengthCm && shipment.widthCm && shipment.heightCm;
  const hasCost = shipment.shippingFee || shipment.productPrice;
  const hasPhotos = Boolean(shipment.invoiceImageUrl) || shipment.photos.length > 0;

  return (
    <DashboardShell customer={customer} stats={stats} active="shipments" title={`تفاصيل الشحنة ${shipment.internalReference}`} description={cleanProductTitle(shipment.productName, 120)}>
      <div className="grid gap-5">
        <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm sm:p-6">
          <div className="grid gap-5 xl:grid-cols-[140px_minmax(0,1fr)_auto] xl:items-center">
            <ProductImagePlaceholder />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><StatusBadge status={shipment.status} /><span className="latin-text text-sm font-bold text-[var(--text-secondary)]" dir="ltr">{shipment.localTrackingNumber}</span></div>
              <h2 className="mt-3 text-lg font-bold leading-7 text-[var(--brand-navy)] sm:text-2xl">{cleanProductTitle(shipment.productName, 120)}</h2>
              <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-[var(--text-secondary)]">
                <span>{shipment.storeName}</span>
                <span className="latin-text" dir="ltr">{productDomain(shipment.productUrl)}</span>
                <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" />{shipment.createdAt.toLocaleDateString("ar-SA")}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 xl:items-end">
              <ProductLinkButton url={shipment.productUrl} />
              <Link href="/account/shipments" className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--border)] px-3 text-sm font-bold text-[var(--brand-navy)]">العودة للشحنات</Link>
            </div>
          </div>
        </section>

        <ShipmentStepper currentStatus={shipment.status} />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-5">
            <InfoCard title="بيانات المنتج">
              <Info label="اسم المنتج الكامل" value={shipment.productName} />
              <Info label="المتجر" value={shipment.storeName} />
              <Info label="الدومين" value={productDomain(shipment.productUrl)} dir="ltr" />
              <Info label="الكمية" value={String(shipment.quantity)} />
            </InfoCard>

            <InfoCard title="التتبع المحلي">
              <Info label="رقم التتبع داخل الصين" value={shipment.localTrackingNumber} dir="ltr" />
              <Info label="الحالة الحالية" value={getShipmentStatusLabel(shipment.status)} />
              {shipment.internationalTrackingNumber && <Info label="رقم التتبع الدولي" value={shipment.internationalTrackingNumber} dir="ltr" />}
            </InfoCard>

            <InfoCard title="الوزن والأبعاد">
              {shipment.weightKg ? <Info label="الوزن" value={`${shipment.weightKg} كجم`} /> : <EmptyLine text="لم تتم إضافة الوزن بعد." />}
              {hasDimensions ? <Info label="الأبعاد" value={`${shipment.lengthCm} × ${shipment.widthCm} × ${shipment.heightCm} سم`} /> : <EmptyLine text="لم تتم إضافة الأبعاد بعد." />}
            </InfoCard>

            {hasCost && (
              <InfoCard title="التكلفة">
                <Info label="سعر المنتج" value={`${shipment.productPrice} ${shipment.currency}`} />
                {shipment.shippingFee ? <Info label="رسوم الشحن" value={`${shipment.shippingFee} SAR`} /> : <EmptyLine text="لم تتم إضافة رسوم الشحن بعد." />}
              </InfoCard>
            )}
          </div>

          <aside className="grid gap-5 content-start">
            <section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-[var(--brand-navy)]">الخط الزمني</h2>
              <div className="mt-5 grid gap-4">
                {shipment.events.map((event) => (
                  <div key={event.id} className="relative border-r-2 border-[var(--brand-gold)] pr-4">
                    <span className="absolute -right-[7px] top-1 h-3 w-3 rounded-full bg-[var(--brand-gold)]" />
                    <p className="text-sm font-bold text-[var(--brand-navy)]">{getShipmentStatusLabel(event.status)}</p>
                    <p className="text-xs font-semibold text-[var(--text-secondary)]">{event.createdAt.toLocaleString("ar-SA")}</p>
                    {event.note && <p className="mt-1 text-sm font-medium leading-7 text-[var(--text-primary)]">{event.note}</p>}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-[var(--brand-navy)]">الصور</h2>
              {hasPhotos ? (
                <div className="mt-4 grid gap-3">
                  {shipment.invoiceImageUrl && <GalleryLink label="صورة الفاتورة" url={shipment.invoiceImageUrl} />}
                  {shipment.photos.map((photo) => <GalleryLink key={photo.id} label={photo.caption || "صورة الشحنة"} url={photo.url} />)}
                </div>
              ) : <p className="mt-3 text-sm font-semibold leading-7 text-[var(--text-secondary)]">لا توجد صور مضافة بعد.</p>}
            </section>

            {(shipment.notes || shipment.customerNote) && (
              <section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold text-[var(--brand-navy)]">الملاحظات</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-7 text-[var(--text-primary)]">{shipment.customerNote || shipment.notes}</p>
              </section>
            )}
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm sm:p-6"><h2 className="text-xl font-bold text-[var(--brand-navy)]">{title}</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{children}</div></section>;
}

function Info({ label, value, dir }: { label: string; value: string; dir?: "ltr" | "rtl" }) {
  return <div className="rounded-lg bg-[var(--background)] p-4"><p className="text-[13px] font-bold text-[var(--text-secondary)]">{label}</p><p className="mt-1 break-words text-[15px] font-bold text-[var(--text-primary)]" dir={dir}>{value}</p></div>;
}

function EmptyLine({ text }: { text: string }) {
  return <p className="rounded-lg bg-[var(--info-bg)] p-4 text-sm font-bold text-[var(--info)]">{text}</p>;
}

function GalleryLink({ label, url }: { label: string; url: string }) {
  return <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3 text-sm font-bold text-[var(--brand-navy)] transition hover:border-[var(--brand-gold)]"><PackageCheck className="h-5 w-5 text-[var(--success)]" /><span>{label}</span></a>;
}


