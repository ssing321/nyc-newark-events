import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { EventCard } from "@/components/event-card";
import { EventFiltersPanel } from "@/components/event-filters";
import { PlanMyNight } from "@/components/plan-my-night";
import { formatNewYorkMonthYear, resolveDateRange } from "@/lib/dates";
import { parseEventFilters, type RawSearchParams } from "@/lib/events/query";
import { editorialLabel, recommendEvents } from "@/lib/events/recommendations";
import { searchEvents } from "@/lib/events/service";
import type { DiscoveryMode, EventFilters, EventSearchResult } from "@/lib/events/types";

const QUICK_MODES: Array<{ mode: DiscoveryMode; label: string; subline: string }> = [
  { mode: "tonight", label: "TONIGHT", subline: "Out now" },
  { mode: "weekend", label: "THIS WEEKEND", subline: "Fri—Sun" },
  { mode: "under-50", label: "UNDER $50", subline: "Known prices" },
  { mode: "surprise", label: "SURPRISE ME", subline: "Mix it up" },
];

const MODE_TITLES: Record<DiscoveryMode, string> = {
  tonight: "TONIGHT",
  weekend: "THIS WEEKEND",
  "under-50": "UNDER $50",
  surprise: "A WILD CARD",
};

function loadMoreHref(params: RawSearchParams, nextPage: number) {
  const next = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    const item = Array.isArray(value) ? value[0] : value;
    if (item && key !== "page") next.set(key, item);
  });
  next.set("page", String(nextPage));
  return `/?${next.toString()}#event-results`;
}

async function safeSearch(filters: EventFilters) {
  try {
    return await searchEvents(filters);
  } catch (error) {
    console.error("Unable to render discovery section:", error);
    return null;
  }
}

function DiscoveryGrid({
  title,
  index,
  description,
  result,
  mode,
}: {
  title: string;
  index: string;
  description: string;
  result: EventSearchResult | null;
  mode: "top" | DiscoveryMode;
}) {
  const events = result
    ? recommendEvents(result.events, {
        limit: 4,
        mode,
        budgetMax: mode === "under-50" ? 50 : undefined,
      })
    : [];
  if (!events.length) return null;

  return (
    <section className="editorial-section" aria-labelledby={`${mode}-heading`}>
      <div className="shell">
        <div className="section-masthead">
          <div>
            <p className="section-index">{index}</p>
            <h2 id={`${mode}-heading`}>{title}</h2>
          </div>
          <p>{description}</p>
        </div>
        <div className="event-grid editorial-grid">
          {events.map((event, indexValue) => (
            <EventCard
              event={event}
              featured={indexValue === 0}
              key={event.id}
              label={editorialLabel(event, mode)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const rawParams = (await searchParams) as RawSearchParams;
  const filters = parseEventFilters(rawParams);
  const fallbackRange = resolveDateRange(filters.range, filters.start, filters.end);
  const editorialFilters: EventFilters = {
    area: "both",
    category: "All",
    range: "month",
    query: "",
    page: 3,
  };
  const weekendFilters: EventFilters = {
    ...editorialFilters,
    range: "weekend",
    page: 2,
  };
  const [editorialResult, weekendResult] = await Promise.all([
    safeSearch(editorialFilters),
    safeSearch(weekendFilters),
  ]);
  // Run the browse query after the editorial seeds so overlapping provider pages
  // are served from the normalized cache instead of creating concurrent duplicates.
  const result = await safeSearch(filters);

  const quickResult = filters.mode === "surprise" ? editorialResult : result;
  const currentMonth = formatNewYorkMonthYear();

  return (
    <main id="main-content">
      <section className="discovery-hero" id="discover">
        <div className="shell hero-grid">
          <div className="hero-title-block">
            <p className="hero-location"><span>LIVE</span> NYC / NORTH JERSEY</p>
            <h1>WHAT’S<br /><em>HAPPENING?</em></h1>
            <p className="brand-line">FIND YOUR NEXT MOVE.</p>
          </div>
          <div className="hero-side-note" aria-hidden="true">
            <span>40.7128° N</span>
            <span>74.1724° W</span>
            <b>{currentMonth.replace(" ", " / ")}</b>
          </div>
        </div>
        <div className="shell quick-grid" aria-label="Quick discovery">
          {QUICK_MODES.map((item, index) => (
            <Link
              className={`quick-action focus-ring${filters.mode === item.mode ? " is-active" : ""}`}
              href={`/?mode=${item.mode}#discover-results`}
              key={item.mode}
            >
              <small>0{index + 1} / {item.subline}</small>
              <strong>{item.label}</strong>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
        <form className="hero-search shell" action="/" method="get" role="search">
          <label htmlFor="hero-search">Search SCENE</label>
          <input id="hero-search" name="q" type="search" defaultValue={filters.query} placeholder="ARTISTS, TEAMS, EVENTS, VENUES…" autoComplete="off" />
          <button type="submit" aria-label="Search events">SEARCH <span aria-hidden="true">↗</span></button>
        </form>
      </section>

      <div id="discover-results">
        {filters.mode ? (
          <DiscoveryGrid
            index="01 / QUICK MODE"
            title={MODE_TITLES[filters.mode]}
            description={
              filters.mode === "under-50"
                ? "Only listings with a provider-supplied minimum price at or below $50."
                : filters.mode === "surprise"
                  ? "A deliberately mixed shortlist across category, venue, and place."
                  : "The strongest real listings for the window you picked."
            }
            result={quickResult}
            mode={filters.mode}
          />
        ) : (
          <>
            <DiscoveryGrid
              index="01 / EDITORS’ ROUTE"
              title="TOP PICKS"
              description="Timely, varied, and worth leaving the apartment for—ranked from real listing data."
              result={editorialResult}
              mode="top"
            />
            <DiscoveryGrid
              index="02 / FRI—SUN"
              title="THIS WEEKEND"
              description="A cross-Hudson mix for the next open weekend window."
              result={weekendResult}
              mode="weekend"
            />
          </>
        )}
      </div>

      <PlanMyNight />

      <section className="catalog" id="events" aria-labelledby="browse-heading">
        <div className="shell">
          <div className="browse-masthead">
            <p className="section-index">05 / FULL LISTINGS</p>
            <h2 id="browse-heading">BROWSE ALL</h2>
          </div>
          <EventFiltersPanel
            key={`${(result?.filters ?? filters).query}-${(result?.filters ?? filters).mode ?? "all"}`}
            filters={result?.filters ?? filters}
            rangeStart={result?.rangeStart ?? fallbackRange.startDate}
            rangeEnd={result?.rangeEnd ?? fallbackRange.endDate}
          />

          {!result ? (
            <ErrorState />
          ) : result.events.length === 0 ? (
            <EmptyState />
          ) : (
            <div id="event-results">
              <div className="results-heading">
                <p><strong>{result.total}{result.totalIsExact ? "" : "+"}</strong> {result.total === 1 ? "listing" : "listings"}</p>
                <p>{filters.mode === "under-50" ? "KNOWN MINIMUM PRICE ≤ $50" : "SOONEST FIRST"}</p>
              </div>
              <div className="event-grid">
                {result.events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
              {result.hasMore ? (
                <div className="load-more-wrap">
                  <Link className="button button-ink focus-ring" href={loadMoreHref(rawParams, filters.page + 1)} scroll={false}>
                    Load more listings <span aria-hidden="true">↓</span>
                  </Link>
                  <p>Showing {result.shown} of {result.total}{result.totalIsExact ? "" : "+"}</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
