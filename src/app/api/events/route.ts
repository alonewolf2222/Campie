import { NextResponse } from "next/server";
import { getEvents, createEvent } from "@/lib/db";

export async function GET() {
  try {
    return NextResponse.json({ data: await getEvents() });
  } catch (err) {
    console.error("GET /api/events", err);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event = await createEvent(body);
    return NextResponse.json({ data: event }, { status: 201 });
  } catch (err) {
    console.error("POST /api/events", err);
    return NextResponse.json({ error: "Failed to create event" }, { status: 400 });
  }
}