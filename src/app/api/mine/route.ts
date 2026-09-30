import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/auth";
import { getMyItems } from "@/lib/social";

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }
    return NextResponse.json(await getMyItems(userId));
  } catch (err) {
    console.error("GET /api/mine", err);
    return NextResponse.json({ error: "Failed to load your items" }, { status: 400 });
  }
}