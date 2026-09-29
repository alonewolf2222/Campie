import { NextRequest, NextResponse } from "next/server";
import { getStories, createStory } from "@/lib/db";
import { requireProfile, profileComplete, PROFILE_INCOMPLETE_MSG } from "@/lib/auth";

export async function GET() {
  try {
    return NextResponse.json({ data: await getStories() });
  } catch (err) {
    console.error("GET /api/stories", err);
    return NextResponse.json({ error: "Failed to load stories" }, { status: 500 });
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
    body.user = ctx.profile.name || "Student User";
    body.avatar = "";
    body.university = ctx.profile.university;
    const story = await createStory(body);
    return NextResponse.json({ data: story }, { status: 201 });
  } catch (err) {
    console.error("POST /api/stories", err);
    return NextResponse.json({ error: "Failed to create story" }, { status: 400 });
  }
}