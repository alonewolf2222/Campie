import { NextRequest } from "next/server";
import { supabaseAdmin } from "./supabase";

export const PROFILE_INCOMPLETE_MSG = "Set your University, Campus and Level in your Profile before posting.";

export async function requireProfile(req: NextRequest) {
  if (!supabaseAdmin) return null;
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile) return null;
  return { userId: data.user.id, profile };
}

export function profileComplete(profile: { university?: string | null; campus?: string | null; level?: string | null }) {
  return !!(profile.university && profile.campus && profile.level);
}