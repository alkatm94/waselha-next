import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node strip-types requires the explicit TypeScript extension.
import { extractMercariEmbeddedProduct, isMercariChallengePage, isSafeMercariProductText, normalizeMercariProductUrl, sanitizeMercariImages } from "./mercari-import.ts";

test("detects Cloudflare challenge pages", () => {
  assert.equal(isMercariChallengePage(200, "<title>Just a moment...</title><script src='/cdn-cgi/challenge-platform/x'></script>"), true);
  assert.equal(isMercariChallengePage(200, "<div id='cf-chl-widget'>Checking your browser</div>"), true);
});

test("rejects protection-page text as product metadata", () => {
  for (const value of ["Just a moment...", "Access denied", "Checking your browser", "Cloudflare"]) assert.equal(isSafeMercariProductText(value), false);
  assert.equal(isSafeMercariProductText("Nintendo Switch OLED"), true);
});

test("never treats the product URL or protection assets as images", () => {
  const productUrl = "https://jp.mercari.com/item/m38139696462";
  assert.deepEqual(sanitizeMercariImages([productUrl, "https://jp.mercari.com/cdn-cgi/challenge-platform/logo.png", "https://static.mercdn.net/item/detail/orig/photos/m38139696462_1.jpg"], productUrl), ["https://static.mercdn.net/item/detail/orig/photos/m38139696462_1.jpg"]);
});


test("normalizes global Mercari shop URLs without treating UUID variants as item IDs", () => {
  const full = normalizeMercariProductUrl("https://japan.us.mercari.com/en/items/e4122592-71a5-459c-922c-35d1445bf31d?variant=df6f26da-2f2a-466c-8990-bf916e61e9c3");
  assert.equal(full.normalizedUrl, "https://japan.us.mercari.com/en/items/e4122592-71a5-459c-922c-35d1445bf31d");
  assert.equal(full.pathItemId, "e4122592-71a5-459c-922c-35d1445bf31d");
  assert.equal(full.variantId, "df6f26da-2f2a-466c-8990-bf916e61e9c3");
  assert.equal(full.apiItemId, "");
});
const shopItemId = "e4122592-71a5-459c-922c-35d1445bf31d";
const shopVariantId = "df6f26da-2f2a-466c-8990-bf916e61e9c3";
function shopsFlight(variants: Array<Record<string, unknown>>) {
  const payload = JSON.stringify({ item: { id: shopItemId, itemType: "ITEM_TYPE_SHOPS", name: "Cartier Shoulder Bag", description: "Authentic Bordeaux shoulder bag", categoryName: "Shoulder Bags", brandName: "Cartier", conditionName: "Some scratches/marks", variants } });
  return `<html><script>self.__next_f.push(${JSON.stringify([1, payload])})</script></html>`;
}

test("routes Marketplace m identifiers to items/get", () => {
  const normalized = normalizeMercariProductUrl("https://jp.mercari.com/item/m38139696462");
  assert.equal(normalized.apiItemId, "m38139696462");
  assert.equal(normalized.variantId, "");
});

test("extracts a Mercari Shops selected variant with original currency", () => {
  const url = `https://japan.us.mercari.com/en/items/${shopItemId}?variant=${shopVariantId}`;
  const product = extractMercariEmbeddedProduct(shopsFlight([{ variantId: shopVariantId, price: { value: 62.59, currencyCode: "USD" }, urls: ["https://assets.mercari-shops-static.com/-/large/plain/current-product.jpg@jpg"], isSoldOut: false }]), url);
  assert.equal(product.itemKind, "SHOPS");
  assert.equal(product.variantId, shopVariantId);
  assert.equal(product.name, "Cartier Shoulder Bag");
  assert.equal(product.price, 62.59);
  assert.equal(product.priceCurrency, "USD");
  assert.equal(product.priceJpy, null);
  assert.equal(product.priceSource, "MERCARI_SHOPS_RSC");
  assert.deepEqual(product.images, ["https://assets.mercari-shops-static.com/-/large/plain/current-product.jpg@jpg"]);
  assert.equal(product.availabilityStatus, "AVAILABLE");
});

test("keeps Mercari Shops without an unambiguous variant in review", () => {
  const url = `https://japan.us.mercari.com/en/items/${shopItemId}`;
  const product = extractMercariEmbeddedProduct(shopsFlight([
    { variantId: shopVariantId, price: { value: 62.59, currencyCode: "USD" }, urls: ["https://assets.mercari-shops-static.com/-/large/plain/a.jpg@jpg"], isSoldOut: false },
    { variantId: "7868bcbb-cdd6-46f0-a421-d913d85f972d", price: { value: 70, currencyCode: "USD" }, urls: ["https://assets.mercari-shops-static.com/-/large/plain/b.jpg@jpg"], isSoldOut: false },
  ]), url);
  assert.equal(product.variantId, "");
  assert.equal(product.price, null);
  assert.deepEqual(product.images, []);
  assert.equal(product.availabilityStatus, "NEEDS_REVIEW");
});

test("rejects an invalid Mercari Shops UUID", () => {
  assert.throws(() => normalizeMercariProductUrl("https://japan.us.mercari.com/en/items/not-a-uuid"), /UUID/);
});

test("extracts a sold Mercari Shops variant", () => {
  const url = `https://japan.us.mercari.com/en/items/${shopItemId}?variant=${shopVariantId}`;
  const product = extractMercariEmbeddedProduct(shopsFlight([{ variantId: shopVariantId, price: { value: 62.59, currencyCode: "USD" }, urls: ["https://assets.mercari-shops-static.com/-/large/plain/sold.jpg@jpg"], isSoldOut: true }]), url);
  assert.equal(product.availabilityStatus, "SOLD");
});
