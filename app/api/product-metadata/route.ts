import { NextResponse } from "next/server";
import { detectProductStore, resolveCurrency, type StoreId, type SupportedCurrency } from "@/lib/product-links";

type ProductMetadata = {
  originalUrl: string;
  normalizedUrl: string;
  finalUrl?: string;
  storeId: StoreId;
  storeName: string;
  title: string;
  image?: string;
  price?: number;
  currency: SupportedCurrency;
};

const REQUEST_TIMEOUT_MS = 7000;
const MAX_HTML_BYTES = 900_000;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { originalUrl?: string; normalizedUrl?: string };
    const detection = detectProductStore(body.originalUrl || body.normalizedUrl || "");

    if (!detection.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: detection.reason === "unsupported" ? "unsupported" : "needs_review",
          message: detection.reason === "unsupported" ? "الرابط غير مدعوم" : "تأكد من صحة الرابط",
        },
        { status: 400 }
      );
    }

    const fallback: ProductMetadata = {
      originalUrl: detection.originalUrl,
      normalizedUrl: detection.normalizedUrl,
      storeId: detection.store.id,
      storeName: detection.store.name,
      title: `منتج من ${detection.store.name}`,
      currency: detection.store.defaultCurrency,
    };

    const metadata = await fetchProductMetadata(detection.normalizedUrl, fallback);
    const hasUsefulMetadata = Boolean(metadata.image || metadata.price || metadata.title !== fallback.title);

    return NextResponse.json({
      ok: true,
      status: "recognized",
      message: hasUsefulMetadata ? "تم التعرف على الرابط" : "تعذر جلب بيانات المنتج تلقائيًا، أدخل السعر يدويًا",
      product: metadata,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        status: "needs_review",
        message: "تعذر جلب بيانات المنتج تلقائيًا، أدخل السعر يدويًا",
      },
      { status: 200 }
    );
  }
}

async function fetchProductMetadata(fetchUrl: string, fallback: ProductMetadata): Promise<ProductMetadata> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(fetchUrl, {
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9,ar;q=0.8",
        "user-agent": "Mozilla/5.0 (compatible; WaselhaLinkImporter/1.0)",
      },
    });

    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.includes("text/html")) {
      return fallback;
    }

    const html = (await response.text()).slice(0, MAX_HTML_BYTES);
    const finalUrl = response.url || fetchUrl;
    const finalDetection = detectProductStore(finalUrl);
    const store = finalDetection.ok
      ? finalDetection.store
      : { id: fallback.storeId, name: fallback.storeName, defaultCurrency: fallback.currency };
    const extractedTitle = sanitizeTitle(getTitle(html));
    const extractedCurrency = detectCurrency(html);

    return {
      ...fallback,
      finalUrl,
      storeId: store.id,
      storeName: store.name,
      title: extractedTitle || `منتج من ${store.name}`,
      image: getImage(html, finalUrl),
      price: getPrice(html),
      currency: resolveCurrency(
        {
          id: store.id,
          name: store.name,
          icon: "",
          defaultCurrency: store.defaultCurrency,
          defaultCountry: "china",
          domains: [],
          shortDomains: [],
        },
        extractedCurrency
      ),
    };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}

function getTitle(html: string) {
  const title =
    getMetaContent(html, "og:title") ||
    getMetaContent(html, "twitter:title") ||
    firstString(getJsonLdValue(html, "name")) ||
    decodeHtml(matchFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i) || "");

  return title.replace(/\s+/g, " ").trim();
}

function firstString(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value.find((item) => typeof item === "string" && item.trim().length > 0);
  return value;
}

function sanitizeTitle(value?: string) {
  if (!value) return undefined;
  const cleaned = value.replace(/[\u0000-\u001F\u007F-\u009F]+/g, " ").replace(/�+/g, "").replace(/\s+/g, " ").trim();
  if (/[\u00C0-\u00FF]/.test(cleaned) && !/[\u0600-\u06FF\u4E00-\u9FFF]/.test(cleaned)) return undefined;
  if (!cleaned || cleaned.length < 2) return undefined;
  return cleaned;
}

function getImage(html: string, baseUrl: string) {
  const image = getMetaContent(html, "og:image") || getMetaContent(html, "twitter:image") || getJsonLdValue(html, "image");
  if (!image || image.includes("undefined") || image.includes("null")) return undefined;
  try {
    const imageUrl = new URL(Array.isArray(image) ? image[0] : image, baseUrl);
    if (!["http:", "https:"].includes(imageUrl.protocol)) return undefined;
    return imageUrl.toString();
  } catch {
    return undefined;
  }
}

function getPrice(html: string) {
  const priceText =
    getMetaContent(html, "product:price:amount") ||
    getMetaContent(html, "og:price:amount") ||
    getJsonLdNestedValue(html, "offers", "price");

  if (!priceText) return undefined;
  const price = Number(String(priceText).replace(/[^\d.,]/g, "").replace(",", "."));
  return Number.isFinite(price) && price > 0 && price <= 1_000_000 ? price : undefined;
}

function detectCurrency(html: string) {
  const currency =
    getMetaContent(html, "product:price:currency") ||
    getJsonLdNestedValue(html, "offers", "priceCurrency") ||
    matchFirst(html, /"priceCurrency"\s*:\s*"([A-Z]{3})"/i) ||
    matchFirst(html, /"currency"\s*:\s*"([A-Z]{3})"/i);

  return currency === "USD" || currency === "CNY" ? currency : undefined;
}

function getMetaContent(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    matchFirst(html, new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i")) ||
    matchFirst(html, new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i"))
  );
}

function getJsonLdValue(html: string, key: string): string | string[] | undefined {
  for (const block of getJsonLdBlocks(html)) {
    const value = readJsonValue(block, key);
    if (typeof value === "string" || Array.isArray(value)) return value;
  }
  return undefined;
}

function getJsonLdNestedValue(html: string, parentKey: string, key: string) {
  for (const block of getJsonLdBlocks(html)) {
    const parent = readJsonValue(block, parentKey);
    const firstParent = Array.isArray(parent) ? parent[0] : parent;
    if (firstParent && typeof firstParent === "object") {
      const value = (firstParent as Record<string, unknown>)[key];
      if (typeof value === "string" || typeof value === "number") return String(value);
    }
  }
  return undefined;
}

function getJsonLdBlocks(html: string) {
  const blocks: Record<string, unknown>[] = [];
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) {
    try {
      const parsed = JSON.parse(decodeHtml(match[1]));
      if (Array.isArray(parsed)) {
        blocks.push(...parsed.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object"));
      } else if (parsed && typeof parsed === "object") {
        blocks.push(parsed as Record<string, unknown>);
      }
    } catch {
      // Ignore malformed JSON-LD and keep the fallback path graceful.
    }
  }
  return blocks;
}

function readJsonValue(block: Record<string, unknown>, key: string): unknown {
  if (key in block) return block[key];
  const graph = block["@graph"];
  if (Array.isArray(graph)) {
    for (const item of graph) {
      if (item && typeof item === "object" && key in item) return (item as Record<string, unknown>)[key];
    }
  }
  return undefined;
}

function matchFirst(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return match?.[1] ? decodeHtml(match[1]) : undefined;
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}




