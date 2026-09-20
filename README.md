# SCENE

**NYC / NORTH JERSEY — FIND YOUR NEXT MOVE.**

SCENE is an editorial event-discovery product for finding upcoming sports, concerts, theatre, comedy, family, and other live events across New York City and North Jersey.

Event listings come from Ticketmaster. The application does not sell tickets: every purchase link sends the visitor to the original provider.

## Architecture

The application uses the Next.js App Router and keeps the data boundary on the server:

1. Server Components or Route Handlers call the event service.
2. The event service queries one or more `EventProvider` implementations.
3. Each provider maps its response into the provider-neutral `Event` model.
4. Results are geographically constrained, deduplicated, filtered, sorted, and paginated.
5. UI components receive normalized event data only—never provider payloads or credentials.

The V0.2 discovery layer operates entirely on normalized events. Its deterministic scoring considers recency, known pricing, venue significance, metadata quality, area, and category, then applies category/venue diversity. Plan My Night uses the same layer through a credential-safe Route Handler. Saved events remain in browser `localStorage`; no account or database is involved.

NYC and Newark/North Jersey are queried as separate, state-constrained geographic regions. This improves coverage of venues on both sides of the Hudson while preventing Manhattan results from leaking into the Newark filter. Provider pages are normalized before being placed in Next.js's 15-minute server cache; the API key never becomes part of a cached URL or client response.

## Tech stack

- Next.js 16 with App Router and React Server Components
- React 19
- TypeScript (strict mode)
- Tailwind CSS 4 toolchain plus a small, token-based product stylesheet
- Ticketmaster Discovery API
- Vercel-compatible server rendering and caching
- `next/font` self-hosted open-source typography
- Native Web Share API and browser `localStorage`

No database, authentication system, analytics SDK, map SDK, external cache, or paid search service is used.

## Requirements

- Node.js 20.9 or later
- npm
- A free Ticketmaster developer API key

## Ticketmaster API key setup

1. Create a Ticketmaster developer account and obtain a Discovery API consumer key.
2. Copy the example environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Put the key in `.env.local`:

   ```dotenv
   TICKETMASTER_API_KEY=your_consumer_key_here
   ```

`TICKETMASTER_API_KEY` is referenced only by server-only provider code. It is never prefixed with `NEXT_PUBLIC_`, returned by an API route, or included in client-side JavaScript.

## Environment variables

| Variable | Required | Scope | Purpose |
| --- | --- | --- | --- |
| `TICKETMASTER_API_KEY` | Yes | Server only | Authenticates Discovery API requests |

## Local development

```bash
npm install
cp .env.example .env.local
# Add the Ticketmaster key to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

URL filters are shareable. For example:

```text
/?area=new-york&category=sports&range=week&q=knicks
```

## Production build

```bash
npm run lint
npm run build
npm start
```

## Deployment to Vercel

1. Push the repository to a GitHub Free repository.
2. In Vercel, choose **Add New → Project** and import that repository.
3. Keep the detected framework preset as **Next.js**.
4. Add `TICKETMASTER_API_KEY` under **Project Settings → Environment Variables** for Production (and Preview if desired).
5. Deploy. The default `*.vercel.app` address is sufficient; no custom domain is required.

The application uses standard Next.js server APIs and does not require additional Vercel products.

## Project structure

```text
app/
  api/events/             Validated, credential-safe JSON Route Handlers
  api/recommendations/    Deterministic Plan My Night recommendations
  events/[id]/            Event detail route and loading/not-found states
  saved/                   Device-local saved event view
  error.tsx               Friendly route error boundary
  loading.tsx             Catalog loading shell
components/               Reusable UI and small interactive client boundaries
lib/
  dates/                  America/New_York parsing and formatting
  events/
    providers/            Provider implementations
    types.ts              Normalized domain model and provider contract
    normalize.ts          Ticketmaster-to-domain mapping
    dedupe.ts             Cross-provider event deduplication
    recommendations.ts    Explainable scoring and diversity selection
    query.ts              Query parameter validation/sanitization
    service.ts            Search, filtering, pagination, and provider orchestration
```

## Provider abstraction

`EventProvider` defines three operations:

- `searchEvents(input)`
- `getEvent(id)`
- `getVenueEvents(venueId, startDateTime)`

Ticketmaster-specific response types and mapping stay in `lib/events/providers/ticketmaster.ts` and `lib/events/normalize.ts`. UI code depends only on the normalized `Event` interface. The service already merges and deduplicates results returned by its provider list.

### Adding another provider

1. Add a provider class in `lib/events/providers/` that implements `EventProvider`.
2. Normalize all results into `Event`; do not leak provider-specific types into components.
3. Add the provider to the `providers` array in `lib/events/service.ts`.
4. Add only its server-side environment variable to `.env.example` and the Vercel project.
5. Confirm ticket URLs point to the originating provider and update source attribution if needed.
6. Review the new provider’s free-tier and credential requirements before enabling it.

The existing event fingerprint—normalized name, venue, and start time—deduplicates overlapping provider results.

## Cost

**Intended operating cost: $0/month.**

- **Ticketmaster Discovery API:** uses the provider’s free/default developer access. Availability and request limits remain subject to Ticketmaster’s developer terms. Fifteen-minute normalized-page caching, adaptive provider pagination, and provider-side classification/search filters reduce API calls. No payment details are required by this application.
- **Vercel:** suitable for the Hobby/free tier while this remains a personal, non-commercial project. Usage must stay within Vercel’s current Hobby limits and terms.
- **GitHub:** source control works with a GitHub Free repository.
- **Maps:** venue links use ordinary Google Maps search URLs generated from the address. There is no Maps API integration or key.
- **Images:** remote Ticketmaster images are optimized by Next.js. There is no paid image service.
- **Search, caching, and data:** implemented in the application with Next.js/Vercel caching. There is no database, Redis instance, hosted search, authentication, paid analytics, monitoring, background jobs, or AI API.
- **Domain:** the free Vercel `*.vercel.app` hostname is sufficient.

If traffic grows beyond the free allowances, the application should be re-evaluated before any paid service is introduced. It does not automatically require or activate a paid dependency.

## Data and behavior notes

- Default results cover approximately the next 30 days and are sorted chronologically.
- Results are fetched adaptively in 100-item provider pages. High-volume searches are partitioned into chronological date windows so Ticketmaster's 1,000-result deep-paging ceiling cannot silently hide the remainder of a 30-day range. A normal combined catalog view makes one request per geographic region, while deeper “Load more” navigation requests additional cached pages/windows only when needed.
- Provider counts display with a `+` while more cached or upstream pages remain. Counts become exact after the selected range is exhausted.
- Custom date ranges are capped at 90 days.
- Dates and times render in `America/New_York`.
- Descriptions use Ticketmaster information/notes when available; otherwise they are generated deterministically from normalized event fields.
- Top Picks, quick modes, and Plan My Night use deterministic application-side ranking—never an AI or paid recommendation service.
- Saved events live only in the current browser. They survive refreshes but do not sync between devices.
- The catalog and detail pages display friendly empty, loading, not-found, and provider-error states.
- Provider fetches revalidate approximately every 15 minutes. Browser-facing API responses also advertise a 15-minute CDN cache window.
