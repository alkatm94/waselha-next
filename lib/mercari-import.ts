import { Parsera } from "parsera-ts";

const REQUEST_TIMEOUT_MS = 12_000;
const MAX_HTML_BYTES = 2_500_000;
const MAX_PATH_LOGS = 120;

export type MercariAvailability = "AVAILABLE" | "SOLD" | "HIDDEN" | "NEEDS_REVIEW";

type ProductData = {
  name: string;
  description: string;
  priceJpy: number | null;
  images: string[];
  category: string;
  brand: string;
  condition: string;
  availabilityStatus: MercariAvailability;
};

type ProductPaths = Partial<Record<"name" | "description" | "priceJpy" | "images" | "category" | "brand" | "condition" | "availabilityStatus", string>>;
type ExtractedBundle = { product: ProductData; paths: ProductPaths };
type JsonSource = { path: string; value: unknown };
type PathHit = { path: string; key: string; valueType: string; sample: string };

export type MercariImportResult = ProductData & {
  originalUrl: string;
  externalProductId: string;
  approxPriceSar: number | null;
  notice: string;
  diagnosticPaths: ProductPaths;
};

type Diagnostics = {
  url: string;
  httpStatus: number | null;
  contentType: string;
  challengeDetected: boolean;
  embeddedJsonFound: boolean;
  extractors: string[];
  failures: string[];
  pathHits: PathHit[];
};

