import { NextRequest, NextResponse } from "next/server";
import { getFoodItems, createFoodItem } from "@/lib/db";
import { requireProfile, profileComplete, PROFILE_INCOMPLETE_MSG } from "@/lib/auth";

export async function GET() {
  try {
    return NextResponse.json({ data: await getFoodItems() });
  } catch (err) {
    console.error("GET /api/food", err);
    return NextResponse.json({ error: "Failed to load food items" }, { status: 500 });
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
    const item = await createFoodItem(body);
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (err) {
    console.error("POST /api/food", err);
    return NextResponse.json({ error: "Failed to create food item" }, { status: 400 });
  }
}