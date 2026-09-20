import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { EventFiltersPanel } from "@/components/event-filters";
import { resolveDateRange } from "@/lib/dates";
import { parseEventFilters, type RawSearchParams } from "@/lib/events/query";
import { searchEvents } from "@/lib/events/service";

function loadMoreHref(params: RawSearchParams, nextPage: number) {
  const next = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    const item = Array.isArray(value) ? value[0] : value;
    if (item && key !== "page") next.set(key, item);
  });
  next.set("page", String(nextPage));
  return `/?${next.toString()}#event-results`;
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const rawParams = (await searchParams) as RawSearchParams;
  const filters = parseEventFilters(rawParams);
  const fallbackRange = resolveDateRange(filters.range, filters.start, filters.end);
  let result;

  try {
    result = await searchEvents(filters);
  } catch (error) {
    console.error("Unable to render homepage events:", error);
  }

  return (
    <main>
      <section className="hero">
        <div className="hero-orbit orbit-one" aria-hidden="true" />
        <div className="hero-orbit orbit-two" aria-hidden="true" />
        <div className="shell hero-content">
          <p className="hero-kicker"><span>Now playing</span> across two cities</p>
          <h1>Make a plan.<br /><em>See something live.</em></h1>
          <p className="hero-subtitle">
            Discover the games, shows, concerts, and moments worth crossing town—or the Hudson—for.
          </p>
          <a className="hero-cta focus-ring" href="#events">Explore what’s on <span aria-hidden="true">↓</span></a>
        </div>
        <div className="hero-marquee" aria-hidden="true">
          <div>SPORTS <span>✦</span> LIVE MUSIC <span>✦</span> THEATRE <span>✦</span> COMEDY <span>✦</span> FAMILY <span>✦</span></div>
        </div>
      </section>

      <section className="catalog" id="events">
        <div className="shell">
          <EventFiltersPanel
            key={(result?.filters ?? filters).query}
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
                <p><strong>{result.total}{result.totalIsExact ? "" : "+"}</strong> {result.total === 1 ? "event" : "events"} found</p>
                <p>Sorted by soonest</p>
              </div>
              <div className="event-grid">
                {result.events.map((event, index) => (
                  <EventCard key={event.id} event={event} priority={index < 3} />
                ))}
              </div>
              {result.hasMore ? (
                <div className="load-more-wrap">
                  <Link
                    className="button button-secondary focus-ring"
                    href={loadMoreHref(rawParams, filters.page + 1)}
                    scroll={false}
                  >
                    Load more events
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