export async function fetchMercariProduct(inputUrl: string, jpyToSar: number): Promise<MercariImportResult> {
  const url = validateMercariUrl(inputUrl);
  const diagnostics: Diagnostics = {
    url: safeUrl(url), httpStatus: null, contentType: "", challengeDetected: false,
    embeddedJsonFound: false, extractors: [], failures: [], pathHits: [],
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: "no-store", redirect: "follow", signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
      },
    });
    diagnostics.httpStatus = response.status;
    diagnostics.contentType = response.headers.get("content-type") || "";
    const html = (await response.text()).slice(0, MAX_HTML_BYTES);
    diagnostics.challengeDetected = isChallenge(response.status, html);
    if (!response.ok || !diagnostics.contentType.includes("text/html")) {
      diagnostics.failures.push(`direct-fetch: HTTP ${response.status}; ${diagnostics.contentType || "unknown content type"}`);
    }

    const finalUrl = response.url || url;
    const metaBundle = extractMetadata(html, finalUrl);
    diagnostics.extractors.push(hasUsefulData(metaBundle.product) ? "metadata: product fields found" : "metadata: no product fields");

    const embedded = extractEmbeddedData(html, finalUrl, metaBundle.product.priceJpy, diagnostics.pathHits);
    diagnostics.embeddedJsonFound = embedded.foundJson;
    diagnostics.extractors.push(...embedded.notes);
    diagnostics.failures.push(...embedded.failures);

    let bundle = mergeBundles(metaBundle, embedded.bundle);
    if (missingFields(bundle.product).length > 0) {
      const api = await extractWithMercariApi(extractMercariId(finalUrl));
      diagnostics.extractors.push(api.note);
      if (api.failure) diagnostics.failures.push(api.failure);
      diagnostics.pathHits.push(...api.pathHits);
      bundle = mergeBundles(api.bundle, bundle);
    }
    if (missingFields(bundle.product).length > 0) {
      const scraper = await extractWithParsera(finalUrl);
      diagnostics.extractors.push(scraper.note);
      if (scraper.failure) diagnostics.failures.push(scraper.failure);
      bundle = mergeBundles(bundle, scraper.bundle);
    }

    bundle.product.images = sanitizeImages(bundle.product.images, finalUrl);
    if (!bundle.product.images.length) delete bundle.paths.images;
    const missing = missingFields(bundle.product);
    if (bundle.product.availabilityStatus === "NEEDS_REVIEW" || !bundle.product.priceJpy || !bundle.product.images.length) {
      bundle.product.availabilityStatus = "NEEDS_REVIEW";
      bundle.paths.availabilityStatus ||= "$derived.needsReview";
    }

    const notice = buildNotice(bundle.product, missing, diagnostics.challengeDetected);
    logDiagnostics(diagnostics, bundle, missing);
    return {
      ...bundle.product,
      originalUrl: finalUrl,
      externalProductId: extractMercariId(finalUrl),
      approxPriceSar: bundle.product.priceJpy ? Math.ceil(bundle.product.priceJpy * jpyToSar) : null,
      notice,
      diagnosticPaths: bundle.paths,
    };
  } catch (error) {
    diagnostics.failures.push(`request: ${safeError(error)}`);
    const bundle = emptyBundle();
    logDiagnostics(diagnostics, bundle, missingFields(bundle.product));
    return {
      ...bundle.product, originalUrl: url, externalProductId: extractMercariId(url), approxPriceSar: null,
      notice: `فشل جلب صفحة المنتج: ${safeError(error)}. حُفظت الحالة كمراجعة مطلوبة، ويمكن إدخال البيانات يدويًا.`,
      diagnosticPaths: bundle.paths,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function validateMercariUrl(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("رابط المنتج غير صالح."); }
  if (!/^https?:$/.test(url.protocol)) throw new Error("رابط المنتج يجب أن يبدأ بـ http أو https.");
  if (!/(^|\.)mercari\.com$/i.test(url.hostname)) throw new Error("الرابط ليس من نطاق Mercari الرسمي.");
  if (!extractMercariId(url.toString())) throw new Error("رابط Mercari لا يحتوي معرّف منتج صالحًا.");
  return url.toString();
}

function emptyProduct(): ProductData {
  return { name: "", description: "", priceJpy: null, images: [], category: "", brand: "", condition: "", availabilityStatus: "NEEDS_REVIEW" };
}
function emptyBundle(): ExtractedBundle { return { product: emptyProduct(), paths: {} }; }
function hasUsefulData(product: ProductData) { return Boolean(product.name || product.priceJpy || product.description || product.images.length); }

function mergeBundles(primary: ExtractedBundle, secondary: ExtractedBundle): ExtractedBundle {
  const product: ProductData = {
    name: primary.product.name || secondary.product.name,
    description: primary.product.description || secondary.product.description,
    priceJpy: primary.product.priceJpy ?? secondary.product.priceJpy,
    images: [...primary.product.images, ...secondary.product.images],
    category: primary.product.category || secondary.product.category,
    brand: primary.product.brand || secondary.product.brand,
    condition: primary.product.condition || secondary.product.condition,
    availabilityStatus: primary.product.availabilityStatus !== "NEEDS_REVIEW" ? primary.product.availabilityStatus : secondary.product.availabilityStatus,
  };
  const paths: ProductPaths = { ...secondary.paths, ...primary.paths };
  if (!primary.product.images.length && secondary.product.images.length) paths.images = secondary.paths.images;
  return { product, paths };
}

function extractMetadata(html: string, baseUrl: string): ExtractedBundle {
  const name = cleanTitle(meta(html, "og:title") || meta(html, "twitter:title") || capture(html, /<title[^>]*>([\s\S]*?)<\/title>/i));
  const priceJpy = priceValue(meta(html, "product:price:amount") || meta(html, "og:price:amount"));
  const images = [meta(html, "og:image"), meta(html, "twitter:image"), ...Array.from(html.matchAll(/<link[^>]+rel=["']preload["'][^>]+href=["']([^"']*\/item\/detail\/orig\/photos\/[^"']+)["']/gi), match => match[1])]
    .map(value => absolute(value, baseUrl)).filter(Boolean);
  return {
    product: { ...emptyProduct(), name, priceJpy, images },
    paths: {
      ...(name ? { name: "$html.meta[og:title]" } : {}),
      ...(priceJpy ? { priceJpy: "$html.meta[product:price:amount]" } : {}),
      ...(images.length ? { images: "$html.meta[og:image]|link[rel=preload]" } : {}),
    },
  };
}

function extractEmbeddedData(html: string, baseUrl: string, expectedPrice: number | null, pathHits: PathHit[]) {
  const sources: JsonSource[] = [];
  const failures: string[] = [];
  const notes: string[] = [];
  let foundJson = false;
  let flightCount = 0;
  let decodedValueCount = 0;

  const scripts = Array.from(html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi));
  scripts.forEach((script, scriptIndex) => {
    const attrs = script[1] || "";
    const body = script[2]?.trim() || "";
    if (!body) return;
    if (/type=["']application\/(?:ld\+)?json["']/i.test(attrs) || /id=["']__NEXT_DATA__["']/i.test(attrs)) {
      foundJson = true;
      try {
        sources.push({ path: `$script[${scriptIndex}]`, value: JSON.parse(decodeHtml(body)) });
        decodedValueCount += 1;
      } catch (error) { failures.push(`embedded-json[${scriptIndex}]: ${safeError(error)}`); }
    }
    if (!body.includes("self.__next_f.push")) return;
    const calls = extractNextFlightCalls(body);
    flightCount += calls.length;
    if (calls.length) foundJson = true;
    calls.forEach((call, callIndex) => {
      try {
        const tuple = JSON.parse(call) as unknown[];
        const payload = tuple[1];
        const payloadPath = `$nextFlight[${flightCount - calls.length + callIndex}].payload`;
        sources.push({ path: payloadPath, value: payload });
        decodedValueCount += 1;
        if (typeof payload === "string") {
          const fragments = extractJsonFragments(payload);
          fragments.forEach((value, fragmentIndex) => sources.push({ path: `${payloadPath}.json[${fragmentIndex}]`, value }));
          decodedValueCount += fragments.length;
        }
      } catch (error) { failures.push(`next-flight[${scriptIndex}:${callIndex}]: ${safeError(error)}`); }
    });
  });

  const walked = walkSources(sources, expectedPrice, pathHits);
  const bundle = extractFlexibleProduct(walked, baseUrl, expectedPrice);
  notes.push(flightCount ? `next-flight: ${flightCount} payload(s) decoded` : "next-flight: not found");
  notes.push(foundJson ? `embedded-json: ${decodedValueCount} value(s) decoded` : "embedded-json: not found");
  return { bundle, foundJson, notes, failures };
}

function extractNextFlightCalls(script: string) {
  const results: string[] = [];
  const marker = "self.__next_f.push(";
  let cursor = 0;
  while ((cursor = script.indexOf(marker, cursor)) >= 0) {
    const start = cursor + marker.length;
    let quote = "";
    let escaped = false;
    let squareDepth = 0;
    let end = -1;
    for (let index = start; index < script.length; index += 1) {
      const char = script[index];
      if (quote) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === quote) quote = "";
        continue;
      }
      if (char === '"' || char === "'") { quote = char; continue; }
      if (char === "[") squareDepth += 1;
      else if (char === "]") squareDepth -= 1;
      else if (char === ")" && squareDepth === 0) { end = index; break; }
    }
    if (end > start) results.push(script.slice(start, end));
    cursor = end > start ? end + 1 : start;
  }
  return results;
}

