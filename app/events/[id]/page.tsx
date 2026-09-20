import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryBadge } from "@/components/category-badge";
import { EventCard, formatPrice } from "@/components/event-card";
import { EventImage } from "@/components/event-image";
import { ErrorState } from "@/components/error-state";
import { formatEventDateLong, formatEventTime } from "@/lib/dates";
import { fullAddress, getEvent, getMoreEventsAtVenue, googleMapsUrl } from "@/lib/events/service";
import type { Event } from "@/lib/events/types";

export async function generateMetadata({ params }: PageProps<"/events/[id]">): Promise<Metadata> {
  try {
    const { id } = await params;
    const event = await getEvent(id);
    if (!event) return { title: "Event not found" };
    return {
      title: event.name,
      description: `${formatEventDateLong(event.startDateTime)} at ${event.venueName} in ${event.city}.`,
    };
  } catch {
    return { title: "Event details" };
  }
}

export default async function EventDetailPage({ params }: PageProps<"/events/[id]">) {
  const { id } = await params;
  let event;
  try {
    event = await getEvent(id);
  } catch (error) {
    console.error("Unable to render event details:", error);
    return <main className="detail-main"><div className="shell"><ErrorState /></div></main>;
  }
  if (!event) notFound();

  let venueEvents: Event[] = [];
  try {
    venueEvents = await getMoreEventsAtVenue(event);
  } catch (error) {
    console.error("Unable to load more events at venue:", error);
  }
  const price = formatPrice(event);
  const address = fullAddress(event);

  return (
    <main className="detail-main">
      <div className="shell">
        <Link className="back-link focus-ring" href="/">← Back to all events</Link>
        <article>
          <div className="detail-hero">
            <div className="detail-image-wrap">
              <EventImage
                src={event.imageUrl}
                alt={`${event.name} at ${event.venueName}`}
                category={event.category}
                sizes="(max-width: 900px) 100vw, 58vw"
                priority
              />
            </div>
            <div className="detail-intro">
              <CategoryBadge category={event.category} />
              <h1>{event.name}</h1>
              <p className="detail-date">{formatEventDateLong(event.startDateTime)}</p>
              <p className="detail-time">
                {event.timeTBD ? "Time to be announced" : formatEventTime(event.startDateTime)}
              </p>
              <a
                className="button button-accent detail-ticket focus-ring"
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
              >
                Get tickets from provider <span aria-hidden="true">↗</span>
              </a>
              <p className="purchase-note">You’ll complete your purchase with the original ticket provider.</p>
            </div>
          </div>

          <div className="detail-content-grid">
            <section className="detail-section" aria-labelledby="about-event">
              <p className="eyebrow">About the event</p>
              <h2 id="about-event">What to know</h2>
              <p className="event-description">{event.description}</p>
              <p className="source-note">Event information provided by {event.source}.</p>
            </section>

            <aside className="event-facts" aria-label="Event details">
              <dl>
                <div>
                  <dt>When</dt>
                  <dd>{formatEventDateLong(event.startDateTime)}<br />
                    {event.timeTBD ? "Time TBA" : formatEventTime(event.startDateTime)}
                  </dd>
                </div>
                <div>
                  <dt>Venue</dt>
                  <dd>{event.venueName}</dd>
                </div>
                <div>
                  <dt>Address</dt>
                  <dd>
                    <a className="text-link focus-ring" href={googleMapsUrl(event)} target="_blank" rel="noopener noreferrer">
                      {address} <span aria-hidden="true">↗</span>
                    </a>
                  </dd>
                </div>
                <div>
                  <dt>Price</dt>
                  <dd>{price ?? "See Ticketmaster for current pricing"}</dd>
                </div>
              </dl>
            </aside>
          </div>
        </article>

        {venueEvents.length ? (
          <section className="venue-events" aria-labelledby="venue-events-heading">
            <div className="section-heading">
              <p className="eyebrow">Keep the night going</p>
              <h2 id="venue-events-heading">More at {event.venueName}</h2>
            </div>
            <div className="event-grid venue-grid">
              {venueEvents.map((venueEvent) => <EventCard event={venueEvent} key={venueEvent.id} />)}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
