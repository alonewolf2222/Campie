import { NextRequest, NextResponse } from "next/server";
import { bumpStat } from "@/lib/social";

export async function POST(request: NextRequest) {
  try {
    const { itemType, itemId, stat } = await request.json();
    if (!itemType || !itemId || (stat !== "view" && stat !== "click")) {
      return NextResponse.json({ error: "Invalid stats request" }, { status: 400 });
    }
    const result = await bumpStat(String(itemType), String(itemId), stat);
    return NextResponse.json(result);
  } catch (err) {
    console.error("POST /api/stats", err);
    return NextResponse.json({ error: "Failed to record stat" }, { status: 400 });
  }
}