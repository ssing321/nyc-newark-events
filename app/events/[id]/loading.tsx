import { EventGridSkeleton } from "@/components/event-grid-skeleton";

export default function EventDetailLoading() {
  return (
    <main className="detail-main">
      <div className="shell">
        <div className="skeleton skeleton-line short loading-back" />
        <div className="detail-hero detail-loading" aria-busy="true" aria-label="Loading event details">
          <div className="skeleton detail-image-wrap" />
          <div className="detail-intro">
            <div className="skeleton skeleton-pill" />
            <div className="skeleton skeleton-line detail-title-line" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
          </div>
        </div>
        <div className="venue-events"><EventGridSkeleton count={3} /></div>
      </div>
    </main>
  );
}
