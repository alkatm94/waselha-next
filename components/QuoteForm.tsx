"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Check, MessageCircle } from "lucide-react";

type Quote = {
  productSar: number;
  shippingSar: number;
  serviceFee: number;
  total: number;
};

const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "966500000000";

const tiers = [
  { value: "quote", label: "Starter - تسعير الطلب", price: "99 ريال" },
  { value: "standard", label: "Standard - شراء منتج واحد", price: "199 ريال" },
  { value: "plus", label: "Plus - شراء ومتابعة", price: "299 ريال" },
  { value: "pro", label: "Pro - طلب خاص / مورد", price: "499 ريال" },
];

export function QuoteForm() {
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    productUrl: "",
    productName: "",
    country: "china",
    currency: "USD",
    productPrice: "",
    weightKg: "1",
    serviceTier: "standard",
  });
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);

  const ready = useMemo(
    () => form.productUrl.trim().length > 5 && Number(form.productPrice) > 0 && Number(form.weightKg) > 0,
    [form]
  );

  function update(key: string, value: string) {
    setForm((old) => ({ ...old, [key]: value }));
  }

  async function calculate() {
    setLoading(true);
    const res = await fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setQuote(data.result);
    setLoading(false);
  }

  async function sendLead() {
    let currentQuote = quote;
    if (!currentQuote) {
      setLoading(true);
      const quoteRes = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const quoteData = await quoteRes.json();
      currentQuote = quoteData.result;
      setQuote(currentQuote);
      setLoading(false);
    }

    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const tier = tiers.find((item) => item.value === form.serviceTier)?.label || "Standard";
    const msg = `السلام عليكم، أبغى أطلب منتج من الخارج%0A%0Aالاسم: ${form.customerName || "-"}%0Aالجوال: ${form.phone || "-"}%0Aاسم المنتج: ${form.productName || "-"}%0Aرابط المنتج: ${form.productUrl}%0Aالدولة: ${countryLabel(form.country)}%0Aسعر المنتج: ${form.productPrice} ${form.currency}%0Aالوزن التقريبي: ${form.weightKg} KG%0Aالباقة: ${tier}%0Aالتقدير المبدئي: ${currentQuote?.total?.toLocaleString() || "غير محسوب"} ريال%0A%0Aأرسلوا لي السعر النهائي والتفاصيل.`;
    window.open(`https://wa.me/${whatsapp}?text=${msg}`, "_blank");
  }

  return (
    <section id="quote" className="section quote-section">
      <div className="section-heading">
        <span className="eyebrow">حاسبة طلب سريعة</span>
        <h2>احصل على سعر مبدئي خلال أقل من دقيقة</h2>
        <p>الهدف من الحاسبة أنها تفتح المحادثة مع العميل بسرعة. السعر النهائي يتم تأكيده بعد مراجعة الرابط والتوفر وخيار الشحن.</p>
      </div>

      <div className="quote-grid">
        <form className="quote-card" onSubmit={(event) => event.preventDefault()}>
          <div className="form-row form-wide">
            <label>رابط المنتج</label>
            <input
              placeholder="الصق رابط المنتج من Alibaba / Amazon / Rakuten / موقع المورد"
              value={form.productUrl}
              onChange={(e) => update("productUrl", e.target.value)}
            />
          </div>

          <div className="form-row">
            <label>اسم المنتج</label>
            <input placeholder="مثال: MOZA R5 Bundle" value={form.productName} onChange={(e) => update("productName", e.target.value)} />
          </div>

          <div className="form-row">
            <label>سعر المنتج</label>
            <input type="number" placeholder="320" value={form.productPrice} onChange={(e) => update("productPrice", e.target.value)} />
          </div>

          <div className="form-row">
            <label>العملة</label>
            <select value={form.currency} onChange={(e) => update("currency", e.target.value)}>
              <option value="USD">USD - دولار</option>
              <option value="CNY">CNY - يوان</option>
              <option value="JPY">JPY - ين</option>
              <option value="EUR">EUR - يورو</option>
            </select>
          </div>

          <div className="form-row">
            <label>دولة الشراء</label>
            <select value={form.country} onChange={(e) => update("country", e.target.value)}>
              <option value="china">الصين</option>
              <option value="japan">اليابان</option>
              <option value="usa">أمريكا</option>
              <option value="europe">أوروبا</option>
            </select>
          </div>

          <div className="form-row">
            <label>الوزن التقريبي KG</label>
            <input type="number" value={form.weightKg} onChange={(e) => update("weightKg", e.target.value)} />
          </div>

          <div className="form-row">
            <label>الباقة</label>
            <select value={form.serviceTier} onChange={(e) => update("serviceTier", e.target.value)}>
              {tiers.map((tier) => (
                <option key={tier.value} value={tier.value}>{tier.label} - {tier.price}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>اسم العميل</label>
            <input placeholder="اختياري" value={form.customerName} onChange={(e) => update("customerName", e.target.value)} />
          </div>

          <div className="form-row">
            <label>رقم الجوال</label>
            <input placeholder="اختياري" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>

          <div className="form-actions form-wide">
            <button className="btn btn-secondary" disabled={!ready || loading} onClick={calculate}>
              {loading ? "جاري الحساب..." : "احسب السعر"}
            </button>
            <button className="btn btn-primary" disabled={!ready} onClick={sendLead}>
              <MessageCircle size={18} /> إرسال الطلب واتساب
            </button>
          </div>
        </form>

        <aside className="estimate-card">
          <span className="estimate-label">التقدير المبدئي</span>
          <strong className="estimate-total">{quote ? quote.total.toLocaleString() : "—"}<small> ريال</small></strong>
          <div className="estimate-lines">
            <Line label="سعر المنتج بالريال" value={quote?.productSar} />
            <Line label="الشحن التقريبي" value={quote?.shippingSar} />
            <Line label="رسوم الباقة" value={quote?.serviceFee} />
          </div>
          <div className="estimate-note">
            <Check size={18} /> لا نعرض للعميل مصطلحات مخيفة مثل الجمارك أو هامش احتياطي. نخليه يرسل الرابط، وبعد المراجعة نعطيه السعر النهائي.
          </div>
          <button className="btn btn-primary estimate-btn" disabled={!ready} onClick={sendLead}>
            اطلب عرض نهائي <ArrowLeft size={18} />
          </button>
        </aside>
      </div>
    </section>
  );
}

function Line({ label, value }: { label: string; value?: number }) {
  return (
    <div className="estimate-line">
      <span>{label}</span>
      <b>{value ? `${value.toLocaleString()} ريال` : "—"}</b>
    </div>
  );
}

function countryLabel(country: string) {
  const labels: Record<string, string> = {
    china: "الصين",
    japan: "اليابان",
    usa: "أمريكا",
    europe: "أوروبا",
  };
  return labels[country] || country;
}
