import "server-only";

import { unstable_cache } from "next/cache";
import { toTicketmasterDateTime } from "@/lib/dates";
import { EventProviderError } from "../errors";
import { normalizeTicketmasterEvent, type TicketmasterEvent } from "../normalize";
import type {
  Event,
  EventArea,
  EventCategory,
  EventProvider,
  ProviderSearchInput,
} from "../types";

const API_ROOT = "https://app.ticketmaster.com/discovery/v2";
const CACHE_SECONDS = 15 * 60;
const MAX_DISCOVERY_RESULTS = 1_000;

const DAY_MS = 24 * 60 * 60 * 1_000;

const REGIONS: Record<
  Exclude<EventArea, "both">,
  { latlong: string; radius: string; stateCode: string }
> = {
  "new-york": { latlong: "40.7128,-74.0060", radius: "14", stateCode: "NY" },
  newark: { latlong: "40.7357,-74.1724", radius: "12", stateCode: "NJ" },
};

const NYC_CITIES = new Set([
  "new york",
  "brooklyn",
  "bronx",
  "queens",
  "flushing",
  "staten island",
]);

const NORTH_JERSEY_CITIES = new Set([
  "newark",
  "east rutherford",
  "harrison",
  "jersey city",
  "hoboken",
  "montclair",
  "elizabeth",
  "union",
  "rutherford",
  "secaucus",
  "bloomfield",
  "clifton",
  "hackensack",
  "englewood",
  "south orange",
  "west orange",
]);

interface TicketmasterResponse {
  _embedded?: { events?: TicketmasterEvent[] };
  page?: {
    size?: number;
    totalElements?: number;
    totalPages?: number;
    number?: number;
  };
}

function apiKey() {
  const key = process.env.TICKETMASTER_API_KEY?.trim();
  if (!key) {
    throw new EventProviderError(
      "Ticketmaster is not configured. Add TICKETMASTER_API_KEY to the server environment.",
      "configuration",
    );
  }
  return key;
}

