import * as cheerio from "cheerio";
import { Offer, SearchResponse, SearchSource, SearchSourceStatus } from "./types";

type ConnectorResult = {
  source: SearchSource;
  retailer: string;
  offers: Offer[];
};

const REQUEST_HEADERS = {
  "accept-language": "en-GB,en;q=0.9",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
};

const RETAILER_NAMES: Record<SearchSource, string> = {
  argos: "Argos",
  "john-lewis": "John Lewis",
  very: "Very"
};

function toAbsoluteUrl(url?: string | null) {
  if (!url) return undefined;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("http")) return url;
  return url;
}

function slugifyQuery(query: string) {
  return query
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseMoney(value?: string | null) {
  if (!value) return undefined;
  const normalized = value.replace(/[^0-9.]/g, "");
  if (!normalized) return undefined;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function discountPercent(price: number, originalPrice?: number) {
  if (!originalPrice || originalPrice <= price) return undefined;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

function offerId(source: SearchSource, seed: string) {
  return `${source}:${seed}`;
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: REQUEST_HEADERS,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }

  return response.text();
}

async function searchVery(query: string): Promise<ConnectorResult> {
  const url = `https://www.very.co.uk/e/q/${encodeURIComponent(query)}.end`;
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const offers: Offer[] = [];

  $("li.product.item")
    .slice(0, 8)
    .each((_, element) => {
      const title = $(element).find("a.productTitle h3").text().replace(/\s+/g, " ").trim();
      const price =
        parseMoney($(element).find("dd.productNowPrice").attr("priceValue")) ??
        parseMoney($(element).find("dd.productPrice").attr("priceValue"));
      const originalPrice = parseMoney($(element).find("dd.productWasPrice").attr("priceValue"));
      const urlValue = $(element).find("a.productTitle").attr("href");
      const imageUrl = $(element).find("img").first().attr("src");
      const brand = $(element).find(".productBrand").text().replace(/\s+/g, " ").trim();
      const stockText = $(element).find("dd.available").text().trim();

      if (!title || !price || !urlValue) return;

      offers.push({
        id: offerId("very", urlValue),
        title,
        retailer: "Very",
        source: "very",
        brand: brand || undefined,
        price,
        originalPrice,
        currency: "GBP",
        url: toAbsoluteUrl(urlValue) ?? urlValue,
        imageUrl: toAbsoluteUrl(imageUrl),
        inStock: stockText.toLowerCase().includes("stock"),
        reviewText: $(element).find(".bvReviewsNumber").text().replace(/\s+/g, " ").trim() || undefined,
        discountPercent: discountPercent(price, originalPrice)
      });
    });

  return { source: "very", retailer: "Very", offers };
}

async function searchJohnLewis(query: string): Promise<ConnectorResult> {
  const url = `https://www.johnlewis.com/search?search-term=${encodeURIComponent(query)}`;
  const html = await fetchHtml(url);
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );

  if (!match) {
    throw new Error("Unable to parse John Lewis search payload");
  }

  const payload = JSON.parse(match[1]);
  const products = payload?.props?.pageProps?.productListingData?.products;

  if (!Array.isArray(products)) {
    throw new Error("John Lewis products payload missing");
  }

  const offers: Offer[] = products.slice(0, 8).flatMap((item: any) => {
    const price = parseMoney(item?.variantPriceRange?.value?.min);
    const reviewText =
      item?.averageRating && item?.reviews
        ? `${item.averageRating} ★ (${item.reviews.toLocaleString("en-GB")} reviews)`
        : undefined;
    const couponMessage = Array.isArray(item?.messaging)
      ? item.messaging.find((entry: any) =>
          String(entry?.title ?? "").toLowerCase().includes("promo code")
        )
      : undefined;
    const shippingMessage = Array.isArray(item?.messaging)
      ? item.messaging.find((entry: any) =>
          String(entry?.title ?? "").toLowerCase().includes("delivery")
        )
      : undefined;

    if (!price || !item?.url || !item?.title) {
      return [];
    }

    return [
      {
        id: offerId("john-lewis", item.url),
        title: item.title,
        retailer: "John Lewis",
        source: "john-lewis",
        brand: item.brand || undefined,
        price,
        currency: "GBP" as const,
        url: toAbsoluteUrl(`https://www.johnlewis.com${item.url}`) ?? item.url,
        imageUrl: toAbsoluteUrl(item.image),
        shippingText: shippingMessage?.title,
        couponText: couponMessage?.title,
        inStock: !item.outOfStock,
        reviewText,
        badge: couponMessage ? "Offer code" : undefined
      }
    ];
  });

  return { source: "john-lewis", retailer: "John Lewis", offers };
}

async function fetchArgosProduct(productId: string) {
  const html = await fetchHtml(`https://www.argos.co.uk/product/${productId}`);
  const $ = cheerio.load(html);
  const payload = $("script[type='application/ld+json']").html();

  if (!payload) {
    throw new Error(`Argos product ${productId} missing structured data`);
  }

  const parsed = JSON.parse(payload);
  const product = parsed?.["@graph"]?.find((item: any) => item?.["@type"] === "Product");

  if (!product?.offers?.price || !product?.offers?.url) {
    throw new Error(`Argos product ${productId} missing offer data`);
  }

  return product;
}

async function searchArgos(query: string): Promise<ConnectorResult> {
  const slug = slugifyQuery(query);
  const html = await fetchHtml(`https://www.argos.co.uk/search/${slug}/`);
  const $ = cheerio.load(html);
  const rawSearchData = $("#sai-product-data").html();

  if (!rawSearchData) {
    throw new Error("Argos search data unavailable");
  }

  const payload = JSON.parse(rawSearchData);
  const products = Array.isArray(payload?.products) ? payload.products.slice(0, 4) : [];

  if (!products.length) {
    return { source: "argos", retailer: "Argos", offers: [] };
  }

  const offers = (
    await Promise.allSettled(
      products.map(async (item: { id: string; title: string }) => {
        const product = await fetchArgosProduct(item.id);
        const price = parseMoney(product.offers.price);
        const rating = product.aggregateRating?.ratingValue;
        const reviewCount = product.aggregateRating?.reviewCount;

        if (!price) return undefined;

        return {
          id: offerId("argos", item.id),
          title: product.name ?? item.title,
          retailer: "Argos",
          source: "argos",
          brand: product.brand?.name,
          price,
          currency: "GBP" as const,
          url: product.offers.url,
          imageUrl: toAbsoluteUrl(product.image),
          inStock: true,
          reviewText:
            rating && reviewCount
              ? `${rating} ★ (${Number(reviewCount).toLocaleString("en-GB")} reviews)`
              : undefined,
          shippingText: "Collection and delivery options on retailer page"
        } satisfies Offer;
      })
    )
  )
    .flatMap((result) => (result.status === "fulfilled" && result.value ? [result.value] : []))
    .sort((left, right) => left.price - right.price);

  return { source: "argos", retailer: "Argos", offers };
}

export async function runSearch(query: string): Promise<SearchResponse> {
  const trimmedQuery = query.trim();

  const settled = await Promise.allSettled([
    searchArgos(trimmedQuery),
    searchJohnLewis(trimmedQuery),
    searchVery(trimmedQuery)
  ]);

  const offers = settled
    .flatMap((result) => (result.status === "fulfilled" ? result.value.offers : []))
    .sort((left, right) => left.price - right.price);

  const sources: SearchSourceStatus[] = settled.map((result, index) => {
    const source = (["argos", "john-lewis", "very"] as const)[index];

    if (result.status === "fulfilled") {
      return {
        source,
        retailer: RETAILER_NAMES[source],
        ok: true,
        count: result.value.offers.length
      };
    }

    return {
      source,
      retailer: RETAILER_NAMES[source],
      ok: false,
      count: 0,
      error: result.reason instanceof Error ? result.reason.message : "Search failed"
    };
  });

  return {
    query: trimmedQuery,
    offers,
    sources,
    generatedAt: new Date().toISOString(),
    note:
      "Prototype uses live retailer pages from a small UK store set. Coverage, coupons, and cashback are limited to what each page exposes in real time."
  };
}

