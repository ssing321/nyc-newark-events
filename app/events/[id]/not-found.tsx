import Link from "next/link";

export default function EventNotFound() {
  return (
    <main className="detail-main">
      <div className="shell not-found-state">
        <p className="error-code">404</p>
        <h1>This SCENE has left the stage.</h1>
        <p>It may have ended, moved, or no longer be available from the provider.</p>
        <Link className="button button-primary focus-ring" href="/">Browse the latest SCENE</Link>
      </div>
    </main>
  );
}
