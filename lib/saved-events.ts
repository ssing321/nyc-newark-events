import type { Event as SceneEvent } from "./events/types";

export const SAVED_EVENTS_KEY = "scene:saved-events:v1";
export const SAVED_EVENTS_CHANGED = "scene:saved-events-changed";

export interface SavedEvent {
  event: SceneEvent;
  savedAt: string;
}

function isEvent(value: unknown): value is SceneEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<SceneEvent>;
  return Boolean(
    event.id &&
      event.name &&
      event.startDateTime &&
      event.venueName &&
      event.city &&
      event.ticketUrl &&
      event.source === "Ticketmaster",
  );
}

export function readSavedEvents(): SavedEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SAVED_EVENTS_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SavedEvent =>
        Boolean(
          item &&
            typeof item === "object" &&
            isEvent((item as SavedEvent).event) &&
            typeof (item as SavedEvent).savedAt === "string",
        ),
    );
  } catch {
    return [];
  }
}

export function writeSavedEvents(events: SavedEvent[]) {
  window.localStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(events));
  window.dispatchEvent(new Event(SAVED_EVENTS_CHANGED));
}

export function isEventSaved(id: string) {
  return readSavedEvents().some((item) => item.event.id === id);
}

export function toggleSavedEvent(event: SceneEvent) {
  const saved = readSavedEvents();
  const exists = saved.some((item) => item.event.id === event.id);
  writeSavedEvents(
    exists
      ? saved.filter((item) => item.event.id !== event.id)
      : [{ event, savedAt: new Date().toISOString() }, ...saved],
  );
  return !exists;
}
