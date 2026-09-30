import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/auth";
import { toggleLike, countLikes } from "@/lib/social";

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Please sign in to like." }, { status: 401 });
    }
    const { itemType, itemId } = await request.json();
    if (!itemType || !itemId) {
      return NextResponse.json({ error: "Missing itemType or itemId" }, { status: 400 });
    }
    const result = await toggleLike(String(itemType), String(itemId), userId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("POST /api/likes", err);
    return NextResponse.json({ error: "Failed to update like" }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const itemType = url.searchParams.get("itemType") || "listing";
    const itemId = url.searchParams.get("itemId") || "";
    if (!itemId) return NextResponse.json({ likes: 0 });
    return NextResponse.json({ likes: await countLikes(itemType, itemId) });
  } catch (err) {
    console.error("GET /api/likes", err);
    return NextResponse.json({ likes: 0 });
  }
}