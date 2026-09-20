import Link from "next/link";

export function EmptyState() {
  return (
    <div className="empty-state">
      <span className="state-icon" aria-hidden="true">NO MATCH /</span>
      <h2>No events match your filters.</h2>
      <p>Try a broader date range, another area, or clear your search.</p>
      <Link className="button button-primary focus-ring" href="/#events">Reset the search</Link>
    </div>
  );
}
