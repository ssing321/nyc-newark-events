import { formatEventDateLong, newYorkLocalDateTimeToUtc } from "@/lib/dates";
import type { Event, EventCategory } from "./types";

export interface TicketmasterImage {
  url?: string;
  width?: number;
  height?: number;
  ratio?: string;
}

export interface TicketmasterEvent {
  id?: string;
  name?: string;
  url?: string;
  info?: string;
  pleaseNote?: string;
  images?: TicketmasterImage[];
  dates?: {
    start?: {
      dateTime?: string;
      localDate?: string;
      localTime?: string;
      dateTBD?: boolean;
      timeTBD?: boolean;
    };
  };
  classifications?: Array<{
    segment?: { name?: string };
    genre?: { name?: string };
    subGenre?: { name?: string };
    type?: { name?: string };
    subType?: { name?: string };
  }>;
  priceRanges?: Array<{ min?: number; max?: number; currency?: string }>;
  _embedded?: {
    venues?: Array<{
      id?: string;
      name?: string;
      city?: { name?: string };
      state?: { stateCode?: string; name?: string };
      postalCode?: string;
      address?: { line1?: string; line2?: string };
      location?: { latitude?: string; longitude?: string };
    }>;
  };
}

function categoryFor(event: TicketmasterEvent): EventCategory {
  const classification = event.classifications?.[0];
  const labels = [
    classification?.segment?.name,
    classification?.genre?.name,
    classification?.subGenre?.name,
    classification?.type?.name,
    classification?.subType?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("en-US");

  if (labels.includes("comedy")) return "Comedy";
  if (labels.includes("family") || labels.includes("children")) return "Family";
  if (labels.includes("sport")) return "Sports";
  if (labels.includes("music")) return "Music";
  if (labels.includes("art") || labels.includes("theatre") || labels.includes("theater")) {
    return "Arts & Theatre";
  }
  return "Other";
}

function bestImage(images: TicketmasterImage[] = []) {
  return images
    .filter((image) => image.url?.startsWith("https://") && image.ratio === "16_9")
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url;
}

function cleanDescription(value?: string) {
  return value?.replace(/\s+/g, " ").trim();
}

export function normalizeTicketmasterEvent(raw: TicketmasterEvent): Event | null {
  const venue = raw._embedded?.venues?.[0];
  const start = raw.dates?.start;
  const fallbackDate = start?.localDate
    ? newYorkLocalDateTimeToUtc(start.localDate, start.localTime)
    : null;
  const startDateTime = start?.dateTime ?? fallbackDate?.toISOString();

  if (!raw.id || !raw.name || !raw.url || !startDateTime || !venue?.name || !venue.city?.name) {
    return null;
  }

  const category = categoryFor(raw);
  const priceRanges = raw.priceRanges?.filter(
    (range) => Number.isFinite(range.min) || Number.isFinite(range.max),
  );
  const mins = priceRanges?.flatMap((range) =>
    Number.isFinite(range.min) ? [range.min as number] : [],
  );
  const maxes = priceRanges?.flatMap((range) =>
    Number.isFinite(range.max) ? [range.max as number] : [],
  );
  const description = cleanDescription(raw.info) || cleanDescription(raw.pleaseNote);
  const event: Event = {
    id: raw.id,
    name: raw.name.trim(),
    category,
    startDateTime,
    localDate: start?.localDate,
    localTime: start?.localTime,
    dateTBD: Boolean(start?.dateTBD),
    timeTBD: Boolean(start?.timeTBD),
    venueId: venue.id,
    venueName: venue.name.trim(),
    address: {
      line1: venue.address?.line1,
      line2: venue.address?.line2,
      postalCode: venue.postalCode,
      stateCode: venue.state?.stateCode,
      latitude: venue.location?.latitude ? Number(venue.location.latitude) : undefined,
      longitude: venue.location?.longitude ? Number(venue.location.longitude) : undefined,
    },
    city: venue.city.name.trim(),
    imageUrl: bestImage(raw.images),
    description: description ?? "",
    priceMin: mins?.length ? Math.min(...mins) : undefined,
    priceMax: maxes?.length ? Math.max(...maxes) : undefined,
    currency: priceRanges?.[0]?.currency,
    ticketUrl: raw.url,
    source: "Ticketmaster",
  };

  if (!event.description) {
    event.description = `Catch this ${category} event at ${event.venueName} in ${event.city} on ${formatEventDateLong(startDateTime)}.`;
  }
  return event;
}