async function ticketmasterFetch<T>(path: string, params: URLSearchParams): Promise<T | null> {
  params.set("apikey", apiKey());
  const response = await fetch(`${API_ROOT}${path}?${params.toString()}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    console.error(`Ticketmaster ${path.startsWith("/events/") ? "detail" : "search"} request failed with status ${response.status}.`);
    throw new EventProviderError("The event provider is temporarily unavailable.", "upstream");
  }

  try {
    return (await response.json()) as T;
  } catch {
    console.error("Ticketmaster returned a non-JSON response.");
    throw new EventProviderError("The event provider returned an unexpected response.", "invalid-response");
  }
}

function providerClassification(category: EventCategory | "All") {
  return category === "All" || category === "Other" ? undefined : category;
}

interface CachedRegionPage {
  events: Event[];
  hasMore: boolean;
  truncated: boolean;
  pageCount: number;
}

const getCachedRegionPage = unstable_cache(
  async (
    region: Exclude<EventArea, "both">,
    startDateTime: string,
    endDateTime: string,
    category: EventCategory | "All",
    query: string,
    page: number,
    size: number,
  ): Promise<CachedRegionPage> => {
    const location = REGIONS[region];
    const params = new URLSearchParams({
      latlong: location.latlong,
      radius: location.radius,
      unit: "miles",
      countryCode: "US",
      stateCode: location.stateCode,
      startDateTime,
      endDateTime,
      sort: "date,asc",
      size: String(size),
      page: String(page),
      locale: "*",
    });
    const classification = providerClassification(category);
    if (classification) params.set("classificationName", classification);
    if (query) params.set("keyword", query);
    if (process.env.TICKETMASTER_REQUEST_LOG === "1") {
      console.info(`[Ticketmaster] search region=${region} page=${page} size=${size} category=${category} query=${query ? "yes" : "no"}`);
    }
    const response = await ticketmasterFetch<TicketmasterResponse>("/events.json", params);
    const events = (response?._embedded?.events ?? [])
      .map(normalizeTicketmasterEvent)
      .filter((event): event is Event => Boolean(event))
      .filter((event) => isInCoverage(event, region));
    const totalElements = response?.page?.totalElements ?? events.length;
    const totalPages = response?.page?.totalPages ?? (events.length ? page + 1 : page);
    const accessiblePages = Math.min(totalPages, Math.ceil(MAX_DISCOVERY_RESULTS / size));
    if (process.env.TICKETMASTER_REQUEST_LOG === "1") {
      console.info(
        `[Ticketmaster] result region=${region} page=${page} providerTotal=${totalElements} providerPages=${totalPages} normalized=${events.length}`,
      );
    }
    return {
      events,
      hasMore: page + 1 < accessiblePages,
      truncated: totalElements > MAX_DISCOVERY_RESULTS,
      pageCount: accessiblePages,
    };
  },
  ["ticketmaster-region-page-v5"],
  { revalidate: CACHE_SECONDS },
);

const getCachedEvent = unstable_cache(
  async (id: string) => {
    if (process.env.TICKETMASTER_REQUEST_LOG === "1") console.info("[Ticketmaster] event detail");
    const response = await ticketmasterFetch<TicketmasterEvent>(
      `/events/${encodeURIComponent(id)}.json`,
      new URLSearchParams({ locale: "*" }),
    );
    return response ? normalizeTicketmasterEvent(response) : null;
  },
  ["ticketmaster-event-v2"],
  { revalidate: CACHE_SECONDS },
);

const getCachedVenueEvents = unstable_cache(
  async (venueId: string, startDateTime: string) => {
    if (process.env.TICKETMASTER_REQUEST_LOG === "1") console.info("[Ticketmaster] venue events");
    const end = new Date(new Date(startDateTime).getTime() + 90 * 864e5);
    const response = await ticketmasterFetch<TicketmasterResponse>(
      "/events.json",
      new URLSearchParams({
        venueId,
        startDateTime,
        endDateTime: toTicketmasterDateTime(end),
        sort: "date,asc",
        size: "12",
        locale: "*",
      }),
    );
    return (response?._embedded?.events ?? [])
      .map(normalizeTicketmasterEvent)
      .filter((event): event is Event => Boolean(event));
  },
  ["ticketmaster-venue-events-v2"],
  { revalidate: CACHE_SECONDS },
);

function isInCoverage(event: Event, region: Exclude<EventArea, "both">) {
  const city = event.city.toLocaleLowerCase("en-US");
  if (region === "new-york") {
    return event.address.stateCode === "NY" && NYC_CITIES.has(city);
  }
  return event.address.stateCode === "NJ" && NORTH_JERSEY_CITIES.has(city);
}

function regionList(area: EventArea) {
  return area === "both" ? (["new-york", "newark"] as const) : [area];
}

function searchWindowSize(input: ProviderSearchInput) {
  const fullRange =
    new Date(input.endDateTime).getTime() - new Date(input.startDateTime).getTime();
  if (input.query) {
    return fullRange;
  }
  if (input.category === "All" || input.category === "Other") return DAY_MS;
  if (input.category === "Arts & Theatre") return 3 * DAY_MS;
  if (input.category === "Music") return 7 * DAY_MS;
  return fullRange;
}

export class TicketmasterProvider implements EventProvider {
  readonly name = "Ticketmaster" as const;

  async searchEvents(input: ProviderSearchInput) {
    const regions = regionList(input.area);
    const requestedEnd = new Date(input.endDateTime).getTime();
    const windowSize = Math.max(searchWindowSize(input), 1);
    let windowStart = new Date(input.startDateTime).getTime();
    let remainingPage = input.page;
    let earlierWindowTruncated = false;

    while (windowStart < requestedEnd) {
      const windowEnd = Math.min(windowStart + windowSize, requestedEnd);
      const windowStartIso = toTicketmasterDateTime(new Date(windowStart));
      const windowEndIso = toTicketmasterDateTime(new Date(windowEnd));
      const argsFor = (region: Exclude<EventArea, "both">) =>
        [
          region,
          windowStartIso,
          windowEndIso,
          input.category,
          input.query ?? "",
        ] as const;
      const firstPages = await Promise.all(
        regions.map((region) => getCachedRegionPage(...argsFor(region), 0, input.size)),
      );
      earlierWindowTruncated ||= firstPages.some((page) => page.truncated);
      const pagesInWindow = Math.max(1, ...firstPages.map((page) => page.pageCount));

      if (remainingPage < pagesInWindow) {
        const pages = await Promise.all(
          regions.map((region, index) => {
            const firstPage = firstPages[index];
            if (remainingPage === 0) return firstPage;
            if (remainingPage >= firstPage.pageCount) {
              return { ...firstPage, events: [], hasMore: false };
            }
            return getCachedRegionPage(
              ...argsFor(region),
              remainingPage,
              input.size,
            );
          }),
        );
        const hasLaterWindow = windowEnd < requestedEnd;
        return {
          events: pages.flatMap((page) => page.events),
          hasMore: remainingPage + 1 < pagesInWindow || hasLaterWindow,
          truncated:
            earlierWindowTruncated || pages.some((page) => page.truncated),
        };
      }

      remainingPage -= pagesInWindow;
      windowStart = windowEnd;
    }

    return { events: [], hasMore: false, truncated: earlierWindowTruncated };
  }

  async getEvent(id: string) {
    return getCachedEvent(id);
  }

  async getVenueEvents(venueId: string, startDateTime: string) {
    return getCachedVenueEvents(venueId, startDateTime);
  }
}

export const ticketmasterProvider = new TicketmasterProvider();
