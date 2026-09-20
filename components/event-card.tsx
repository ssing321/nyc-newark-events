import Link from "next/link";
import { formatEventDay, formatEventTime } from "@/lib/dates";
import type { Event } from "@/lib/events/types";
import { CategoryBadge } from "./category-badge";
import { EventImage } from "./event-image";
import { SaveButton } from "./save-button";

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

interface EventCardProps {
  event: Event;
  priority?: boolean;
  label?: string;
  featured?: boolean;
}

export function EventCard({
  event,
  priority = false,
  label,
  featured = false,
}: EventCardProps) {
  const price = formatPrice(event);
  const date = formatEventDay(event.startDateTime);
  const area = event.address.stateCode === "NJ" ? "NORTH JERSEY" : "NYC";
  const eventHref = `/events/${encodeURIComponent(event.id)}`;
  return (
    <article className={`event-card${featured ? " event-card--featured" : ""}`}>
      <div className="card-media">
        <Link className="card-image-wrap focus-ring" href={eventHref}>
          <EventImage
            src={event.imageUrl}
            alt={`${event.name} at ${event.venueName}`}
            category={event.category}
            sizes="(max-width: 680px) 100vw, (max-width: 1080px) 50vw, 33vw"
            priority={priority}
          />
        </Link>
        <div className="card-save"><SaveButton event={event} compact /></div>
        {label ? <span className="editorial-stamp">{label}</span> : null}
      </div>
      <div className="card-body">
        <div className="card-meta">
          <time dateTime={event.startDateTime} className="card-date">
            <span>{date.weekday}</span> {date.day} {date.month}
            <small>{event.timeTBD ? "TBA" : formatEventTime(event.startDateTime)}</small>
          </time>
          <CategoryBadge category={event.category} />
        </div>
        <h3 className="card-title">
          <Link className="focus-ring" href={eventHref}>{event.name}</Link>
        </h3>
        <p className="card-venue">{event.venueName}</p>
        <p className="card-city">{event.city} / {area}</p>
        <div className="card-footer">
          <span className="card-price">{price ? (price.startsWith("From") ? price : `FROM ${price}`) : "PRICE AT PROVIDER"}</span>
          <Link className="card-detail-link focus-ring" href={eventHref} aria-label={`View ${event.name} details`}>
            <span aria-hidden="true">→</span>
          </Link>
          <a
            className="ticket-link focus-ring"
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            aria-label={`Get tickets for ${event.name} from the original provider (opens in a new tab)`}
          >
            Tickets <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </article>
  );
}