function extractJsonFragments(input: string) {
  const values: unknown[] = [];
  for (let start = 0; start < input.length && values.length < 2_000; start += 1) {
    if (input[start] !== "{" && input[start] !== "[") continue;
    const opener = input[start];
    const closer = opener === "{" ? "}" : "]";
    let depth = 0;
    let quote = "";
    let escaped = false;
    for (let index = start; index < input.length; index += 1) {
      const char = input[index];
      if (quote) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === quote) quote = "";
        continue;
      }
      if (char === '"') { quote = char; continue; }
      if (char === opener) depth += 1;
      else if (char === closer) depth -= 1;
      if (depth === 0) {
        const candidate = input.slice(start, index + 1);
        try { values.push(JSON.parse(candidate)); start = index; } catch { /* RSC fragments may not be standalone JSON. */ }
        break;
      }
    }
  }
  return values;
}

type WalkedValue = { path: string; key: string; value: unknown; parent: Record<string, unknown> | null };
function walkSources(sources: JsonSource[], expectedPrice: number | null, pathHits: PathHit[]) {
  const walked: WalkedValue[] = [];
  const seen = new WeakSet<object>();
  const visit = (value: unknown, path: string, key: string, parent: Record<string, unknown> | null, depth: number) => {
    walked.push({ path, key, value, parent });
    if (shouldLogPath(key, value, expectedPrice) && pathHits.length < MAX_PATH_LOGS) {
      pathHits.push({ path, key: key || "(root)", valueType: valueType(value), sample: safeSample(value) });
    }
    if (depth > 16 || value === null || typeof value !== "object") return;
    if (seen.has(value as object)) return;
    seen.add(value as object);
    if (Array.isArray(value)) {
      value.slice(0, 1_000).forEach((item, index) => visit(item, `${path}[${index}]`, String(index), null, depth + 1));
      return;
    }
    const object = value as Record<string, unknown>;
    Object.entries(object).slice(0, 1_000).forEach(([childKey, child]) => visit(child, `${path}.${escapePathKey(childKey)}`, childKey, object, depth + 1));
  };
  sources.forEach(source => visit(source.value, source.path, "", null, 0));
  return walked;
}

