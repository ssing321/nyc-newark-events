"use client";

import { useEffect, useState } from "react";
import {
  isEventSaved,
  SAVED_EVENTS_CHANGED,
  SAVED_EVENTS_KEY,
  toggleSavedEvent,
} from "@/lib/saved-events";
import type { Event } from "@/lib/events/types";

export function SaveButton({ event, compact = false }: { event: Event; compact?: boolean }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(isEventSaved(event.id));
    sync();
    const onStorage = (storageEvent: StorageEvent) => {
      if (!storageEvent.key || storageEvent.key === SAVED_EVENTS_KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(SAVED_EVENTS_CHANGED, sync);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SAVED_EVENTS_CHANGED, sync);
    };
  }, [event.id]);

  return (
    <button
      className={`save-button focus-ring${compact ? " save-button--compact" : ""}`}
      type="button"
      aria-pressed={saved}
      aria-label={`${saved ? "Remove" : "Save"} ${event.name}${saved ? " from" : " to"} saved events`}
      onClick={() => setSaved(toggleSavedEvent(event))}
    >
      <span className="save-icon" aria-hidden="true">{saved ? "◆" : "◇"}</span>
      <span>{saved ? "Saved" : "Save"}</span>
    </button>
  );
}
