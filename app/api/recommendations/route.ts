import { NextResponse, type NextRequest } from "next/server";
import { newYorkCalendarDate } from "@/lib/dates";
import {
  recommendEvents,
  recommendationExplanation,
} from "@/lib/events/recommendations";
import { searchEvents } from "@/lib/events/service";
import type { DateRange, EventArea, EventCategory, EventFilters } from "@/lib/events/types";

const WHEN_VALUES = new Set(["tonight", "tomorrow", "weekend"]);
const WHERE_VALUES = new Set(["new-york", "newark", "both"]);
const BUDGET_VALUES = new Set(["50", "100", "any"]);
const VIBE_VALUES = new Set(["music", "sports", "comedy", "arts", "family", "surprise"]);

const VIBE_CATEGORIES: Record<string, EventCategory | "All"> = {
  music: "Music",
  sports: "Sports",
  comedy: "Comedy",
  arts: "Arts & Theatre",
  family: "Family",
  surprise: "All",
};

function valid(value: string | null, values: Set<string>, fallback: string) {
  return value && values.has(value) ? value : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const when = valid(request.nextUrl.searchParams.get("when"), WHEN_VALUES, "tonight");
    const where = valid(request.nextUrl.searchParams.get("where"), WHERE_VALUES, "both") as EventArea;
    const budget = valid(request.nextUrl.searchParams.get("budget"), BUDGET_VALUES, "any");
    const vibe = valid(request.nextUrl.searchParams.get("vibe"), VIBE_VALUES, "surprise");
    const category = VIBE_CATEGORIES[vibe];
    const filters: EventFilters = {
      area: where,
      category,
      range: (when === "weekend" ? "weekend" : when === "tonight" ? "today" : "custom") as DateRange,
      query: "",
      page: 4,
    };

    if (when === "tomorrow") {
      filters.start = newYorkCalendarDate(1);
      filters.end = filters.start;
    }

    const budgetMax = budget === "any" ? undefined : Number(budget);
    const result = await searchEvents(filters);
    const recommendations = recommendEvents(result.events, {
      limit: 3,
      mode: vibe === "surprise" ? "surprise" : "plan",
      area: where,
      category,
      budgetMax,
    }).map((event) => ({
      event,
      explanation: recommendationExplanation(event, { budgetMax, area: where, category }),
    }));

    return NextResponse.json(
      { recommendations, filters: { when, where, budget, vibe } },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300" } },
    );
  } catch (error) {
    console.error("Unable to create night recommendations:", error);
    return NextResponse.json(
      { error: "We couldn’t plan your night right now. Please try again shortly." },
      { status: 503 },
    );
  }
}
