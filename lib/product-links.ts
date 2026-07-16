export type StoreId = "taobao" | "1688" | "aliexpress" | "alibaba" | "goofish" | "amazon" | "ebay";
export type SupportedCurrency = "USD" | "CNY" | "JPY" | "EUR";
export type StoreCountry = "china" | "japan" | "usa" | "europe";

export type ProductStore = {
  id: StoreId;
  name: string;
  icon: string;
  defaultCurrency: SupportedCurrency;
  defaultCountry: StoreCountry;
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
  {
    id: "amazon",
    name: "Amazon",
    icon: "AM",
    defaultCurrency: "USD",
    defaultCountry: "usa",
    domains: ["amazon.com", "amazon.sa", "amazon.ae", "amazon.co.uk", "amazon.de", "amazon.fr", "amazon.it", "amazon.es", "amazon.co.jp"],
    shortDomains: ["amzn.to"],
  },
  {
    id: "ebay",
    name: "eBay",
    icon: "EB",
    defaultCurrency: "USD",
    defaultCountry: "usa",
    domains: ["ebay.com", "ebay.co.uk", "ebay.de", "ebay.fr"],
    shortDomains: [],
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
      const localizedStore = localizeStoreByHostname(store, hostname);
      return {
        ok: true,
        originalUrl,
        normalizedUrl,
        store: localizedStore,
        isShortened: store.shortDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`)),
      };
    }
  }

  return { ok: false, originalUrl, normalizedUrl, reason: "unsupported" };
}

export function resolveCurrency(store: ProductStore, extractedCurrency?: string): SupportedCurrency {
  if (["USD", "CNY", "JPY", "EUR"].includes(String(extractedCurrency))) return extractedCurrency as SupportedCurrency;
  return store.defaultCurrency;
}

export function getStoreById(id: StoreId) {
  return SUPPORTED_STORES.find((store) => store.id === id);
}


function localizeStoreByHostname(store: ProductStore, hostname: string): ProductStore {
  if (store.id === "amazon" && hostname.endsWith("amazon.co.jp")) {
    return { ...store, defaultCountry: "japan", defaultCurrency: "JPY" };
  }

  if (store.id === "amazon" && ["amazon.de", "amazon.fr", "amazon.it", "amazon.es"].some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) {
    return { ...store, defaultCountry: "europe", defaultCurrency: "EUR" };
  }

  if (store.id === "ebay" && ["ebay.de", "ebay.fr"].some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) {
    return { ...store, defaultCountry: "europe", defaultCurrency: "EUR" };
  }

  return store;
}
function isSafeHttpUrl(url: URL) {
  if (!["http:", "https:"].includes(url.protocol)) return false;
  if (url.username || url.password) return false;
  return true;
}



