"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { CATEGORY_SLUGS } from "@/lib/events/query";
import type { EventFilters } from "@/lib/events/types";

interface FiltersProps {
  filters: EventFilters;
  rangeStart: string;
  rangeEnd: string;
}

export function EventFiltersPanel({ filters, rangeStart, rangeEnd }: FiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(filters.query);
  const [pending, startTransition] = useTransition();

  const navigate = useCallback((updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    if ("area" in updates || "category" in updates || "range" in updates) next.delete("mode");
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "all" || (key === "area" && value === "both") || (key === "range" && value === "month")) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    next.delete("page");
    const destination = next.size ? `${pathname}?${next.toString()}#events` : `${pathname}#events`;
    startTransition(() => router.replace(destination, { scroll: false }));
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (query === filters.query) return;
    const timer = window.setTimeout(() => navigate({ q: query || undefined }), 350);
    return () => window.clearTimeout(timer);
  }, [query, filters.query, navigate]);

  const custom = filters.range === "custom";

  return (
    <section className="filters-panel" aria-labelledby="filter-heading" aria-busy={pending}>
      <div className="filter-heading-row">
        <div>
          <p className="utility-label">FILTER THE CITY</p>
          <h3 id="filter-heading">Dial in the listings.</h3>
        </div>
        <Link className="reset-link focus-ring" href="/#events">Reset / all events</Link>
      </div>

      <div className="filter-grid">
        <label className="field search-field">
          <span>Search</span>
          <span className="input-wrap">
            <span className="search-symbol" aria-hidden="true">⌕</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Artist, team, event, venue…"
              autoComplete="off"
            />
          </span>
        </label>

        <label className="field">
          <span>Area</span>
          <select value={filters.area} onChange={(event) => navigate({ area: event.target.value })}>
            <option value="both">NYC + North Jersey</option>
            <option value="new-york">NYC</option>
            <option value="newark">North Jersey</option>
          </select>
        </label>

        <label className="field">
          <span>Category</span>
          <select
            value={CATEGORY_SLUGS[filters.category]}
            onChange={(event) => navigate({ category: event.target.value })}
          >
            <option value="all">All events</option>
            <option value="sports">Sports</option>
            <option value="music">Music</option>
            <option value="arts-theatre">Arts &amp; Theatre</option>
            <option value="comedy">Comedy</option>
            <option value="family">Family</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="field">
          <span>Date</span>
          <select
            value={filters.range}
            onChange={(event) => {
              const value = event.target.value;
              navigate(
                value === "custom"
                  ? { range: value, start: filters.start ?? rangeStart, end: filters.end ?? rangeEnd }
                  : { range: value, start: undefined, end: undefined },
              );
            }}
          >
            <option value="today">Today</option>
            <option value="weekend">This weekend</option>
            <option value="week">Next 7 days</option>
            <option value="month">Next 30 days</option>
            <option value="custom">Custom dates</option>
          </select>
        </label>
      </div>

      {custom ? (
        <div className="custom-dates" aria-label="Custom date range">
          <label className="field">
            <span>Start date</span>
            <input
              type="date"
              value={filters.start ?? rangeStart}
              max={filters.end ?? rangeEnd}
              onChange={(event) => navigate({ start: event.target.value })}
            />
          </label>
          <label className="field">
            <span>End date</span>
            <input
              type="date"
              value={filters.end ?? rangeEnd}
              min={filters.start ?? rangeStart}
              onChange={(event) => navigate({ end: event.target.value })}
            />
          </label>
          <p>Custom ranges are limited to 90 days to keep results focused.</p>
        </div>
      ) : null}

      {pending ? <span className="filter-status" role="status">Updating events…</span> : null}
    </section>
  );
}
