import Link from "next/link";
import { SavedNavLink } from "./saved-nav-link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="wordmark focus-ring" href="/" aria-label="SCENE NYC and North Jersey home">
          <span className="wordmark-mark" aria-hidden="true"><b>S</b><i>↗</i></span>
          <span className="wordmark-copy"><strong>SCENE</strong><small>NYC / NORTH JERSEY</small></span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link className="nav-link focus-ring nav-secondary" href="/#discover">Discover</Link>
          <Link className="nav-link focus-ring" href="/#plan-night">Plan</Link>
          <SavedNavLink />
        </nav>
      </div>
    </header>
  );
}
