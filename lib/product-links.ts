export type StoreId = "taobao" | "1688" | "aliexpress" | "alibaba" | "goofish";
export type SupportedCurrency = "USD" | "CNY";

export type ProductStore = {
  id: StoreId;
  name: string;
  icon: string;
  defaultCurrency: SupportedCurrency;
  defaultCountry: "china";
  domains: string[];
  shortDomains: string[];
};

export type StoreDetection =
  | {
      ok: true;
      originalUrl: string;
      normalizedUrl: string;
      store: ProductStore;
      isShortened: boolean;
    }
  | {
      ok: false;
      originalUrl?: string;
      normalizedUrl?: string;
      reason: "empty" | "invalid" | "unsupported";
    };

export const SUPPORTED_STORES: ProductStore[] = [
  {
    id: "taobao",
    name: "Taobao",
    icon: "TB",
    defaultCurrency: "CNY",
    defaultCountry: "china",
    domains: ["taobao.com", "tmall.com", "world.taobao.com", "item.taobao.com"],
    shortDomains: ["tb.cn", "m.tb.cn"],
  },
  {
    id: "1688",
    name: "1688",
    icon: "16",
    defaultCurrency: "CNY",
    defaultCountry: "china",
    domains: ["1688.com", "detail.1688.com"],
    shortDomains: [],
  },
  {
    id: "aliexpress",
    name: "AliExpress",
    icon: "AE",
    defaultCurrency: "USD",
    defaultCountry: "china",
    domains: ["aliexpress.com", "aliexpress.us"],
    shortDomains: ["a.aliexpress.com", "s.click.aliexpress.com"],
  },
  {
    id: "alibaba",
    name: "Alibaba",
    icon: "AL",
    defaultCurrency: "USD",
    defaultCountry: "china",
    domains: ["alibaba.com"],
    shortDomains: [],
  },
  {
    id: "goofish",
    name: "Goofish",
    icon: "GF",
    defaultCurrency: "CNY",
    defaultCountry: "china",
    domains: ["goofish.com", "xianyu.taobao.com", "2.taobao.com"],
    shortDomains: ["m.tb.cn"],
  },
];

export function normalizeProductUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function detectProductStore(value: string): StoreDetection {
  const originalUrl = value.trim();
  const normalizedUrl = normalizeProductUrl(value);
  if (!normalizedUrl) return { ok: false, reason: "empty" };

  let parsed: URL;
  try {
    parsed = new URL(normalizedUrl);
  } catch {
    return { ok: false, originalUrl, normalizedUrl, reason: "invalid" };
  }

  if (!isSafeHttpUrl(parsed)) {
    return { ok: false, originalUrl, normalizedUrl, reason: "invalid" };
  }

  const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();

  for (const store of SUPPORTED_STORES) {
    const domains = [...store.domains, ...store.shortDomains];
    const matched = domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
    if (matched) {
      return {
        ok: true,
        originalUrl,
        normalizedUrl,
        store,
        isShortened: store.shortDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`)),
      };
    }
  }

  return { ok: false, originalUrl, normalizedUrl, reason: "unsupported" };
}

export function resolveCurrency(store: ProductStore, extractedCurrency?: string): SupportedCurrency {
  if (extractedCurrency === "USD" || extractedCurrency === "CNY") return extractedCurrency;
  return store.defaultCurrency;
}

export function getStoreById(id: StoreId) {
  return SUPPORTED_STORES.find((store) => store.id === id);
}

function isSafeHttpUrl(url: URL) {
  if (!["http:", "https:"].includes(url.protocol)) return false;
  if (url.username || url.password) return false;
  return true;
}
