export type SearchSource = "argos" | "john-lewis" | "very";

export type Offer = {
  id: string;
  title: string;
  retailer: string;
  source: SearchSource;
  brand?: string;
  price: number;
  originalPrice?: number;
  currency: "GBP";
  url: string;
  imageUrl?: string;
  shippingText?: string;
  couponText?: string;
  cashbackText?: string;
  reviewText?: string;
  inStock?: boolean;
  badge?: string;
  discountPercent?: number;
};

export type SearchSourceStatus = {
  source: SearchSource;
  retailer: string;
  ok: boolean;
  count: number;
  error?: string;
};

export type SearchResponse = {
  query: string;
  offers: Offer[];
  sources: SearchSourceStatus[];
  generatedAt: string;
  note: string;
};

