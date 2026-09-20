import { eventLocalDate, formatEventDate } from "@/lib/dates";
import type { DiscoveryMode, Event, EventArea, EventCategory } from "./types";

export const NOTABLE_VENUES: Record<string, number> = {
  "madison square garden": 5,
  "barclays center": 5,
  "radio city music hall": 4,
  "beacon theatre": 4,
  "yankee stadium": 5,
  "citi field": 5,
  "lincoln center": 4,
  "prudential center": 5,
  "new jersey performing arts center": 4,
  njpac: 4,
  "metlife stadium": 5,
};

export type RecommendationMode = "top" | DiscoveryMode | "plan";

export interface RecommendationOptions {
  limit?: number;
  mode?: RecommendationMode;
  area?: EventArea;
  category?: EventCategory | "All";
  budgetMax?: number;
  date?: string;
}

function stableHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function venueWeight(venueName: string) {
  const normalized = venueName.toLocaleLowerCase("en-US");
  return Object.entries(NOTABLE_VENUES).find(([name]) => normalized.includes(name))?.[1] ?? 0;
}

function recommendationScore(event: Event, options: RecommendationOptions) {
  const hoursAway = Math.max(0, new Date(event.startDateTime).getTime() - Date.now()) / 3_600_000;
  let score = Math.max(0, 5 - hoursAway / 48);
  score += venueWeight(event.venueName);
  if (event.imageUrl) score += 1;
  if (event.description.length > 100) score += 0.75;
  if (event.priceMin !== undefined) {
    if (event.priceMin <= 50) score += 2;
    else if (event.priceMin <= 100) score += 1;
  }
  if (options.category && options.category !== "All" && event.category === options.category) score += 4;
  if (options.area === "new-york" && event.address.stateCode === "NY") score += 2;
  if (options.area === "newark" && event.address.stateCode === "NJ") score += 2;
  if (options.date && eventLocalDate(event.startDateTime) === options.date) score += 4;
  if (options.mode === "under-50" && event.priceMin !== undefined && event.priceMin <= 50) score += 5;
  if (options.mode === "tonight") score += Math.max(0, 5 - hoursAway / 4);
  if (options.mode === "surprise") score += (stableHash(event.id) % 17) / 10;
  return score;
}

function eligible(event: Event, options: RecommendationOptions) {
  if (options.budgetMax !== undefined) {
    if (event.priceMin === undefined || event.priceMin > options.budgetMax) return false;
  }
  if (options.category && options.category !== "All" && event.category !== options.category) {
    return false;
  }
  if (options.area === "new-york" && event.address.stateCode !== "NY") return false;
  if (options.area === "newark" && event.address.stateCode !== "NJ") return false;
  if (options.date && eventLocalDate(event.startDateTime) !== options.date) return false;
  return true;
}

export function recommendEvents(events: Event[], options: RecommendationOptions = {}) {
  const limit = options.limit ?? 4;
  const ranked = events
    .filter((event) => eligible(event, options))
    .map((event) => ({ event, score: recommendationScore(event, options) }))
    .sort((first, second) => second.score - first.score || first.event.id.localeCompare(second.event.id));

  const selected: Event[] = [];
  const venues = new Set<string>();
  const names = new Set<string>();
  const categoryCounts = new Map<EventCategory, number>();

  for (const { event } of ranked) {
    const name = event.name.toLocaleLowerCase("en-US");
    const venue = event.venueName.toLocaleLowerCase("en-US");
    if (names.has(name) || venues.has(venue)) continue;
    if ((categoryCounts.get(event.category) ?? 0) >= 2) continue;
    selected.push(event);
    names.add(name);
    venues.add(venue);
    categoryCounts.set(event.category, (categoryCounts.get(event.category) ?? 0) + 1);
    if (selected.length === limit) return selected;
  }

  for (const { event } of ranked) {
    if (selected.some((candidate) => candidate.id === event.id)) continue;
    selected.push(event);
    if (selected.length === limit) break;
  }
  return selected;
}

export function editorialLabel(event: Event, mode: RecommendationMode = "top") {
  if (mode === "under-50" && event.priceMin !== undefined && event.priceMin <= 50) return "UNDER $50";
  if (mode === "tonight") return "TONIGHT";
  if (mode === "weekend") return "THIS WEEKEND";
  if (mode === "surprise") return "SCENE SELECT";
  return venueWeight(event.venueName) > 0 ? "LANDMARK VENUE" : "TOP PICK";
}

export function recommendationExplanation(
  event: Event,
  options: { budgetMax?: number; area: EventArea; category: EventCategory | "All" },
) {
  const area = event.address.stateCode === "NJ" ? "North Jersey" : event.city;
  const category = event.category === "Arts & Theatre" ? "Arts and theatre" : event.category;
  const pieces = [`${category} in ${area} on ${formatEventDate(event.startDateTime)}`];
  if (options.budgetMax !== undefined && event.priceMin !== undefined) {
    pieces.push(`with listed prices starting within your $${options.budgetMax} budget`);
  } else if (venueWeight(event.venueName) > 0) {
    pieces.push(`at one of the region’s standout venues`);
  } else {
    pieces.push(`matched to the night you picked`);
  }
  return `${pieces.join(" ")}.`;
}
