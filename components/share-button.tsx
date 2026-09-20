"use client";

import { useState } from "react";

export function ShareButton({ title, text }: { title: string; text: string }) {
  const [status, setStatus] = useState("");

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        setStatus("Shared");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setStatus("Link copied");
      } else {
        setStatus("Copy the URL from your browser");
      }
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") setStatus("Unable to share");
    }
  }

  return (
    <span className="share-control">
      <button className="utility-button focus-ring" type="button" onClick={share}>
        Share <span aria-hidden="true">↗</span>
      </button>
      <span className="share-status" role="status" aria-live="polite">{status}</span>
    </span>
  );
}
