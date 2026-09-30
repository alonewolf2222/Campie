import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/auth";
import { markNotificationsRead } from "@/lib/social";

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const result = await markNotificationsRead(userId, {
      id: typeof body.id === "string" ? body.id : undefined,
      itemType: typeof body.itemType === "string" ? body.itemType : undefined,
      itemId: typeof body.itemId === "string" ? body.itemId : undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("POST /api/notifications/read", err);
    return NextResponse.json({ unread: 0 }, { status: 400 });
  }
}