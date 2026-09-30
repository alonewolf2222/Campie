import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/auth";
import { toggleFollow, getFollowStats } from "@/lib/social";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sellerId = url.searchParams.get("sellerId") || "";
    if (!sellerId) return NextResponse.json({ followers: 0, following: 0, isFollowing: false });
    const viewerId = await getAuthedUserId(request);
    return NextResponse.json(await getFollowStats(sellerId, viewerId || undefined));
  } catch (err) {
    console.error("GET /api/follows", err);
    return NextResponse.json({ followers: 0, following: 0, isFollowing: false });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Please sign in to follow." }, { status: 401 });
    }
    const { followingId } = await request.json();
    if (!followingId || followingId === userId) {
      return NextResponse.json({ error: "Cannot follow this account." }, { status: 400 });
    }
    return NextResponse.json(await toggleFollow(String(followingId), userId));
  } catch (err) {
    console.error("POST /api/follows", err);
    return NextResponse.json({ error: "Failed to update follow" }, { status: 400 });
  }
}