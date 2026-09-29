import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function capitalizeName(email: string): string {
  const local = email.split("@")[0] || "Student";
  const words = local.replace(/[._-]+/g, " ").trim().split(/\s+/);
  const named = words
    .filter((w) => /^[a-zA-Z]+$/.test(w))
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  return named.length ? named.join(" ") : "Student";
}

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ user: null }, { status: 500 });
  }
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    return NextResponse.json({ user: null });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ user: null });
  }
  const au = data.user;
  const meta = au.user_metadata || {};

  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id,name,email,phone,university,campus,level,avatar,role,status")
    .eq("id", au.id)
    .maybeSingle();

  let profile = existing;
  if (!profile) {
    const { data: inserted } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: au.id,
        name: typeof meta.name === "string" && meta.name ? meta.name : capitalizeName(au.email || au.id),
        email: au.email || au.id,
        phone: typeof meta.phone === "string" ? meta.phone : null,
        university: typeof meta.university === "string" ? meta.university : "",
        campus: typeof meta.campus === "string" ? meta.campus : null,
        level: typeof meta.level === "string" ? meta.level : "",
        avatar: typeof meta.avatar === "string" ? meta.avatar : null,
        role: "user",
        status: "active",
      })
      .select("id,name,email,phone,university,campus,level,avatar,role,status")
      .single();
    profile = inserted;
  }

  if (!profile) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone || "",
      university: profile.university || "",
      campus: profile.campus || "",
      level: profile.level || "",
      avatar: profile.avatar || "",
      role: profile.role || "user",
      status: profile.status || "active",
      provider: au.app_metadata?.provider || "email",
    },
  });
}