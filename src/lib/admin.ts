import { NextRequest } from "next/server";
import { supabaseAdmin } from "./supabase";

export async function requireAdmin(req: NextRequest): Promise<string | null> {
  if (!supabaseAdmin) return null;
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id,role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile || profile.role !== "admin") return null;
  return data.user.id;
}