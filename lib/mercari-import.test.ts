import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node strip-types requires the explicit TypeScript extension.
import { isMercariChallengePage, isSafeMercariProductText, sanitizeMercariImages } from "./mercari-import.ts";

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