function extractFlexibleProduct(values: WalkedValue[], baseUrl: string, expectedPrice: number | null): ExtractedBundle {
  const bundle = emptyBundle();
  let priceScore = -1;
  let imageScore = -1;
  let nameScore = -1;
  let descriptionScore = -1;
  let conditionScore = -1;
  let statusScore = -1;
  for (const entry of values) {
    if (isNonProductPath(entry.path, entry.value)) continue;
    const normalizedKey = entry.key.toLowerCase();
    const context = contextScore(entry.parent, expectedPrice);
    if (/^(?:price|itemprice|pricejpy|amount|lowprice)$/.test(normalizedKey)) {
      const candidate = priceValue(entry.value);
      const score = context + (normalizedKey.includes("item") ? 3 : 0) + (candidate === expectedPrice ? 6 : 0);
      if (candidate && score >= 5 && score > priceScore) { bundle.product.priceJpy = candidate; bundle.paths.priceJpy = entry.path; priceScore = score; }
    }
    if (/^(?:photos?|images?|imageurls?|thumbnails?|photo_paths)$/.test(normalizedKey)) {
      const images = sanitizeImages(imageValues(entry.value, baseUrl), baseUrl);
      const score = context + (normalizedKey.startsWith("photo") ? 3 : 0) + images.length;
      if (images.length && score > imageScore) { bundle.product.images = images; bundle.paths.images = entry.path; imageScore = score; }
    }
    if (/^(?:name|itemname|productname|title)$/.test(normalizedKey)) {
      const candidate = cleanTitle(text(entry.value));
      const score = context + (/item|product/.test(normalizedKey) ? 2 : 0);
      if (candidate.length > 2 && candidate.length < 300 && score > nameScore) { bundle.product.name = candidate; bundle.paths.name = entry.path; nameScore = score; }
    }
    if (/^(?:description|itemdescription)$/.test(normalizedKey)) {
      const candidate = clean(text(entry.value));
      const score = context + (normalizedKey.startsWith("item") ? 2 : 0);
      if (candidate.length > 8 && score > descriptionScore) { bundle.product.description = candidate; bundle.paths.description = entry.path; descriptionScore = score; }
    }
    if (/^(?:condition|itemcondition|conditionname|item_condition)$/.test(normalizedKey)) {
      const candidate = clean(text(entry.value));
      const score = context + 2;
      if (candidate && score > conditionScore) { bundle.product.condition = candidate; bundle.paths.condition = entry.path; conditionScore = score; }
    }
    if (/^(?:availability|status|itemstatus|salestatus|soldout)$/.test(normalizedKey)) {
      const candidate = availability(entry.value);
      const score = context + (/item|sale|sold/.test(normalizedKey) ? 2 : 0);
      if (candidate !== "NEEDS_REVIEW" && score > statusScore) { bundle.product.availabilityStatus = candidate; bundle.paths.availabilityStatus = entry.path; statusScore = score; }
    }
    if (/^(?:brand|brandname|itembrand|item_brand)$/.test(normalizedKey) && !bundle.product.brand) { bundle.product.brand = clean(text(entry.value)); bundle.paths.brand = entry.path; }
    if (/^(?:category|categoryname|itemcategory|item_category)$/.test(normalizedKey) && !bundle.product.category) { bundle.product.category = clean(text(entry.value)); bundle.paths.category = entry.path; }
  }
  return bundle;
}

