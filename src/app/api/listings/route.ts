import { NextRequest, NextResponse } from "next/server";
import { getListings, createListing } from "@/lib/db";
import { requireProfile, profileComplete, PROFILE_INCOMPLETE_MSG, getAuthedUserId } from "@/lib/auth";
import { attachLikes, notifyNewItem } from "@/lib/social";

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthedUserId(request);
    const items = await getListings();
    const enriched = await attachLikes(items, "listing", userId || undefined);
    return NextResponse.json({ data: enriched });
  } catch (err) {
    console.error("GET /api/listings", err);
    return NextResponse.json({ error: "Failed to load listings" }, { status: 500 });
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
    body.seller = ctx.profile.name || "Student User";
    body.sellerAvatar = "";
    body.university = ctx.profile.university;
    body.campus = ctx.profile.campus;
    body.level = ctx.profile.level;
    body.user_id = ctx.userId;
    const listing = await createListing(body);
    await notifyNewItem({
      itemType: "listing",
      itemId: listing.id,
      actorId: ctx.userId,
      actorName: ctx.profile.name || "Student User",
      university: ctx.profile.university,
      title: listing.title,
      image: listing.image,
    });
    return NextResponse.json({ data: listing }, { status: 201 });
  } catch (err) {
    console.error("POST /api/listings", err);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 400 });
  }
}