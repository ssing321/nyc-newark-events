import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryBadge } from "@/components/category-badge";
import { EventCard, formatPrice } from "@/components/event-card";
import { EventImage } from "@/components/event-image";
import { ErrorState } from "@/components/error-state";
import { SaveButton } from "@/components/save-button";
import { ShareButton } from "@/components/share-button";
import { formatEventDateLong, formatEventDay, formatEventTime } from "@/lib/dates";
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
    return <main className="detail-main" id="main-content"><div className="shell"><ErrorState /></div></main>;
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
  const date = formatEventDay(event.startDateTime);

  return (
    <main className="detail-main" id="main-content">
      <div className="shell">
        <div className="detail-utility-row">
          <Link className="back-link focus-ring" href="/">← Back to SCENE</Link>
          <p>LISTING / {event.source.toUpperCase()}</p>
        </div>
        <article className="detail-article">
          <div className="detail-hero">
            <div className="detail-image-wrap">
              <EventImage
                src={event.imageUrl}
                alt={`${event.name} at ${event.venueName}`}
                category={event.category}
                sizes="(max-width: 900px) 100vw, 58vw"
                eager
              />
            </div>
            <div className="detail-intro">
              <div className="detail-kicker">
                <CategoryBadge category={event.category} />
                <span>{event.address.stateCode === "NJ" ? "NORTH JERSEY" : "NYC"}</span>
              </div>
              <p className="detail-date-block"><span>{date.weekday}</span><b>{date.day}</b><em>{date.month}</em></p>
              <h1>{event.name}</h1>
              <p className="detail-when">
                {formatEventDateLong(event.startDateTime)} / {event.timeTBD ? "TIME TBA" : formatEventTime(event.startDateTime)}
              </p>
              <div className="detail-actions">
                <a className="button button-yellow focus-ring" href={event.ticketUrl} target="_blank" rel="noopener noreferrer sponsored">
                  Get tickets <span aria-hidden="true">↗</span>
                </a>
                <SaveButton event={event} />
                <ShareButton
                  title={`${event.name} | SCENE`}
                  text={`${event.name} at ${event.venueName} on ${formatEventDateLong(event.startDateTime)}.`}
                />
              </div>
              <p className="purchase-note">Purchase happens with the original provider. SCENE does not sell tickets.</p>
            </div>
          </div>

          <div className="detail-content-grid">
            <section className="detail-section" aria-labelledby="about-event">
              <p className="section-index">THE LOWDOWN</p>
              <h2 id="about-event">WHAT TO KNOW</h2>
              <p className="event-description">{event.description}</p>
              <p className="source-note">Listing information provided by {event.source}.</p>
            </section>

            <aside className="event-facts" aria-label="Event details">
              <dl>
                <div>
                  <dt>WHEN</dt>
                  <dd>{formatEventDateLong(event.startDateTime)}<br />{event.timeTBD ? "Time TBA" : formatEventTime(event.startDateTime)}</dd>
                </div>
                <div>
                  <dt>WHERE</dt>
                  <dd>{event.venueName}<br />{event.city}, {event.address.stateCode}</dd>
                </div>
                <div>
                  <dt>MAP</dt>
                  <dd><a className="text-link focus-ring" href={googleMapsUrl(event)} target="_blank" rel="noopener noreferrer">{address} <span aria-hidden="true">↗</span></a></dd>
                </div>
                <div>
                  <dt>PRICE</dt>
                  <dd>{price ?? "Current pricing at provider"}</dd>
                </div>
              </dl>
            </aside>
          </div>
        </article>

        {venueEvents.length ? (
          <section className="venue-events" aria-labelledby="venue-events-heading">
            <div className="section-masthead">
              <div>
                <p className="section-index">STAY IN THE ROOM</p>
                <h2 id="venue-events-heading">MORE AT<br />{event.venueName}</h2>
              </div>
              <p>More upcoming listings at the same venue.</p>
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
