import { NextResponse } from "next/server";
import { getStories, createStory } from "@/lib/db";

export async function GET() {
  try {
    return NextResponse.json({ data: await getStories() });
  } catch (err) {
    console.error("GET /api/stories", err);
    return NextResponse.json({ error: "Failed to load stories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const story = await createStory(body);
    return NextResponse.json({ data: story }, { status: 201 });
  } catch (err) {
    console.error("POST /api/stories", err);
    return NextResponse.json({ error: "Failed to create story" }, { status: 400 });
  }
}