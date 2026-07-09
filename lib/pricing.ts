export type QuoteInput = {
  productPrice: number;
  currency: "USD" | "CNY" | "JPY" | "EUR";
  weightKg: number;
  country: "china" | "japan" | "usa" | "europe";
  serviceTier: "quote" | "standard" | "plus" | "pro";
};

const fx: Record<QuoteInput["currency"], number> = {
  USD: 3.75,
  CNY: 0.52,
  JPY: 0.026,
  EUR: 4.1,
};

const shippingPerKg: Record<QuoteInput["country"], number> = {
  china: 42,
  japan: 65,
  usa: 75,
  europe: 85,
};

const serviceFees: Record<QuoteInput["serviceTier"], number> = {
  quote: 99,
  standard: 199,
  plus: 299,
  pro: 499,
};

export function calculateQuote(input: QuoteInput) {
  const safeWeight = Math.max(Number(input.weightKg || 0), 0.5);
  const productSar = Number(input.productPrice || 0) * fx[input.currency];
  const shippingSar = safeWeight * shippingPerKg[input.country];
  const serviceFee = serviceFees[input.serviceTier];
  const total = Math.ceil(productSar + shippingSar + serviceFee);

  return {
    productSar: Math.ceil(productSar),
    shippingSar: Math.ceil(shippingSar),
    serviceFee,
    total,
  };
}
