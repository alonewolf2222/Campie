import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/auth";
import { getNotifications } from "@/lib/social";

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthedUserId(request);
    if (!userId) {
      return NextResponse.json({ notifications: [], unread: 0 });
    }
    return NextResponse.json(await getNotifications(userId));
  } catch (err) {
    console.error("GET /api/notifications", err);
    return NextResponse.json({ notifications: [], unread: 0 });
  }
}