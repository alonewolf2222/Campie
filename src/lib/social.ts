import { supabaseAdmin } from "./supabase";

export type ItemType = "listing" | "food" | "event";

const TABLE_FOR: Record<ItemType, string> = {
  listing: "listings",
  food: "food_items",
  event: "events",
};

const TITLE_FOR: Record<ItemType, string> = {
  listing: "title",
  food: "name",
  event: "title",
};

function admin() {
  if (!supabaseAdmin) throw new Error("Supabase service role key is not configured.");
  return supabaseAdmin;
}

function idFor(prefix: string): string {
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function realInt(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// ── Likes ────────────────────────────────────────────────────────────────────

export async function toggleLike(itemType: string, itemId: string, userId: string) {
  const existing = await admin()
    .from("likes")
    .select("id")
    .eq("item_type", itemType)
    .eq("item_id", itemId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing.data) {
    await admin().from("likes").delete().eq("id", existing.data.id);
    return { liked: false, likes: await countLikes(itemType, itemId) };
  }
  await admin().from("likes").insert({
    id: idFor("lk"),
    item_type: itemType,
    item_id: itemId,
    user_id: userId,
  });
  return { liked: true, likes: await countLikes(itemType, itemId) };
}

export async function countLikes(itemType: string, itemId: string): Promise<number> {
  try {
    const { count } = await admin()
      .from("likes")
      .select("id", { count: "exact", head: true })
      .eq("item_type", itemType)
      .eq("item_id", itemId);
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function likedIds(itemType: string, userId: string): Promise<Set<string>> {
  const likes = await admin()
    .from("likes")
    .select("item_id")
    .eq("item_type", itemType)
    .eq("user_id", userId);
  return new Set((likes.data || []).map((r: any) => r.item_id));
}

export async function attachLikes<T extends { id: string }>(items: T[], itemType: string, userId?: string): Promise<T[]> {
  if (!items.length) return items;
  try {
    const ids = items.map((i) => i.id);
    const { data } = await admin()
      .from("likes")
      .select("item_id")
      .eq("item_type", itemType)
      .in("item_id", ids);
    const counts = new Map<string, number>();
    for (const r of data || []) {
      counts.set(r.item_id, (counts.get(r.item_id) || 0) + 1);
    }
    let liked = new Set<string>();
    if (userId) {
      try { liked = await likedIds(itemType, userId); } catch { liked = new Set(); }
    }
    return items.map((i) => ({
      ...i,
      likeCount: counts.get(i.id) || 0,
      liked: liked.has(i.id),
    }));
  } catch {
    return items.map((i) => ({ ...i, likeCount: 0, liked: false }));
  }
}

// ── Follows ──────────────────────────────────────────────────────────────────

export async function toggleFollow(followingId: string, followerId: string) {
  const existing = await admin()
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  if (existing.data) {
    await admin().from("follows").delete().eq("id", existing.data.id);
    return { following: false, followers: await countFollowers(followingId) };
  }
  await admin().from("follows").insert({ id: idFor("fl"), follower_id: followerId, following_id: followingId });
  return { following: true, followers: await countFollowers(followingId) };
}

export async function countFollowers(userId: string): Promise<number> {
  try {
    const { count } = await admin()
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", userId);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function countFollowing(userId: string): Promise<number> {
  try {
    const { count } = await admin()
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", userId);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getFollowStats(sellerId: string, viewerId?: string) {
  return {
    followers: await countFollowers(sellerId),
    following: await countFollowing(sellerId),
    isFollowing: viewerId ? await isFollowing(sellerId, viewerId) : false,
  };
}

export async function isFollowing(followingId: string, followerId: string): Promise<boolean> {
  try {
    const { data } = await admin()
      .from("follows")
      .select("id")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

// ── Analytics (views / clicks) ───────────────────────────────────────────────

export async function bumpStat(itemType: string, itemId: string, stat: "view" | "click") {
  const table = TABLE_FOR[itemType as ItemType];
  if (!table) throw new Error("Unknown item type: " + itemType);
  const col = stat === "view" ? "view_count" : "click_count";
  const row = await admin().from(table).select("view_count, click_count").eq("id", itemId).maybeSingle();
  if (!row.data) throw new Error("Item not found");
  const views = realInt(row.data.view_count);
  const clicks = realInt(row.data.click_count);
  const value = (stat === "view" ? views : clicks) + 1;
  await admin().from(table).update({ [col]: value }).eq("id", itemId);
  return { viewCount: stat === "view" ? value : views, clickCount: stat === "click" ? value : clicks };
}

// ── Notifications ────────────────────────────────────────────────────────────

export async function notifyNewItem(opts: {
  itemType: ItemType;
  itemId: string;
  actorId: string;
  actorName: string;
  university: string;
  title: string;
  image?: string;
}) {
  try {
    const uni = (opts.university || "").trim();
    const q = admin()
      .from("profiles")
      .select("id")
      .neq("id", opts.actorId)
      .eq("status", "active");

    const followers = await admin()
      .from("follows")
      .select("follower_id")
      .eq("following_id", opts.actorId);
    const followerIds: string[] = (followers.data || []).map((r: any) => r.follower_id);

    if (uni) q.eq("university", uni);
    const { data: campusUsers } = await q;
    const sameUniIds = (campusUsers || []).map((r: any) => r.id);

    const recipients = Array.from(new Set([...followerIds, ...sameUniIds]));
    if (!recipients.length) return;

    const body =
      opts.itemType === "food"
        ? opts.actorName + " added a new food item on " + (uni || "campus")
        : opts.itemType === "event"
        ? opts.actorName + " posted a new event on " + (uni || "campus")
        : opts.actorName + " posted a new " + (uni || "campus") + " listing";

    const rows = recipients.map((recipientId) => ({
      id: idFor("n_"),
      recipient_id: recipientId,
      actor_id: opts.actorId,
      item_type: opts.itemType,
      item_id: opts.itemId,
      title: opts.title,
      body,
      image: opts.image || "",
    }));

    const CHUNK = 200;
    for (let i = 0; i < rows.length; i += CHUNK) {
      await admin().from("notifications").insert(rows.slice(i, i + CHUNK));
    }
  } catch (err) {
    console.error("notifyNewItem", err);
  }
}

export async function getNotifications(userId: string) {
  try {
    const [unreadRes, allRes] = await Promise.all([
      admin()
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", userId)
        .eq("read", false),
      admin()
        .from("notifications")
        .select("*")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(40),
    ]);
    return {
      unread: unreadRes.count ?? 0,
      notifications: (allRes.data || []).map((n: any) => ({
        id: n.id,
        itemType: n.item_type,
        itemId: n.item_id,
        title: n.title,
        body: n.body,
        image: n.image || "",
        read: !!n.read,
        createdAt: n.created_at,
      })),
    };
  } catch (err) {
    console.error("getNotifications", err);
    return { unread: 0, notifications: [] };
  }
}

export async function markNotificationsRead(userId: string, opts: { id?: string; itemType?: string; itemId?: string }) {
  try {
    let q = admin().from("notifications").update({ read: true }).eq("recipient_id", userId).eq("read", false);
    if (opts.id) q = q.eq("id", opts.id);
    if (opts.itemType && opts.itemId) {
      q = q.eq("item_type", opts.itemType).eq("item_id", opts.itemId);
    }
    await q;
  } catch (err) {
    console.error("markNotificationsRead", err);
  }
  const { unread } = await getNotifications(userId);
  return { unread };
}

// ── Seller "my items" ────────────────────────────────────────────────────────

export async function getMyItems(userId: string) {
  const types: ItemType[] = ["listing", "food", "event"];
  const items: Array<{
    id: string;
    type: string;
    title: string;
    image: string;
    price: number;
    university: string;
    available: boolean;
    viewCount: number;
    clickCount: number;
    likeCount: number;
  }> = [];

  for (const t of types) {
    const table = TABLE_FOR[t];
    const { data } = await admin()
      .from(table)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    for (const r of (data || []).filter((row: any) => row.hidden !== true)) {
      items.push({
        id: r.id,
        type: t === "food" ? "food" : r.type || t,
        title: (r[TITLE_FOR[t]] as string) || "Untitled",
        image: r.image || "",
        price: r.price || 0,
        university: r.university || "",
        available: r.available ? true : false,
        viewCount: realInt(r.view_count),
        clickCount: realInt(r.click_count),
        likeCount: await countLikes(t, r.id),
      });
    }
  }

  items.sort((a, b) => (b.viewCount + b.clickCount + b.likeCount) - (a.viewCount + a.clickCount + a.likeCount));

  return {
    items,
    followers: await countFollowers(userId),
    following: await countFollowing(userId),
  };
}