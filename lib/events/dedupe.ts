import type { Event } from "./types";

function normalize(value: string) {
  return value
    .toLocaleLowerCase("en-US")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function eventFingerprint(event: Event) {
  const time = new Date(event.startDateTime).toISOString().slice(0, 16);
  return `${normalize(event.name)}|${normalize(event.venueName)}|${time}`;
}

export function dedupeEvents(events: Event[]) {
  const seen = new Set<string>();
  return events.filter((event) => {
    const fingerprint = eventFingerprint(event);
    if (seen.has(fingerprint)) return false;
    seen.add(fingerprint);
    return true;
  });
}
