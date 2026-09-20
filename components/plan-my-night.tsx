"use client";

import { useState } from "react";
import type { Event } from "@/lib/events/types";
import { EventCard } from "./event-card";

const OPTIONS = {
  when: [
    ["tonight", "Tonight"],
    ["tomorrow", "Tomorrow"],
    ["weekend", "This weekend"],
  ],
  where: [
    ["new-york", "NYC"],
    ["newark", "North Jersey"],
    ["both", "Anywhere"],
  ],
  budget: [
    ["50", "Under $50"],
    ["100", "Under $100"],
    ["any", "Any"],
  ],
  vibe: [
    ["music", "Music"],
    ["sports", "Sports"],
    ["comedy", "Comedy"],
    ["arts", "Arts"],
    ["family", "Family"],
    ["surprise", "Surprise me"],
  ],
} as const;

type PlanKey = keyof typeof OPTIONS;
type PlanState = Record<PlanKey, string>;
interface PlanRecommendation {
  event: Event;
  explanation: string;
}

const INITIAL_PLAN: PlanState = {
  when: "tonight",
  where: "both",
  budget: "any",
  vibe: "surprise",
};

export function PlanMyNight() {
  const [plan, setPlan] = useState<PlanState>(INITIAL_PLAN);
  const [recommendations, setRecommendations] = useState<PlanRecommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(key: PlanKey, value: string) {
    setPlan((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams(plan);
      const response = await fetch(`/api/recommendations?${query.toString()}`);
      const payload = (await response.json()) as {
        recommendations?: PlanRecommendation[];
        error?: string;
      };
      if (!response.ok || !payload.recommendations) {
        throw new Error(payload.error ?? "Recommendations are unavailable.");
      }
      setRecommendations(payload.recommendations);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Recommendations are unavailable.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setRecommendations(null);
    setError("");
  }

  return (
    <section className="plan-section" id="plan-night" aria-labelledby="plan-heading">
      <div className="shell">
        <div className="section-masthead plan-masthead">
          <div>
            <p className="section-index">04 / MAKE A PLAN</p>
            <h2 id="plan-heading">PLAN MY<br />NIGHT</h2>
          </div>
          <p>Four quick calls. Three real events. No chatbot, no invented picks.</p>
        </div>

        {recommendations === null ? (
          <form className="plan-form" onSubmit={submit}>
            {(Object.keys(OPTIONS) as PlanKey[]).map((key, index) => (
              <fieldset className="plan-step" key={key}>
                <legend><span>0{index + 1}</span> {key.toUpperCase()}?</legend>
                <div className="choice-grid">
                  {OPTIONS[key].map(([value, label]) => (
                    <label className="choice" key={value}>
                      <input
                        type="radio"
                        name={key}
                        value={value}
                        checked={plan[key] === value}
                        onChange={() => update(key, value)}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <div className="plan-submit-row">
              <button className="button button-yellow focus-ring" type="submit" disabled={loading}>
                {loading ? "Finding your SCENE…" : "Show me the moves"} <span aria-hidden="true">→</span>
              </button>
              <p>Budget picks only include events with provider pricing.</p>
            </div>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
          </form>
        ) : (
          <div className="plan-results" aria-live="polite">
            <div className="plan-results-heading">
              <div>
                <p className="utility-label">YOUR SHORTLIST</p>
                <h3>{recommendations.length ? "Three ways to make a night of it." : "No clean match—yet."}</h3>
              </div>
              <button className="utility-button focus-ring" type="button" onClick={reset}>Change plan</button>
            </div>
            {recommendations.length ? (
              <div className="event-grid plan-grid">
                {recommendations.map(({ event, explanation }) => (
                  <div className="plan-result" key={event.id}>
                    <EventCard event={event} />
                    <p className="why-this">WHY THIS: {explanation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="plan-no-results">
                <p>We couldn’t find three real listings that meet every selection. Try a wider area, any budget, or Surprise Me.</p>
                <button className="button button-yellow focus-ring" type="button" onClick={reset}>Change plan</button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
