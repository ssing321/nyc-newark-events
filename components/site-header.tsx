import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="wordmark focus-ring" href="/" aria-label="NYC plus Newark Events home">
          <span className="wordmark-mark" aria-hidden="true">N+</span>
          <span>NYC + Newark <strong>Events</strong></span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link className="nav-link focus-ring" href="/#events">Explore events</Link>
          <Link className="nav-link focus-ring nav-secondary" href="/#about">About</Link>
        </nav>
      </div>
    </header>
  );
}
