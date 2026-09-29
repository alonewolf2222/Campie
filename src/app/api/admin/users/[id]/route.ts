import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await requireAdmin(request);
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const status = body.status;
  if (status !== "active" && status !== "suspended") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (id === adminId) {
    return NextResponse.json({ error: "You cannot change your own status" }, { status: 403 });
  }
  const { data: target } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", id)
    .maybeSingle();
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (target.role === "admin") {
    return NextResponse.json({ error: "Admin accounts are protected" }, { status: 403 });
  }
  const { error } = await supabaseAdmin.from("profiles").update({ status }).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data: { id, status } });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await requireAdmin(request);
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }
  const { id } = await params;
  if (id === adminId) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 403 });
  }
  const { data: target } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", id)
    .maybeSingle();
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (target.role === "admin") {
    return NextResponse.json({ error: "Admin accounts are protected" }, { status: 403 });
  }

  await supabaseAdmin.from("listings").delete().eq("user_id", id);
  await supabaseAdmin.from("food_items").delete().eq("user_id", id);
  await supabaseAdmin.from("events").delete().eq("user_id", id);

  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data: { id, deleted: true } });
}