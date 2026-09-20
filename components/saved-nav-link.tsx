"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readSavedEvents, SAVED_EVENTS_CHANGED, SAVED_EVENTS_KEY } from "@/lib/saved-events";

export function SavedNavLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => setCount(readSavedEvents().length);
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

  return (
    <Link className="nav-link focus-ring saved-nav" href="/saved">
      Saved <span aria-label={`${count} saved events`}>{count > 0 ? `(${count})` : ""}</span>
    </Link>
  );
}
