import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createPurchaseOrder } from "@/lib/purchase-orders";
import { fetchMercariProduct } from "@/lib/mercari-import";

export const STORE_PRODUCT_STATUSES = [
  { value: "AVAILABLE", label: "متوفر" },
  { value: "SOLD", label: "مباع" },
  { value: "HIDDEN", label: "مخفي" },
  { value: "NEEDS_REVIEW", label: "يحتاج مراجعة" },
] as const;

export const STORE_NAMES = ["Mercari Japan"] as const;

const JPY_TO_SAR = 0.025;
const REQUEST_TIMEOUT_MS = 7000;
const MAX_HTML_BYTES = 900_000;

type StoreProductStatus = (typeof STORE_PRODUCT_STATUSES)[number]["value"];

export type StoreProductPreview = {
  originalUrl: string;
  externalProductId: string;
  arabicName: string;
  originalName: string;
  description: string;
  priceJpy: string;
  approxPriceSar: string;
  imageUrls: string;
  category: string;
  brand: string;
  productCondition: string;
  availabilityStatus: StoreProductStatus;
  isFeatured: boolean;
  displayOrder: string;
  lastCheckedAt: string;
  fetchNotice?: string;
};

function requiredText(formData: FormData, key: string, label: string) {
  const value = String(formData.get(key) || "").trim();
  if (!value) throw new Error(`حقل ${label} مطلوب.`);
  return value;
}

function optionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) || "").trim();
  return value || null;
}

function assertUrl(value: string, label: string) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    return url.toString();
  } catch {
    throw new Error(`${label} يجب أن يكون رابطًا صحيحًا يبدأ بـ http أو https.`);
  }
}

function numberOrNull(value: string | null) {
  if (!value) return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : null;
}

function intOrNull(value: string | null) {
  const numberValue = numberOrNull(value);
  return numberValue === null ? null : Math.round(numberValue);
}

function statusValue(value: string | null): StoreProductStatus {
  return STORE_PRODUCT_STATUSES.some((item) => item.value === value) ? (value as StoreProductStatus) : "NEEDS_REVIEW";
}

function parseImages(value: string | null) {
  return (value || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => {
      try {
        const url = new URL(item);
        return ["http:", "https:"].includes(url.protocol);
      } catch {
        return false;
      }
    });
}

export function imageUrlsFromJson(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
  } catch {
    return [];
  }
}

export function primaryImage(value: string | null | undefined) {
  return imageUrlsFromJson(value)[0] || null;
}

export function formatStoreStatus(status: string) {
  return STORE_PRODUCT_STATUSES.find((item) => item.value === status)?.label || status;
}

export function formatJpy(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(value);
}

export function formatApproxSar(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "-";
  return `حوالي ${Math.ceil(numberValue).toLocaleString("ar-SA")} ريال`;
}

export function extractMercariId(urlValue: string) {
  try {
    const url = new URL(urlValue);
    const match = url.pathname.match(/(?:item|items)\/([A-Za-z0-9_-]+)/) || url.pathname.match(/\/m([0-9]+)/);
    return match?.[1] || "";
  } catch {
    return "";
  }
}

function fallbackPreview(originalUrl: string, fetchNotice?: string): StoreProductPreview {
  return {
    originalUrl,
    externalProductId: extractMercariId(originalUrl),
    arabicName: "",
    originalName: "",
    description: "",
    priceJpy: "",
    approxPriceSar: "",
    imageUrls: "",
    category: "",
    brand: "",
    productCondition: "",
    availabilityStatus: "NEEDS_REVIEW",
    isFeatured: false,
    displayOrder: "0",
    lastCheckedAt: new Date().toISOString().slice(0, 16),
    fetchNotice,
  };
}

export async function previewStoreProductFromUrl(originalUrl: string): Promise<StoreProductPreview> {
  const normalizedUrl = assertUrl(originalUrl, "رابط المنتج الأصلي");
  const fallback = fallbackPreview(normalizedUrl);
  const imported = await fetchMercariProduct(normalizedUrl, JPY_TO_SAR);

  return {
    ...fallback,
    originalUrl: imported.originalUrl,
    externalProductId: imported.externalProductId,
    originalName: imported.name,
    arabicName: imported.name,
    description: imported.description,
    priceJpy: imported.priceJpy?.toString() || "",
    approxPriceSar: imported.approxPriceSar?.toString() || "",
    imageUrls: imported.images.join("\n"),
    category: imported.category,
    brand: imported.brand,
    productCondition: imported.condition,
    availabilityStatus: imported.availabilityStatus,
    fetchNotice: imported.notice,
  };
}
function productDataFromForm(formData: FormData) {
  const originalUrl = assertUrl(requiredText(formData, "originalUrl", "رابط المنتج الأصلي"), "رابط المنتج الأصلي");
  const priceJpy = intOrNull(optionalText(formData, "priceJpy"));
  const approxPriceSar = numberOrNull(optionalText(formData, "approxPriceSar")) ?? (priceJpy ? Math.ceil(priceJpy * JPY_TO_SAR) : null);
  const requestedAvailabilityStatus = statusValue(optionalText(formData, "availabilityStatus"));
  const images = parseImages(optionalText(formData, "imageUrls"));
  const availabilityStatus = requestedAvailabilityStatus === "AVAILABLE" && (!priceJpy || images.length === 0)
    ? "NEEDS_REVIEW"
    : requestedAvailabilityStatus;

  return {
    storeName: requiredText(formData, "storeName", "المتجر"),
    originalUrl,
    externalProductId: optionalText(formData, "externalProductId"),
    arabicName: requiredText(formData, "arabicName", "الاسم العربي"),
    originalName: optionalText(formData, "originalName"),
    description: optionalText(formData, "description"),
    priceJpy,
    approxPriceSar: approxPriceSar === null ? null : new Prisma.Decimal(approxPriceSar.toFixed(2)),
    imageUrlsJson: images.length > 0 ? JSON.stringify(images) : null,
    category: optionalText(formData, "category"),
    brand: optionalText(formData, "brand"),
    productCondition: optionalText(formData, "productCondition"),
    availabilityStatus,
    isFeatured: formData.get("isFeatured") === "on",
    displayOrder: Number(optionalText(formData, "displayOrder") || 0) || 0,
    lastCheckedAt: optionalText(formData, "lastCheckedAt") ? new Date(requiredText(formData, "lastCheckedAt", "تاريخ آخر تحقق")) : null,
    publishedAt: availabilityStatus === "AVAILABLE" ? new Date() : null,
  };
}

