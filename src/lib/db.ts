import type { Listing, FoodItem, Event, Story } from "./mockData";
import { supabaseAdmin } from "./supabase";

function admin() {
  if (!supabaseAdmin) throw new Error("Supabase service role key is not configured.");
  return supabaseAdmin;
}

type Row = Record<string, any>;

function mapListing(r: Row): Listing {
  let images: string[] | undefined;
  if (r.images) {
    try { images = JSON.parse(r.images); } catch { images = undefined; }
  }
  return {
    id: r.id,
    title: r.title,
    price: r.price,
    initialPrice: r.initial_price ?? undefined,
    type: r.type,
    category: r.category,
    image: r.image,
    images,
    seller: r.seller,
    sellerAvatar: r.seller_avatar,
    university: r.university,
    campus: r.campus ?? undefined,
    level: r.level,
    rentPeriod: r.rent_period ?? undefined,
    description: r.description,
    callNumber: r.call_number ?? undefined,
    whatsappNumber: r.whatsapp_number ?? undefined,
    callNumber2: r.call_number2 ?? undefined,
    ticketsLeft: r.tickets_left ?? undefined,
    eventDate: r.event_date ?? undefined,
    available: r.available ? true : false,
  };
}

export async function getListings(): Promise<Listing[]> {
  const { data, error } = await admin()
    .from("listings")
    .select("*")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapListing);
}

export async function createListing(data: Omit<Listing, "id" | "sellerAvatar" | "available">): Promise<Listing> {
  const id = "l_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const images = data.images && data.images.length > 0 ? data.images : null;
  const { error } = await admin().from("listings").insert({
    id,
    title: data.title,
    price: data.price,
    initial_price: data.initialPrice ?? null,
    type: data.type,
    category: data.category || "Others",
    image: data.image || "",
    images: images ? JSON.stringify(images) : null,
    seller: data.seller,
    seller_avatar: "",
    university: data.university,
    campus: data.campus ?? null,
    level: data.level,
    rent_period: data.rentPeriod ?? null,
    description: data.description,
    call_number: data.callNumber ?? null,
    whatsapp_number: data.whatsappNumber ?? null,
    call_number2: data.callNumber2 ?? null,
    tickets_left: data.ticketsLeft ?? null,
    event_date: data.eventDate ?? null,
    available: 1,
    hidden: false,
  });
  if (error) throw new Error(error.message);
  return (await getListings()).find((l) => l.id === id)!;
}

export async function updateListing(id: string, data: Partial<Listing>): Promise<Listing | null> {
  const { data: existing } = await admin().from("listings").select("*").eq("id", id).maybeSingle();
  if (!existing) return null;
  let images: string[] | null = null;
  if (Array.isArray(data.images) && data.images.length) images = data.images;
  else if (existing.images) {
    try { images = JSON.parse(existing.images); } catch { images = null; }
  }
  const { error } = await admin().from("listings").update({
    title: data.title ?? existing.title,
    price: data.price ?? existing.price,
    initial_price: data.initialPrice ?? existing.initial_price ?? null,
    category: data.category ?? existing.category,
    rent_period: data.rentPeriod ?? existing.rent_period ?? null,
    description: data.description ?? existing.description,
    image: data.image ?? existing.image,
    images: images ? JSON.stringify(images) : null,
    call_number: data.callNumber ?? existing.call_number ?? null,
    whatsapp_number: data.whatsappNumber ?? existing.whatsapp_number ?? null,
    call_number2: data.callNumber2 ?? existing.call_number2 ?? null,
  }).eq("id", id);
  if (error) throw new Error(error.message);
  return (await getListings()).find((l) => l.id === id) || null;
}

export async function deleteListing(id: string): Promise<boolean> {
  const { data, error } = await admin().from("listings").delete().eq("id", id).select("id");
  if (error) throw new Error(error.message);
  return !!data && data.length > 0;
}

function mapFood(r: Row): FoodItem {
  let tags: string[] = [];
  if (r.tags) {
    try { tags = JSON.parse(r.tags); } catch { tags = []; }
  }
  return {
    id: r.id,
    name: r.name,
    price: r.price,
    specialty: r.specialty,
    description: r.description,
    image: r.image,
    university: r.university,
    rating: r.rating,
    reviews: r.reviews,
    available: r.available ? true : false,
    tags,
    callNumber: r.call_number ?? undefined,
    whatsappNumber: r.whatsapp_number ?? undefined,
  };
}

export async function getFoodItems(): Promise<FoodItem[]> {
  const { data, error } = await admin()
    .from("food_items")
    .select("*")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapFood);
}

export async function createFoodItem(data: Omit<FoodItem, "id">): Promise<FoodItem> {
  const id = "f_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const { error } = await admin().from("food_items").insert({
    id,
    name: data.name,
    price: data.price,
    specialty: data.specialty,
    description: data.description,
    image: data.image,
    university: data.university,
    rating: data.rating || 4.5,
    reviews: data.reviews || 0,
    available: data.available ? 1 : 0,
    tags: JSON.stringify(data.tags || []),
    call_number: data.callNumber ?? null,
    whatsapp_number: data.whatsappNumber ?? null,
    hidden: false,
  });
  if (error) throw new Error(error.message);
  return (await getFoodItems()).find((f) => f.id === id)!;
}

function mapEvent(r: Row): Event {
  return {
    id: r.id,
    title: r.title,
    image: r.image,
    price: r.price,
    university: r.university,
    date: r.date,
    time: r.time,
    venue: r.venue,
    ticketsLeft: r.tickets_left,
    callNumber: r.call_number,
    whatsappNumber: r.whatsapp_number,
  };
}

export async function getEvents(): Promise<Event[]> {
  const { data, error } = await admin()
    .from("events")
    .select("*")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapEvent);
}

export async function createEvent(data: Omit<Event, "id">): Promise<Event> {
  const id = "e_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const { error } = await admin().from("events").insert({
    id,
    title: data.title,
    image: data.image || "",
    price: data.price,
    university: data.university,
    date: data.date,
    time: data.time,
    venue: data.venue,
    tickets_left: data.ticketsLeft,
    call_number: data.callNumber ?? null,
    whatsapp_number: data.whatsappNumber ?? null,
    hidden: false,
  });
  if (error) throw new Error(error.message);
  return (await getEvents()).find((e) => e.id === id)!;
}

function mapStory(r: Row): Story {
  return {
    id: r.id,
    user: r.user,
    avatar: r.avatar,
    thumbnail: r.thumbnail,
    university: r.university,
    timeAgo: r.time_ago,
    viewed: r.viewed ? true : false,
  };
}

export async function getStories(): Promise<Story[]> {
  const { data, error } = await admin()
    .from("stories")
    .select("*")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapStory);
}

export async function createStory(data: Omit<Story, "id">): Promise<Story> {
  const id = "s_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const { error } = await admin().from("stories").insert({
    id,
    user: data.user,
    avatar: data.avatar || "",
    thumbnail: data.thumbnail || "",
    university: data.university,
    time_ago: data.timeAgo || "Just now",
    viewed: 0,
    hidden: false,
  });
  if (error) throw new Error(error.message);
  return (await getStories()).find((s) => s.id === id)!;
}