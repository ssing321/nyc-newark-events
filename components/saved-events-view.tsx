"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EventCard } from "./event-card";
import {
  readSavedEvents,
  SAVED_EVENTS_CHANGED,
  SAVED_EVENTS_KEY,
  type SavedEvent,
} from "@/lib/saved-events";

export function SavedEventsView() {
  const [saved, setSaved] = useState<SavedEvent[] | null>(null);

  useEffect(() => {
    const sync = () => setSaved(readSavedEvents());
    sync();
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === SAVED_EVENTS_KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(SAVED_EVENTS_CHANGED, sync);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SAVED_EVENTS_CHANGED, sync);
    };
  }, []);

  const ordered = useMemo(
    () =>
      [...(saved ?? [])].sort(
        (first, second) =>
          new Date(first.event.startDateTime).getTime() - new Date(second.event.startDateTime).getTime(),
      ),
    [saved],
  );

  if (saved === null) {
    return <div className="saved-loading" aria-live="polite">Loading your saved SCENE…</div>;
  }

  if (!saved.length) {
    return (
      <div className="empty-state saved-empty">
        <p className="state-code">NO SAVES YET</p>
        <h2>Build a shortlist for later.</h2>
        <p>Use the diamond on any event. Your saves stay on this device—no account needed.</p>
        <Link className="button button-primary focus-ring" href="/#discover">Find your next move</Link>
      </div>
    );
  }

  return (
    <div>
      <p className="saved-note">
        Saved on this device. Listings and ticket availability can change at the provider.
      </p>
      <div className="event-grid saved-grid">
        {ordered.map(({ event }) => (
          <EventCard event={event} key={event.id} />
        ))}
      </div>
    </div>
  );
}
