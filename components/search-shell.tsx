"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Offer, SearchResponse } from "@/lib/types";

type SearchShellProps = {
  initialQuery: string;
};

type SortMode = "relevance" | "lowest-price";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2
  }).format(value);
}

export function SearchShell({ initialQuery }: SearchShellProps) {
  const router = useRouter();
  const [draftQuery, setDraftQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("lowest-price");
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setDraftQuery(initialQuery);
    setActiveQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (!activeQuery) {
      setData(null);
      setError(null);
      setSelectedStores([]);
      return;
    }

    let cancelled = false;

    async function loadSearch() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(activeQuery)}`, {
          cache: "no-store"
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Search failed");
        }

        if (!cancelled) {
          setData(payload);
          setSelectedStores([]);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setData(null);
          setError(fetchError instanceof Error ? fetchError.message : "Search failed");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSearch();

    return () => {
      cancelled = true;
    };
  }, [activeQuery]);

  const storeCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const offer of data?.offers ?? []) {
      counts.set(offer.retailer, (counts.get(offer.retailer) ?? 0) + 1);
    }

    return counts;
  }, [data]);

  const visibleOffers = useMemo(() => {
    const selectedSet = new Set(selectedStores);
    let offers = data?.offers ?? [];

    if (selectedSet.size) {
      offers = offers.filter((offer) => selectedSet.has(offer.retailer));
    }

    if (sortMode === "lowest-price") {
      return [...offers].sort((left, right) => left.price - right.price);
    }

    return offers;
  }, [data, selectedStores, sortMode]);

  const featuredOffers = visibleOffers.slice(0, 6);
  const comparisonOffers = visibleOffers.slice(0, 10);
  const bestOffer = visibleOffers[0];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = draftQuery.trim();

    if (!nextQuery) return;

    startTransition(() => {
      router.push(`/?q=${encodeURIComponent(nextQuery)}`);
      setActiveQuery(nextQuery);
    });
  }

  function toggleStore(store: string) {
    setSelectedStores((current) =>
      current.includes(store)
        ? current.filter((value) => value !== store)
        : [...current, store]
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md">
      <header className="bg-surface-container-lowest border-b border-surface-variant sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 max-w-[1280px] mx-auto h-16">
          <div className="text-xl font-bold tracking-tight text-primary flex items-center">
            <span className="material-symbols-outlined mr-2">analytics</span>
            PriceGap
          </div>
          <nav className="hidden md:flex gap-6 h-full items-center">
            <a className="text-primary border-b-2 border-primary h-full flex items-center pt-1 font-body-sm" href="#results">
              Deals
            </a>
            <a className="text-on-surface-variant hover:text-primary transition-colors duration-150 h-full flex items-center font-body-sm" href="#results">
              Categories
            </a>
            <a className="text-on-surface-variant hover:text-primary transition-colors duration-150 h-full flex items-center font-body-sm" href="#results">
              Saved
            </a>
          </nav>
          <div className="flex gap-4 items-center">
            <button className="text-on-surface-variant hover:text-primary transition-colors duration-150 hover:bg-surface-container p-2 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined">favorite</span>
            </button>
            <button className="text-on-surface-variant hover:text-primary transition-colors duration-150 hover:bg-surface-container p-2 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="text-on-surface-variant hover:text-primary transition-colors duration-150 hover:bg-surface-container p-2 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined">person</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <section className="py-xl px-6 max-w-container-max mx-auto flex flex-col items-center justify-center text-center">
          <h1 className="font-h1 text-on-surface mb-sm max-w-3xl">
            Compare live UK prices, retailer offers and promo signals in one search
          </h1>
          <p className="font-body-md text-on-surface-variant mb-lg flex items-center gap-xs">
            <span
              className="material-symbols-outlined text-secondary fill"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            Prototype with live results from Argos, John Lewis and Very
          </p>

          <form className="w-full max-w-3xl relative mb-lg" onSubmit={handleSubmit}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-on-surface-variant">search</span>
            </div>
            <input
              className="w-full pl-12 pr-40 py-4 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface font-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm transition-all"
              placeholder="Search for products, brands or retailers..."
              type="text"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
            />
            <button
              className="absolute inset-y-2 right-2 px-6 bg-primary-container text-on-primary rounded-full font-h3 hover:bg-primary transition-colors flex items-center gap-xs disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap justify-center gap-sm">
            {["Fashion", "Tech", "Home"].map((category, index) => {
              const icons = ["checkroom", "devices", "chair"];
              return (
                <button
                  key={category}
                  className="bg-surface-container-lowest border border-outline-variant rounded-full px-6 py-2 font-body-sm text-on-surface-variant hover:border-primary hover:text-primary transition-colors flex items-center gap-xs"
                  onClick={() => {
                    const quickQuery = category === "Fashion" ? "nike air force 1" : category === "Tech" ? "iphone 15" : "office chair";
                    setDraftQuery(quickQuery);
                    startTransition(() => {
                      router.push(`/?q=${encodeURIComponent(quickQuery)}`);
                      setActiveQuery(quickQuery);
                    });
                  }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">{icons[index]}</span>
                  {category}
                </button>
              );
            })}
          </div>
        </section>

        <section className="py-xl bg-surface-container-low border-y border-surface-variant">
          <div className="max-w-container-max mx-auto px-6">
            <h2 className="font-h2 text-center text-on-surface mb-lg">How PriceGap Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              {[
                {
                  icon: "search",
                  tone: "bg-primary-fixed text-primary",
                  title: "Search",
                  body: "Submit one query and PriceGap fetches live product offers from supported UK stores."
                },
                {
                  icon: "compare_arrows",
                  tone: "bg-secondary-fixed text-secondary",
                  title: "Compare",
                  body: "Review price, stock, promo messaging and source coverage in a single comparison view."
                },
                {
                  icon: "shopping_cart_checkout",
                  tone: "bg-tertiary-fixed text-tertiary",
                  title: "Buy",
                  body: "Jump out to the retailer when you find the strongest current offer."
                }
              ].map((step) => (
                <div
                  key={step.title}
                  className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant text-center hover:shadow-[0px_4px_12px_rgba(0,0,0,0.05)] transition-shadow"
                >
                  <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-sm ${step.tone}`}>
                    <span className="material-symbols-outlined text-[32px]">{step.icon}</span>
                  </div>
                  <h3 className="font-h3 text-on-surface mb-xs">{step.title}</h3>
                  <p className="font-body-sm text-on-surface-variant">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="results" className="max-w-container-max mx-auto w-full px-gutter py-md flex flex-col md:flex-row gap-gutter relative">
          <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-md md:sticky md:top-24 self-start">
            <div className="bg-white p-sm rounded-lg border border-outline-variant">
              <div className="flex items-center justify-between mb-xs">
                <h2 className="font-h3 text-h3 text-on-surface">Sources</h2>
                <span className="font-label-caps text-label-caps text-on-surface-variant">
                  Live
                </span>
              </div>
              <div className="space-y-xs">
                {(data?.sources ?? [
                  { retailer: "Argos", ok: true, count: 0, source: "argos" as const },
                  { retailer: "John Lewis", ok: true, count: 0, source: "john-lewis" as const },
                  { retailer: "Very", ok: true, count: 0, source: "very" as const }
                ]).map((source) => (
                  <div
                    key={source.source}
                    className="flex items-start justify-between gap-3 p-xs bg-surface-container-low rounded-DEFAULT border border-outline-variant"
                  >
                    <div>
                      <div className="font-body-sm text-on-surface">{source.retailer}</div>
                      <div className="font-label-caps text-label-caps text-on-surface-variant mt-1">
                        {source.ok ? `${source.count} live offers` : "Unavailable"}
                      </div>
                    </div>
                    <span
                      className={`material-symbols-outlined text-[18px] ${source.ok ? "text-secondary" : "text-error"}`}
                    >
                      {source.ok ? "check_circle" : "error"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-sm rounded-lg border border-outline-variant">
              <h3 className="font-h3 text-body-md text-on-surface mb-sm">Retailers</h3>
              <div className="flex flex-col gap-xs">
                {[...storeCounts.entries()].map(([store, count]) => (
                  <label key={store} className="flex items-center gap-xs cursor-pointer group">
                    <input
                      checked={selectedStores.includes(store)}
                      className="rounded-sm border-outline text-primary focus:ring-primary h-4 w-4"
                      onChange={() => toggleStore(store)}
                      type="checkbox"
                    />
                    <span className="font-body-sm text-on-surface-variant group-hover:text-on-surface">
                      {store}
                    </span>
                    <span className="text-outline text-label-caps ml-auto">{count}</span>
                  </label>
                ))}
                {!storeCounts.size && (
                  <p className="font-body-sm text-on-surface-variant">
                    Search to filter by live retailer results.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white p-sm rounded-lg border border-outline-variant">
              <h3 className="font-h3 text-body-md text-on-surface mb-sm">Prototype Notes</h3>
              <p className="font-body-sm text-on-surface-variant">
                Scrapers are intentionally lightweight. Some stores block automation, and cashback is only shown when surfaced directly in the live page content.
              </p>
            </div>
          </aside>

          <div className="flex-1 flex flex-col gap-md min-w-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm bg-white p-sm rounded-lg border border-outline-variant">
              <div>
                <h2 className="font-h2 text-h2 text-on-surface m-0">
                  {activeQuery ? `Live results for "${activeQuery}"` : "Search once to compare UK offers"}
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-xxs">
                  {loading
                    ? "Fetching retailer pages now..."
                    : error
                      ? error
                      : data
                        ? `Showing ${visibleOffers.length} offers from ${data.sources.filter((item) => item.ok).length} live sources`
                        : "Run a search to load a minimal live comparison experience."}
                </p>
              </div>

              <div className="flex items-center gap-xs w-full sm:w-auto">
                <span className="font-body-sm text-on-surface-variant whitespace-nowrap">Sort by:</span>
                <select
                  className="bg-surface-container border border-outline-variant rounded-DEFAULT font-body-sm text-on-surface px-sm py-xxs focus:ring-primary focus:border-primary w-full sm:w-auto"
                  onChange={(event) => setSortMode(event.target.value as SortMode)}
                  value={sortMode}
                >
                  <option value="lowest-price">Lowest Price</option>
                  <option value="relevance">Source Order</option>
                </select>
              </div>
            </div>

            {data?.note ? (
              <div className="bg-white p-sm rounded-lg border border-outline-variant font-body-sm text-on-surface-variant">
                {data.note}
              </div>
            ) : null}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-md">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg border border-outline-variant overflow-hidden animate-pulse"
                  >
                    <div className="aspect-square bg-surface-container-low border-b border-outline-variant" />
                    <div className="p-sm space-y-3">
                      <div className="h-5 bg-surface-container rounded" />
                      <div className="h-4 bg-surface-container rounded w-2/3" />
                      <div className="h-8 bg-surface-container rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {!loading && !error && !featuredOffers.length ? (
              <div className="bg-white rounded-lg border border-outline-variant p-xl text-center">
                <span className="material-symbols-outlined text-6xl text-outline-variant mb-md">
                  travel_explore
                </span>
                <h3 className="font-h2 text-h2 text-on-surface mb-xs">No live offers yet</h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">
                  Try a broader UK retail search such as `iphone 15`, `macbook air`, `sony headphones` or `nike air force 1`.
                </p>
              </div>
            ) : null}

            {!loading && featuredOffers.length ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-md">
                  {featuredOffers.map((offer, index) => (
                    <OfferCard key={offer.id} offer={offer} featured={index === 0} />
                  ))}
                </div>

                {bestOffer ? (
                  <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-DEFAULT border-l-4 border-l-primary-container shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-primary-container">verified</span>
                      <h3 className="font-h3 text-h3 text-on-surface">Top Recommended Deal</h3>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-low p-4 rounded-DEFAULT">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-DEFAULT border border-outline-variant flex items-center justify-center p-2">
                          {bestOffer.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              alt={bestOffer.retailer}
                              className="w-full h-full object-contain mix-blend-multiply"
                              src={bestOffer.imageUrl}
                            />
                          ) : (
                            <span className="material-symbols-outlined text-outline">image</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-price-display text-price-display text-on-surface">
                              {formatPrice(bestOffer.price)}
                            </span>
                            {bestOffer.originalPrice ? (
                              <span className="font-body-sm text-body-sm text-outline line-through">
                                {formatPrice(bestOffer.originalPrice)}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {bestOffer.discountPercent ? (
                              <span className="bg-[#e6f4ea] text-[#006e2a] px-2 py-0.5 rounded-sm font-label-caps text-label-caps">
                                {bestOffer.discountPercent}% OFF
                              </span>
                            ) : null}
                            <span className="font-body-sm text-body-sm text-outline flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">storefront</span>
                              {bestOffer.retailer}
                            </span>
                          </div>
                        </div>
                      </div>
                      <a
                        className="w-full sm:w-auto px-6 py-3 bg-primary-container text-white font-h3 text-h3 rounded-DEFAULT hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap text-center"
                        href={bestOffer.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Go to Store
                      </a>
                    </div>
                  </div>
                ) : null}

                <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT overflow-hidden">
                  <div className="p-6 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
                    <h2 className="font-h2 text-h2 text-on-surface">
                      Compare Retailers ({comparisonOffers.length} Offers)
                    </h2>
                    <div className="font-body-sm text-on-surface-variant">
                      Prototype live comparison table
                    </div>
                  </div>
                  <div className="flex flex-col divide-y divide-outline-variant">
                    {comparisonOffers.map((offer) => (
                      <ComparisonRow key={offer.id} offer={offer} />
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </section>
      </main>

      <footer className="bg-surface-container text-on-surface-variant font-body-sm w-full border-t border-surface-variant mt-auto">
        <div className="max-w-[1280px] mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-bold text-on-surface flex items-center">
            <span className="material-symbols-outlined mr-2">analytics</span>
            PriceGap
          </div>
          <nav className="flex flex-wrap gap-4 justify-center">
            <a className="text-on-surface-variant hover:underline hover:text-primary transition-colors cursor-pointer" href="#">
              About
            </a>
            <a className="text-on-surface-variant hover:underline hover:text-primary transition-colors cursor-pointer" href="#">
              Privacy
            </a>
            <a className="text-on-surface-variant hover:underline hover:text-primary transition-colors cursor-pointer" href="#">
              Terms
            </a>
            <a className="text-on-surface-variant hover:underline hover:text-primary transition-colors cursor-pointer" href="#">
              Retailers
            </a>
            <a className="text-on-surface-variant hover:underline hover:text-primary transition-colors cursor-pointer" href="#">
              Contact
            </a>
          </nav>
          <div className="text-on-surface-variant text-center md:text-right">
            © 2026 PriceGap UK. Prototype live search and comparisons.
          </div>
        </div>
      </footer>
    </div>
  );
}

function OfferCard({ offer, featured }: { offer: Offer; featured: boolean }) {
  return (
    <div className="bg-white rounded-lg border border-outline-variant overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col relative">
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-xxs">
        {featured ? (
          <span className="bg-surface-container-high text-on-surface font-label-caps text-label-caps px-xs py-xxs rounded-sm shadow-sm border border-outline-variant backdrop-blur-md opacity-90">
            Best current price
          </span>
        ) : null}
        {offer.discountPercent ? (
          <span className="bg-secondary-container text-on-secondary-container font-label-caps text-label-caps px-xs py-xxs rounded-sm shadow-sm flex items-center gap-1 w-fit">
            <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
            {offer.discountPercent}% OFF
          </span>
        ) : null}
      </div>

      <div className="aspect-square bg-surface-container-lowest p-md flex items-center justify-center border-b border-outline-variant relative">
        {offer.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={offer.title}
            className="w-full h-full object-contain mix-blend-multiply"
            src={offer.imageUrl}
          />
        ) : (
          <span className="material-symbols-outlined text-outline text-5xl">image</span>
        )}
      </div>

      <div className="p-sm flex flex-col flex-grow">
        <h3 className="font-h3 text-body-lg text-on-surface leading-tight mb-xxs line-clamp-2">
          {offer.title}
        </h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-md">
          {offer.reviewText ?? `${offer.retailer} live listing`}
        </p>

        <div className="mt-auto flex flex-col gap-xxs">
          <div className="flex items-baseline gap-xs">
            <span className="font-price-display text-price-display text-on-surface">
              {formatPrice(offer.price)}
            </span>
            {offer.originalPrice ? (
              <span className="font-body-sm text-body-sm text-outline line-through">
                {formatPrice(offer.originalPrice)}
              </span>
            ) : null}
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Best live price from <span className="font-h3 text-on-surface">{offer.retailer}</span>
          </p>
          <div className="flex items-center justify-between gap-3 mt-sm flex-wrap">
            <span className="flex items-center gap-xs font-label-caps text-label-caps text-secondary bg-surface-container rounded-sm px-xs py-xxs">
              <span className="material-symbols-outlined text-[14px]">
                {offer.couponText ? "sell" : "inventory_2"}
              </span>
              {offer.couponText ?? offer.shippingText ?? (offer.inStock ? "In stock" : "Check retailer")}
            </span>
            <a
              className="font-body-sm text-body-sm text-primary hover:underline flex items-center gap-xxs"
              href={offer.url}
              rel="noreferrer"
              target="_blank"
            >
              Go to store <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonRow({ offer }: { offer: Offer }) {
  return (
    <div className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-surface-container-low transition-colors duration-150">
      <div className="flex items-center gap-4 md:w-1/3">
        <div className="w-20 h-10 bg-white border border-outline-variant flex items-center justify-center p-1 rounded-sm shrink-0">
          {offer.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={offer.retailer} className="max-h-full max-w-full object-contain" src={offer.imageUrl} />
          ) : (
            <div className="font-bold text-sm text-primary">{offer.retailer}</div>
          )}
        </div>
        <div>
          <div className="font-body-sm text-body-sm text-on-surface font-semibold">{offer.retailer}</div>
          <div className="font-label-caps text-label-caps text-outline mt-1">
            {offer.shippingText ?? (offer.couponText ? "Promotion available" : "Live retailer offer")}
          </div>
        </div>
      </div>
      <div className="flex md:flex-col items-center md:items-end gap-2 md:gap-0 md:w-1/3 justify-center">
        <div className="flex items-baseline gap-2">
          <span className="font-h2 text-h2 text-on-surface">{formatPrice(offer.price)}</span>
        </div>
        <div className="flex gap-2 flex-wrap justify-center md:justify-end">
          {offer.originalPrice ? (
            <span className="text-outline line-through font-body-sm text-body-sm">
              {formatPrice(offer.originalPrice)}
            </span>
          ) : null}
          {offer.discountPercent ? (
            <span className="text-[#006e2a] font-body-sm text-body-sm font-semibold">
              Save {offer.discountPercent}%
            </span>
          ) : null}
        </div>
      </div>
      <div className="w-full md:w-1/4 flex justify-end">
        <a
          className="w-full md:w-auto px-6 py-2.5 bg-primary-container text-white font-body-md text-body-md font-semibold rounded-DEFAULT hover:bg-blue-700 transition-colors text-center"
          href={offer.url}
          rel="noreferrer"
          target="_blank"
        >
          Go to Store
        </a>
      </div>
    </div>
  );
}
