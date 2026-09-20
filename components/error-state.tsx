"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function ErrorState() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="error-state" role="alert">
      <span className="state-icon" aria-hidden="true">OFFLINE /</span>
      <h2>SCENE is taking a quick intermission.</h2>
      <p>We couldn’t load listings from our event provider. Please try again in a moment.</p>
      <button
        className="button button-primary focus-ring"
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => router.refresh())}
      >
        {pending ? "Trying again…" : "Try again"}
      </button>
    </div>
  );
}
