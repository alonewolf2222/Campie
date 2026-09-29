import { NextRequest, NextResponse } from "next/server";
import { getEvents, createEvent } from "@/lib/db";
import { requireProfile, profileComplete, PROFILE_INCOMPLETE_MSG } from "@/lib/auth";

export async function GET() {
  try {
    return NextResponse.json({ data: await getEvents() });
  } catch (err) {
    console.error("GET /api/events", err);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireProfile(request);
    if (!ctx) {
      return NextResponse.json({ error: "Please sign in to post." }, { status: 401 });
    }
    if (!profileComplete(ctx.profile)) {
      return NextResponse.json({ error: PROFILE_INCOMPLETE_MSG }, { status: 403 });
    }
    const body = await request.json();
    body.university = ctx.profile.university;
    const event = await createEvent(body);
    return NextResponse.json({ data: event }, { status: 201 });
  } catch (err) {
    console.error("POST /api/events", err);
    return NextResponse.json({ error: "Failed to create event" }, { status: 400 });
  }
}