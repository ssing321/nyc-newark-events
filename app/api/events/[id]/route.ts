import { NextResponse, type NextRequest } from "next/server";
import { getEvent } from "@/lib/events/service";

export async function GET(_request: NextRequest, context: RouteContext<"/api/events/[id]">) {
  try {
    const { id } = await context.params;
    const event = await getEvent(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }
    return NextResponse.json(event, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("Unable to serve event details:", error);
    return NextResponse.json(
      { error: "Event details are temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }
}
