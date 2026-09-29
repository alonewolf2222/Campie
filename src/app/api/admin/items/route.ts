import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";

type ItemRow = {
  id: string;
  hidden: boolean | null;
  created_at: string | null;
  title?: string | null;
  name?: string | null;
  price?: number | null;
  user_id?: string | null;
  seller?: string | null;
  university?: string | null;
  campus?: string | null;
  location?: string | null;
  image?: string | null;
  thumbnail?: string | null;
};

const TABLE_KEYS: Record<string, keyof ItemRow> = {
  listings: "title",
  food_items: "name",
  events: "title",
  stories: "name",
};

const TYPES = ["listings", "food_items", "events", "stories"] as const;

async function fetchType(type: string) {
  if (!supabaseAdmin) return { data: [], error: "misconfigured" };
  const titleKey = TABLE_KEYS[type] ?? "title";
  const { data, error } = await supabaseAdmin
    .from(type)
    .select("*")
    .order("created_at", { ascending: false });
  const rows = (data || ([] as (ItemRow | null)[])).filter(Boolean) as ItemRow[];
  const mapped = rows.map((r) => ({
    type,
    id: r.id,
    title: r[titleKey] || (type === "stories" ? `${r.name || "Untitled"}` : r.name || r.title || "Untitled"),
    price: "price" in r ? r.price ?? null : null,
    seller: r.seller || r.name || r.user_id?.slice(0, 8) || "",
    university: r.university || r.campus || r.location || "",
    hidden: !!r.hidden,
    image: r.image || r.thumbnail || null,
    created_at: r.created_at,
  }));
  return { data: mapped, error: error ? error.message : null };
}

export async function GET(req: NextRequest) {
  const adminId = await requireAdmin(req);
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const type = new URL(req.url).searchParams.get("type");
  if (type && !(TYPES as readonly string[]).includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  const wanted = type ? [type as string] : [...(TYPES as readonly string[])];
  const all: unknown[] = [];
  for (const t of wanted) {
    const { data, error } = await fetchType(t);
    if (error) return NextResponse.json({ error }, { status: 500 });
    all.push(...(data as unknown[]));
  }
  return NextResponse.json({ data: all });
}

export async function PATCH(request: NextRequest) {
  const adminId = await requireAdmin(request);
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }
  const body = await request.json().catch(() => ({}));
  const { type, id, action } = body;
  if (!type || !(TYPES as readonly string[]).includes(type) || !id) {
    return NextResponse.json({ error: "type and id are required" }, { status: 400 });
  }
  if (!["hide", "show", "delete"].includes(action)) {
    return NextResponse.json({ error: "action must be hide, show or delete" }, { status: 400 });
  }

  if (action === "delete") {
    const { error } = await supabaseAdmin.from(type).delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: { type, id, deleted: true } });
  }
  const { error } = await supabaseAdmin
    .from(type)
    .update({ hidden: action === "hide" })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: { type, id, hidden: action === "hide" } });
}