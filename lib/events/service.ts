import "server-only";

import { cache } from "react";
import { resolveDateRange, toTicketmasterDateTime } from "@/lib/dates";
import { dedupeEvents } from "./dedupe";
import type {
  Event,
  EventFilters,
  EventProvider,
  EventSearchResult,
  ProviderSearchResult,
} from "./types";
import { ticketmasterProvider } from "./providers/ticketmaster";

export const EVENTS_PER_PAGE = 12;
const PROVIDER_PAGE_SIZE = 100;
const MAX_PROVIDER_PAGES = 100;
const CACHE_WINDOW_MS = 15 * 60 * 1_000;

// Add future providers here. The UI and route handlers consume only normalized events.
const providers: EventProvider[] = [ticketmasterProvider];

function matchesText(event: Event, query: string) {
  if (!query) return true;
  const needle = query.toLocaleLowerCase("en-US");
  return `${event.name} ${event.venueName}`.toLocaleLowerCase("en-US").includes(needle);
}

function matchingEvents(events: Event[], filters: EventFilters, now: number) {
  return dedupeEvents(events)
    .filter((event) => new Date(event.startDateTime).getTime() >= now)
    .filter((event) => filters.category === "All" || event.category === filters.category)
    .filter(
      (event) =>
        filters.mode !== "under-50" ||
        (event.priceMin !== undefined && event.priceMin <= 50),
    )
    .filter((event) => matchesText(event, filters.query))
    .sort(
      (first, second) =>
        new Date(first.startDateTime).getTime() - new Date(second.startDateTime).getTime(),
    );
}

export async function searchEvents(filters: EventFilters): Promise<EventSearchResult> {
  const dateRange = resolveDateRange(filters.range, filters.start, filters.end);
  const normalizedFilters: EventFilters = {
    ...filters,
    range: dateRange.effectiveRange,
    start: dateRange.effectiveRange === "custom" ? dateRange.startDate : filters.start,
    end: dateRange.effectiveRange === "custom" ? dateRange.endDate : filters.end,
  };

  if (dateRange.end <= dateRange.start) {
    return {
      events: [],
      total: 0,
      totalIsExact: true,
      shown: 0,
      hasMore: false,
      filters: normalizedFilters,
      rangeStart: dateRange.startDate,
      rangeEnd: dateRange.endDate,
    };
  }

  const now = Date.now();
  const target = filters.page * EVENTS_PER_PAGE;
  const cacheStableStart = new Date(
    Math.floor(dateRange.start.getTime() / CACHE_WINDOW_MS) * CACHE_WINDOW_MS,
  );
  const collected: Event[] = [];
  let matching: Event[] = [];
  let providerHasMore = true;
  let providerTruncated = false;
  let providerPage = 0;

  while (providerHasMore && providerPage < MAX_PROVIDER_PAGES) {
    const settled = await Promise.allSettled(
      providers.map((provider) =>
        provider.searchEvents({
          area: filters.area,
          startDateTime: toTicketmasterDateTime(cacheStableStart),
          endDateTime: toTicketmasterDateTime(dateRange.end),
          category: filters.category,
          query: filters.query || undefined,
          page: providerPage,
          size: PROVIDER_PAGE_SIZE,
        }),
      ),
    );
    const fulfilled = settled.filter(
      (result): result is PromiseFulfilledResult<ProviderSearchResult> =>
        result.status === "fulfilled",
    );

    if (!fulfilled.length) {
      if (providerPage === 0) {
        throw settled[0]?.status === "rejected"
          ? settled[0].reason
          : new Error("No event providers are available.");
      }
      providerHasMore = false;
      break;
    }

    settled.forEach((result) => {
      if (result.status === "rejected") console.error("An event provider failed:", result.reason);
    });
    fulfilled.forEach((result) => collected.push(...result.value.events));
    providerHasMore = fulfilled.some((result) => result.value.hasMore);
    providerTruncated ||= fulfilled.some((result) => result.value.truncated);
    providerPage += 1;
    matching = matchingEvents(collected, filters, now);
    if (matching.length > target) break;
  }

  const shown = Math.min(target, matching.length);
  const reachedProviderLimit = providerPage >= MAX_PROVIDER_PAGES;
  const hasMore = shown < matching.length || (providerHasMore && !reachedProviderLimit);

  return {
    events: matching.slice(0, shown),
    total: matching.length,
    totalIsExact: !providerHasMore && !providerTruncated,
    shown,
    hasMore,
    filters: normalizedFilters,
    rangeStart: dateRange.startDate,
    rangeEnd: dateRange.endDate,
  };
}

export const getEvent = cache(async function getEvent(id: string) {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) return null;
  for (const provider of providers) {
    const event = await provider.getEvent(id);
    if (event) return event;
  }
  return null;
});

export async function getMoreEventsAtVenue(event: Event) {
  if (!event.venueId) return [];
  const provider = providers.find((candidate) => candidate.name === event.source);
  if (!provider) return [];
  const cacheBucket = new Date(Math.floor(Date.now() / CACHE_WINDOW_MS) * CACHE_WINDOW_MS);
  const upcoming = await provider.getVenueEvents(
    event.venueId,
    toTicketmasterDateTime(cacheBucket),
  );
  return dedupeEvents(upcoming)
    .filter((candidate) => candidate.id !== event.id)
    .sort(
      (first, second) =>
        new Date(first.startDateTime).getTime() - new Date(second.startDateTime).getTime(),
    )
    .slice(0, 4);
}

export function fullAddress(event: Event) {
  return [
    event.address.line1,
    event.address.line2,
    event.city,
    event.address.stateCode,
    event.address.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

export function googleMapsUrl(event: Event) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress(event))}`;
}