export async function createStoreProductFromForm(formData: FormData) {
  const data = productDataFromForm(formData);
  return prisma.storeProduct.create({ data });
}

export async function updateStoreProductFromForm(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("المنتج غير صحيح.");
  const data = productDataFromForm(formData);
  return prisma.storeProduct.update({ where: { id }, data });
}

export async function setStoreProductStatus(id: number, availabilityStatus: StoreProductStatus) {
  return prisma.storeProduct.update({
    where: { id },
    data: { availabilityStatus, publishedAt: availabilityStatus === "AVAILABLE" ? new Date() : null },
  });
}

export async function deleteStoreProduct(id: number) {
  return prisma.storeProduct.delete({ where: { id } });
}

export async function getAdminStoreProducts(input: { q?: string; status?: string }) {
  const q = (input.q || "").trim();
  const status = statusValue(input.status || "");
  return prisma.storeProduct.findMany({
    where: {
      ...(input.status ? { availabilityStatus: status } : {}),
      ...(q ? { OR: [{ arabicName: { contains: q } }, { originalName: { contains: q } }, { originalUrl: { contains: q } }, { brand: { contains: q } }, { category: { contains: q } }] } : {}),
    },
    orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
    take: 200,
  });
}

export async function getAdminStoreProduct(id: number) {
  return prisma.storeProduct.findUnique({ where: { id } });
}

export async function getPublishedMercariProducts() {
  return prisma.storeProduct.findMany({ where: { storeName: "Mercari Japan", availabilityStatus: "AVAILABLE" }, orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { updatedAt: "desc" }] });
}

export async function getPublishedMercariProduct(id: number) {
  return prisma.storeProduct.findFirst({ where: { id, storeName: "Mercari Japan", availabilityStatus: "AVAILABLE" } });
}

export async function createPurchaseOrderFromStoreProduct(customer: { id: number; customerId: string }, productId: number) {
  const product = await getPublishedMercariProduct(productId);
  if (!product) throw new Error("المنتج غير متاح للطلب حاليًا.");
  const images = imageUrlsFromJson(product.imageUrlsJson);
  const formData = new FormData();
  formData.set("productUrl", product.originalUrl);
  formData.set("productName", product.arabicName);
  formData.set("storeName", product.storeName);
  formData.set("quantity", "1");
  if (product.approxPriceSar) formData.set("estimatedProductPrice", product.approxPriceSar.toString());
  if (images[0]) formData.set("productImageUrl", images[0]);
  formData.set("notes", [
    "مصدر الطلب: كتالوج منتجات المتاجر",
    `المتجر: ${product.storeName}`,
    product.externalProductId ? `معرف المنتج الخارجي: ${product.externalProductId}` : "",
    `لقطة السعر وقت الطلب: ${formatJpy(product.priceJpy)} / ${formatApproxSar(product.approxPriceSar)}`,
    product.productCondition ? `حالة المنتج: ${product.productCondition}` : "",
    product.lastCheckedAt ? `آخر تحقق إداري: ${product.lastCheckedAt.toISOString()}` : "",
  ].filter(Boolean).join("\n"));

  return createPurchaseOrder(customer, formData);
}

function cleanText(value: string) {
  return decodeHtml(value).replace(/\s+/g, " ").trim();
}

function getMetaContent(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return matchFirst(html, new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i")) || matchFirst(html, new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i"));
}

function matchFirst(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return match?.[1] ? decodeHtml(match[1]) : "";
}

function absolutize(value: string, baseUrl: string) {
  if (!value) return "";
  try {
    const url = new URL(decodeHtml(value), baseUrl);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

function getPrice(html: string) {
  const priceText = getMetaContent(html, "product:price:amount") || getMetaContent(html, "og:price:amount") || matchFirst(html, /"price"\s*:\s*"?([0-9,.]+)"?/i);
  const price = Number(String(priceText).replace(/[^\d.]/g, ""));
  return Number.isFinite(price) && price > 0 && price < 10_000_000 ? Math.round(price) : null;
}

function decodeHtml(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}
