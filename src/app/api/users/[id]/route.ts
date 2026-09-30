import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getListings, getFoodItems, getEvents } from "@/lib/db";
import { attachLikes, getFollowStats } from "@/lib/social";
import { getAuthedUserId } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
    }
    const userId = await getAuthedUserId(request);
    const viewerId = userId || undefined;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id,name,avatar,university,campus,level,role,status")
      .eq("id", id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (profile.status === "suspended") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [listings, food, events] = await Promise.all([
      getListings(),
      getFoodItems(),
      getEvents(),
    ]);

    const mapItem = (group: string) => (x: any) => ({
      id: x.id,
      itemType: group,
      type: x.type || group,
      title: x.title || x.name || "",
      price: x.price || 0,
      image: x.image || "",
      initialPrice: x.initialPrice || 0,
      university: x.university || "",
      rentPeriod: x.rentPeriod || "",
      category: x.category || "",
      venue: group === "event" ? x.venue || "" : undefined,
      available: typeof x.available === "boolean" ? x.available : true,
      user_id: x.user_id || null,
      seller: x.seller || x.vendor || "Seller",
      sellerAvatar: x.sellerAvatar || x.vendorAvatar || "",
      callNumber: x.callNumber || "",
      level: x.level || "",
    });

    const own = (uid: string | null | undefined) => !!uid && uid === id;

    const listingItems = (await attachLikes(listings.filter((l: any) => own(l.user_id)).map(mapItem("listing")), "listing", viewerId));
    const foodItems = (await attachLikes(food.filter((f: any) => own(f.user_id)).map(mapItem("food")), "food", viewerId));
    const eventItems = (await attachLikes(events.filter((e: any) => own(e.user_id)).map(mapItem("event")), "event", viewerId));

    const stats = await getFollowStats(id, viewerId);

    return NextResponse.json({
      profile: {
        id: profile.id,
        name: profile.name || "Campus Seller",
        avatar: profile.avatar || "",
        university: profile.university || "",
        campus: profile.campus || "",
        level: profile.level || "",
        role: profile.role || "user",
      },
      items: [...listingItems, ...foodItems, ...eventItems],
      followers: stats.followers,
      following: stats.following,
      isFollowing: stats.isFollowing,
    });
  } catch (err) {
    console.error("GET /api/users/[id]", err);
    return NextResponse.json({ error: "Failed to load seller profile" }, { status: 500 });
  }
}