import type { DateRange, EventArea, EventCategory, EventFilters } from "./types";

type SearchParamValue = string | string[] | undefined;
export type RawSearchParams = Record<string, SearchParamValue>;

const AREAS = new Set<EventArea>(["both", "new-york", "newark"]);
const RANGES = new Set<DateRange>(["today", "weekend", "week", "month", "custom"]);
const CATEGORY_BY_SLUG: Record<string, EventCategory | "All"> = {
  all: "All",
  sports: "Sports",
  music: "Music",
  "arts-theatre": "Arts & Theatre",
  comedy: "Comedy",
  family: "Family",
  other: "Other",
};

export const CATEGORY_SLUGS: Record<EventCategory | "All", string> = {
  All: "all",
  Sports: "sports",
  Music: "music",
  "Arts & Theatre": "arts-theatre",
  Comedy: "comedy",
  Family: "family",
  Other: "other",
};

function one(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function cleanQuery(value: SearchParamValue) {
  return (one(value) ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function date(value: SearchParamValue) {
  const candidate = one(value);
  return candidate && /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : undefined;
}

export function parseEventFilters(params: RawSearchParams): EventFilters {
  const areaValue = one(params.area) as EventArea;
  const rangeValue = one(params.range) as DateRange;
  const category = CATEGORY_BY_SLUG[one(params.category) ?? "all"] ?? "All";
  const parsedPage = Number.parseInt(one(params.page) ?? "1", 10);

  return {
    area: AREAS.has(areaValue) ? areaValue : "both",
    category,
    range: RANGES.has(rangeValue) ? rangeValue : "month",
    query: cleanQuery(params.q),
    start: date(params.start),
    end: date(params.end),
    page: Number.isFinite(parsedPage) ? Math.min(Math.max(parsedPage, 1), 84) : 1,
  };
}

export function searchParamsToRecord(params: URLSearchParams): RawSearchParams {
  return Object.fromEntries(params.entries());
}
