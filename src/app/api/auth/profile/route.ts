import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string") patch.name = body.name;
  if (typeof body.phone === "string") patch.phone = body.phone;
  if (typeof body.university === "string") patch.university = body.university;
  if (typeof body.campus === "string") patch.campus = body.campus;
  if (typeof body.level === "string") patch.level = body.level;
  if (typeof body.avatar === "string") patch.avatar = body.avatar;

  const { data: profile, error: upErr } = await supabaseAdmin
    .from("profiles")
    .update(patch)
    .eq("id", data.user.id)
    .select("id,name,email,phone,university,campus,level,avatar,role,status")
    .single();

  if (upErr || !profile) {
    return NextResponse.json({ error: upErr?.message || "update failed" }, { status: 400 });
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
    },
  });
}