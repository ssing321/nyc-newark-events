import type { Metadata } from "next";
import Link from "next/link";
import { SavedEventsView } from "@/components/saved-events-view";

export const metadata: Metadata = {
  title: "Saved Events",
  description: "Your saved SCENE events on this device.",
};

export default function SavedEventsPage() {
  return (
    <main className="saved-page" id="main-content">
      <div className="shell">
        <div className="saved-page-heading">
          <div>
            <p className="section-index">YOUR SHORTLIST / THIS DEVICE</p>
            <h1>SAVED<br />SCENE</h1>
          </div>
          <Link className="utility-button focus-ring" href="/#discover">← Back to discovery</Link>
        </div>
        <SavedEventsView />
      </div>
    </main>
  );
}
