export const EVENT_CATEGORIES = [
  "Sports",
  "Music",
  "Arts & Theatre",
  "Comedy",
  "Family",
  "Other",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];
export type EventArea = "both" | "new-york" | "newark";
export type DateRange = "today" | "weekend" | "week" | "month" | "custom";
export type DiscoveryMode = "tonight" | "weekend" | "under-50" | "surprise";

export interface EventAddress {
  line1?: string;
  line2?: string;
  postalCode?: string;
  stateCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface Event {
  id: string;
  name: string;
  category: EventCategory;
  startDateTime: string;
  localDate?: string;
  localTime?: string;
  dateTBD: boolean;
  timeTBD: boolean;
  venueId?: string;
  venueName: string;
  address: EventAddress;
  city: string;
  imageUrl?: string;
  description: string;
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  ticketUrl: string;
  source: "Ticketmaster";
}

export interface ProviderSearchInput {
  area: EventArea;
  startDateTime: string;
  endDateTime: string;
  category: EventCategory | "All";
  query?: string;
  page: number;
  size: number;
}

export interface ProviderSearchResult {
  events: Event[];
  hasMore: boolean;
  truncated: boolean;
}

export interface EventProvider {
  readonly name: Event["source"];
  searchEvents(input: ProviderSearchInput): Promise<ProviderSearchResult>;
  getEvent(id: string): Promise<Event | null>;
  getVenueEvents(venueId: string, startDateTime: string): Promise<Event[]>;
}

export interface EventFilters {
  area: EventArea;
  category: EventCategory | "All";
  range: DateRange;
  mode?: DiscoveryMode;
  query: string;
  start?: string;
  end?: string;
  page: number;
}

export interface EventSearchResult {
  events: Event[];
  total: number;
  totalIsExact: boolean;
  shown: number;
  hasMore: boolean;
  filters: EventFilters;
  rangeStart: string;
  rangeEnd: string;
}
