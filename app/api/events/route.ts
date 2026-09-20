import { NextResponse, type NextRequest } from "next/server";
import { parseEventFilters, searchParamsToRecord } from "@/lib/events/query";
import { searchEvents } from "@/lib/events/service";

export async function GET(request: NextRequest) {
  try {
    const filters = parseEventFilters(searchParamsToRecord(request.nextUrl.searchParams));
    const result = await searchEvents(filters);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("Unable to serve event search:", error);
    return NextResponse.json(
      { error: "Event listings are temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }
}