function isNonProductPath(path: string, value: unknown) {
  if (/\.resources\.[^.]+\.|\.translations?\.|\.i18n\.|\.locales?\./i.test(path)) return true;
  if (typeof value === "string" && /\{\{[^}]+\}\}|商品の説明$|商品の状態$|カテゴリー$|ブランド$|商品価格$/.test(value.trim())) return true;
  return false;
}
function contextScore(parent: Record<string, unknown> | null, expectedPrice: number | null) {
  if (!parent) return 0;
  const keys = Object.keys(parent).map(key => key.toLowerCase());
  let score = 0;
  if (keys.some(key => /^(?:id|item|itemid|item_id|name|itemname|productname)$/.test(key))) score += 2;
  if (keys.some(key => /description|photos?|images?|condition|category|brand|status/.test(key))) score += 3;
  const currency = text(pick(parent, ["currency", "currencyCode", "priceCurrency"])).toUpperCase();
  if (currency === "JPY" || currency === "¥") score += 5;
  if (expectedPrice && Object.values(parent).some(value => priceValue(value) === expectedPrice)) score += 3;
  return score;
}

async function extractWithMercariApi(itemId: string) {
  if (!itemId) return { bundle: emptyBundle(), note: "mercari-api: skipped", failure: "mercari-api: missing item id", pathHits: [] as PathHit[] };
  const endpoint = new URL("https://api.mercari.jp/items/get");
  const requestPayload = {
    id: itemId, include_item_attributes: true, include_product_page_component: true,
    include_non_ui_item_attributes: true, include_item_attributes_sections: true, include_auction: true,
  };
  Object.entries(requestPayload).forEach(([key, value]) => endpoint.searchParams.set(key, String(value)));
  console.info("[mercari-api-request]", { endpoint: `${endpoint.origin}${endpoint.pathname}`, method: "GET", payload: requestPayload });

  try {
    const dpop = await createDpopProof(endpoint.toString(), "GET");
    const response = await fetch(endpoint, {
      cache: "no-store",
      headers: { accept: "application/json", "x-platform": "web", dpop, "user-agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const contentType = response.headers.get("content-type") || "";
    const responseText = await response.text();
    console.info("[mercari-api-response]", { status: response.status, contentType, bodySample: safeBodySample(responseText) });
    if (!response.ok || !contentType.includes("application/json")) {
      return { bundle: emptyBundle(), note: `mercari-api: HTTP ${response.status}`, failure: `mercari-api: HTTP ${response.status}; ${safeBodySample(responseText)}`, pathHits: [] as PathHit[] };
    }
    const payload = JSON.parse(responseText) as { data?: Record<string, unknown> };
    if (!payload.data) return { bundle: emptyBundle(), note: "mercari-api: empty response", failure: "mercari-api: response contained no product data", pathHits: [] as PathHit[] };
    const data = payload.data;
    const categoryParts = [...((data.parent_categories_ntiers as unknown[]) || []).map(text), text(pick(data, ["item_category"]))].filter(Boolean);
    const product: ProductData = {
      name: cleanTitle(text(pick(data, ["name"]))), description: clean(text(pick(data, ["description"]))),
      priceJpy: priceValue(pick(data, ["price"])), images: imageValues(pick(data, ["photos", "photo_paths"]), endpoint.toString()),
      category: Array.from(new Set(categoryParts)).join(" > "), brand: clean(text(pick(data, ["item_brand", "brand"]))),
      condition: clean(text(pick(data, ["item_condition"]))), availabilityStatus: availability(pick(data, ["status"])),
    };
    const paths: ProductPaths = {
      name: "$.data.name", priceJpy: "$.data.price", description: "$.data.description", images: "$.data.photos",
      condition: "$.data.item_condition", category: "$.data.parent_categories_ntiers|item_category", availabilityStatus: "$.data.status",
      ...(product.brand ? { brand: "$.data.item_brand" } : {}),
    };
    const pathHits: PathHit[] = [
      { path: "$.data.price", key: "price", valueType: valueType(data.price), sample: safeSample(data.price) },
      { path: "$.data.photos", key: "photos", valueType: valueType(data.photos), sample: safeSample(data.photos) },
      { path: "$.data.description", key: "description", valueType: valueType(data.description), sample: safeSample(data.description) },
      { path: "$.data.item_condition", key: "item_condition", valueType: valueType(data.item_condition), sample: safeSample(data.item_condition) },
      { path: "$.data.status", key: "status", valueType: valueType(data.status), sample: safeSample(data.status) },
    ];
    return { bundle: { product, paths }, note: `mercari-api: HTTP ${response.status}, product JSON found`, failure: "", pathHits };
  } catch (error) {
    return { bundle: emptyBundle(), note: "mercari-api: failed", failure: `mercari-api: ${safeError(error)}`, pathHits: [] as PathHit[] };
  }
}

async function createDpopProof(url: string, method: string) {
  const keys = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const publicJwk = await crypto.subtle.exportKey("jwk", keys.publicKey);
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = encode({ typ: "dpop+jwt", alg: "ES256", jwk: { kty: publicJwk.kty, crv: publicJwk.crv, x: publicJwk.x, y: publicJwk.y } });
  const payload = encode({ htu: url, htm: method.toUpperCase(), iat: Math.floor(Date.now() / 1000), jti: crypto.randomUUID() });
  const signature = Buffer.from(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, keys.privateKey, Buffer.from(`${header}.${payload}`))).toString("base64url");
  return `${header}.${payload}.${signature}`;
}

async function extractWithParsera(url: string) {
  const apiKey = process.env.PARSERA_API_KEY?.trim() || process.env.PARSE_API_KEY?.trim();
  if (!apiKey) return { bundle: emptyBundle(), note: "parsera: not configured", failure: "parsera: API key not configured" };
  try {
    const parsera = new Parsera({ apiKey, defaultProxyCountry: "Japan", timeout: 45_000, retryOptions: { maxRetries: 1, initialDelay: 700, backoffFactor: 2 } });
    const records = await parsera.extract({
      url, proxyCountry: "Japan",
      attributes: {
        originalName: "Exact original Japanese product name without the Mercari site name.", priceJpy: "Product price in Japanese yen, digits only.",
        description: "Complete seller product description.", imageUrls: "All full-size product image URLs only, excluding logos, icons, avatars and placeholders. Return a JSON array.",
        condition: "Displayed item condition.", brand: "Displayed product brand if present.", category: "Displayed product category path if present.", availability: "Whether the listing is available/on sale or sold out.",
      },
    });
    const row = records[0] || {};
    const product: ProductData = {
      name: cleanTitle(row.originalName || ""), description: clean(row.description || ""), priceJpy: priceValue(row.priceJpy),
      images: imageValues(row.imageUrls, url), condition: clean(row.condition || ""), brand: clean(row.brand || ""), category: clean(row.category || ""),
      availabilityStatus: availability(row.availability),
    };
    return { bundle: { product, paths: {} }, note: `parsera: ${records.length} record(s) returned`, failure: "" };
  } catch (error) {
    return { bundle: emptyBundle(), note: "parsera: failed", failure: `parsera: ${safeError(error)}` };
  }
}

function pick(object: Record<string, unknown>, keys: string[]) {
  const key = Object.keys(object).find(actual => keys.some(candidate => candidate.toLowerCase() === actual.toLowerCase()));
  return key ? object[key] : undefined;
}
function text(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(" > ");
  if (value && typeof value === "object") return text(pick(value as Record<string, unknown>, ["name", "title", "label", "value", "url"]));
  return "";
}
function priceValue(value: unknown): number | null {
  if (value && typeof value === "object") return priceValue(pick(value as Record<string, unknown>, ["price", "amount", "value", "lowPrice"]));
  const result = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(result) && result > 0 && result < 10_000_000 ? Math.round(result) : null;
}
function imageValues(value: unknown, baseUrl: string): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(item => imageValues(item, baseUrl));
  if (typeof value === "object") return imageValues(pick(value as Record<string, unknown>, ["url", "src", "imageUrl", "image_url", "original"]), baseUrl);
  const raw = String(value).trim();
  let values: unknown[];
  try { const parsed = JSON.parse(raw); values = Array.isArray(parsed) ? parsed : [parsed]; }
  catch { values = raw.split(/\r?\n|,\s*(?=https?:\/\/)/); }
  return values.map(item => absolute(String(item).trim(), baseUrl)).filter(Boolean);
}
function availability(value: unknown): MercariAvailability {
  if (typeof value === "boolean") return value ? "SOLD" : "AVAILABLE";
  const valueText = text(value).toLowerCase();
  if (/sold|sold.?out|out.?of.?stock|売り切れ|販売終了|مباع/.test(valueText)) return "SOLD";
  if (/available|in.?stock|on.?sale|販売中|購入手続き|متوفر/.test(valueText)) return "AVAILABLE";
  if (/hidden|private|非公開|公開停止/.test(valueText)) return "HIDDEN";
  return "NEEDS_REVIEW";
}
function sanitizeImages(images: string[], baseUrl: string) {
  const blocked = /(?:logo|favicon|avatar|placeholder|no[-_]?image|default[-_]?image|mercari[_-]?logo|\/assets\/|\/members\/|\/icons?\/)/i;
  return Array.from(new Set(images.map(image => absolute(image, baseUrl)).filter(image => {
    if (!image || blocked.test(image)) return false;
    try {
      const url = new URL(image);
      if (!/(?:mercdn\.net|mercari\.com)$/i.test(url.hostname) && !/\.(?:avif|webp|png|jpe?g)(?:$|\?)/i.test(url.pathname + url.search)) return false;
      return /mercdn\.net$/i.test(url.hostname) ? /\/item\/detail\/(?:orig|photos)\//i.test(url.pathname) : true;
    } catch { return false; }
  })));
}
function missingFields(product: ProductData) {
  const result: string[] = [];
  if (!product.name) result.push("الاسم");
  if (!product.priceJpy) result.push("السعر");
  if (!product.description) result.push("الوصف");
  if (!product.images.length) result.push("الصور");
  if (!product.condition) result.push("الحالة");
  if (product.availabilityStatus === "NEEDS_REVIEW") result.push("التوفر");
  return result;
}
function buildNotice(product: ProductData, missing: string[], challenge: boolean) {
  const notice = hasUsefulData(product) ? ["تم جلب البيانات للمعاينة فقط. راجعها وعدّلها قبل الحفظ."] : ["تعذر استخراج بيانات المنتج من جميع المسارات المتاحة."];
  if (missing.length) notice.push(`الحقول التي لم يُعثر عليها: ${missing.join("، ")}. سيُحفظ المنتج كمسودة تحتاج مراجعة ولن يُنشر.`);
  if (!product.images.length) notice.push("لم يتم العثور على صور منتج صالحة؛ تُركت الصور فارغة ولم يُستخدم شعار أو صورة افتراضية.");
  if (challenge) notice.push("أعادت Mercari صفحة تحقق أو حظر بدل صفحة المنتج.");
  return notice.join(" ");
}
function shouldLogPath(key: string, value: unknown, expectedPrice: number | null) {
  if (/^(?:price|itemprice|photos?|images?|description|condition|status|soldout|item)$/i.test(key)) return true;
  if (typeof value === "string" && /https?:\/\/[^\s"']*(?:mercdn\.net|mercari\.com)/i.test(value)) return true;
  const number = typeof value === "number" ? value : /^\d+(?:\.\d+)?$/.test(String(value)) ? Number(value) : null;
  return Boolean(number && expectedPrice && Math.abs(number - expectedPrice) <= Math.max(5, expectedPrice * 0.05));
}
function valueType(value: unknown) { return Array.isArray(value) ? "array" : value === null ? "null" : typeof value; }
function safeSample(value: unknown): string {
  if (Array.isArray(value)) return `[${value.slice(0, 2).map(item => safeSample(item)).join(", ")}${value.length > 2 ? `, … (${value.length})` : ""}]`.slice(0, 180);
  if (value && typeof value === "object") return `{keys: ${Object.keys(value as object).slice(0, 8).join(", ")}}`.slice(0, 180);
  return clean(String(value ?? "")).replace(/[A-Za-z0-9_-]{32,}/g, "[redacted]").slice(0, 180);
}
function safeBodySample(body: string) {
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    return JSON.stringify({ result: parsed.result, message: parsed.message, errors: parsed.errors, details: parsed.details, dataKeys: parsed.data && typeof parsed.data === "object" ? Object.keys(parsed.data as object).slice(0, 20) : undefined }).slice(0, 700);
  } catch { return safeError(body); }
}
function escapePathKey(key: string) { return /^[A-Za-z_$][\w$]*$/.test(key) ? key : `[${JSON.stringify(key)}]`; }
function meta(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return capture(html, new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"))
    || capture(html, new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i"));
}
function capture(value: string, pattern: RegExp) { return decodeHtml(value.match(pattern)?.[1] || ""); }
function clean(value: string) { return decodeHtml(value).replace(/\s+/g, " ").trim(); }
function cleanTitle(value: string) { return clean(value).replace(/\s+by\s+(?:Mercari|メルカリ)$/i, "").replace(/\s+(?:-|｜)\s*Mercari(?:\s+Japan)?$/i, "").replace(/\s+-\s+メルカリ$/i, "").trim(); }
function absolute(value: string, baseUrl: string) { try { const url = new URL(decodeHtml(value), baseUrl); return /^https?:$/.test(url.protocol) ? url.toString() : ""; } catch { return ""; } }
function decodeHtml(value: string) { return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#(?:39|x27);/gi, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim(); }
function extractMercariId(value: string) { try { const path = new URL(value).pathname; return path.match(/(?:item|items)\/([A-Za-z0-9_-]+)/)?.[1] || path.match(/\/m([0-9]+)/)?.[1] || ""; } catch { return ""; } }
function isChallenge(status: number, html: string) { if ([403, 429, 503].includes(status)) return true; const sample = clean(html.slice(0, 30_000)); return /just a moment|verify you are human|attention required|access denied|cf-chl|captcha challenge|アクセスが集中しています|ロボットではない/i.test(sample); }
function safeUrl(value: string) { try { const url = new URL(value); return `${url.origin}${url.pathname}`; } catch { return "invalid-url"; } }
function safeError(error: unknown) { return (error instanceof Error ? error.message : String(error)).replace(/[A-Za-z0-9_-]{24,}/g, "[redacted]").slice(0, 240); }
function logDiagnostics(diagnostics: Diagnostics, bundle: ExtractedBundle, missing: string[]) {
  console.info("[store-product-json-paths]", diagnostics.pathHits.slice(0, MAX_PATH_LOGS));
  console.info("[store-product-preview]", {
    at: new Date().toISOString(), url: diagnostics.url, httpStatus: diagnostics.httpStatus, contentType: diagnostics.contentType,
    challengeDetected: diagnostics.challengeDetected, embeddedJsonFound: diagnostics.embeddedJsonFound, extractors: diagnostics.extractors,
    failures: diagnostics.failures, selectedPaths: bundle.paths,
    extracted: { name: Boolean(bundle.product.name), priceJpy: Boolean(bundle.product.priceJpy), description: Boolean(bundle.product.description), imageCount: bundle.product.images.length, condition: Boolean(bundle.product.condition), brand: Boolean(bundle.product.brand), category: Boolean(bundle.product.category), availabilityStatus: bundle.product.availabilityStatus },
    missing,
  });
}
