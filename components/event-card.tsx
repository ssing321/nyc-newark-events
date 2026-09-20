import Link from "next/link";
import { formatEventDate, formatEventTime } from "@/lib/dates";
import type { Event } from "@/lib/events/types";
import { CategoryBadge } from "./category-badge";
import { EventImage } from "./event-image";

export function formatPrice(event: Event) {
  if (event.priceMin === undefined && event.priceMax === undefined) return null;
  const currency = event.currency ?? "USD";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  if (event.priceMin !== undefined && event.priceMax !== undefined) {
    if (event.priceMin === event.priceMax) return formatter.format(event.priceMin);
    return `${formatter.format(event.priceMin)}–${formatter.format(event.priceMax)}`;
  }
  return event.priceMin !== undefined
    ? `From ${formatter.format(event.priceMin)}`
    : `Up to ${formatter.format(event.priceMax as number)}`;
}

export function EventCard({ event, priority = false }: { event: Event; priority?: boolean }) {
  const price = formatPrice(event);
  return (
    <article className="event-card">
      <Link className="card-image-wrap focus-ring" href={`/events/${encodeURIComponent(event.id)}`}>
        <EventImage
          src={event.imageUrl}
          alt={`${event.name} at ${event.venueName}`}
          category={event.category}
          sizes="(max-width: 680px) 100vw, (max-width: 1080px) 50vw, 33vw"
          priority={priority}
        />
        <span className="card-badge"><CategoryBadge category={event.category} /></span>
      </Link>
      <div className="card-body">
        <p className="card-date">
          {formatEventDate(event.startDateTime)}
          <span aria-hidden="true"> · </span>
          {event.timeTBD ? "Time TBA" : formatEventTime(event.startDateTime)}
        </p>
        <h3 className="card-title">
          <Link className="focus-ring" href={`/events/${encodeURIComponent(event.id)}`}>{event.name}</Link>
        </h3>
        <p className="card-venue">{event.venueName}</p>
        <p className="card-city">{event.city}, {event.address.stateCode}</p>
        <div className="card-footer">
          <span className="card-price">{price ?? "See ticket prices"}</span>
          <a
            className="ticket-link focus-ring"
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            aria-label={`Get tickets for ${event.name} from the original provider (opens in a new tab)`}
          >
            Get tickets <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </article>
  );
}
