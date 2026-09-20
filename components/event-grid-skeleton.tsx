export function EventGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="event-grid" aria-label="Loading events" aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="event-card skeleton-card" key={index} aria-hidden="true">
          <div className="skeleton skeleton-image" />
          <div className="card-body">
            <div className="skeleton skeleton-line short" />
            <div className="skeleton skeleton-line title" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line tiny" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading upcoming events…</span>
    </div>
  );
}
