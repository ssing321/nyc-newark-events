import { EventGridSkeleton } from "@/components/event-grid-skeleton";

export default function Loading() {
  return (
    <main>
      <section className="hero loading-hero"><div className="shell hero-content"><div className="skeleton skeleton-line short" /><div className="skeleton hero-title-skeleton" /><div className="skeleton skeleton-line" /></div></section>
      <section className="catalog"><div className="shell"><div className="filters-skeleton skeleton" /><EventGridSkeleton /></div></section>
    </main>
  );
}
