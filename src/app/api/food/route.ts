import { NextRequest, NextResponse } from "next/server";
import { getFoodItems, createFoodItem } from "@/lib/db";
import { requireProfile, profileComplete, PROFILE_INCOMPLETE_MSG, getAuthedUserId } from "@/lib/auth";
import { attachLikes, notifyNewItem } from "@/lib/social";

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthedUserId(request);
    const items = await getFoodItems();
    const enriched = await attachLikes(items, "food", userId || undefined);
    return NextResponse.json({ data: enriched });
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
    body.user_id = ctx.userId;
    const item = await createFoodItem(body);
    await notifyNewItem({
      itemType: "food",
      itemId: item.id,
      actorId: ctx.userId,
      actorName: ctx.profile.name || "Student User",
      university: ctx.profile.university,
      title: item.name,
      image: item.image,
    });
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (err) {
    console.error("POST /api/food", err);
    return NextResponse.json({ error: "Failed to create food item" }, { status: 400 });
  }
}