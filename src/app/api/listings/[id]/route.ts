import { NextResponse } from "next/server";
import { updateListing, deleteListing, getListings } from "@/lib/db";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const existing = (await getListings()).find((l) => l.id === id);
    if (!existing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    const editorName = typeof body.editorName === "string" ? body.editorName.trim() : "";
    if (!editorName || editorName !== existing.seller) {
      return NextResponse.json({ error: "Only the seller can delete this listing" }, { status: 403 });
    }
    const ok = await deleteListing(id);
    if (!ok) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    return NextResponse.json({ data: { id } });
  } catch (err) {
    console.error("DELETE /api/listings/[id]", err);
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 400 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const existing = (await getListings()).find((l) => l.id === id);
    if (!existing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    const editorName = typeof body.editorName === "string" ? body.editorName.trim() : "";
    if (!editorName || editorName !== existing.seller) {
      return NextResponse.json({ error: "Only the seller can edit this listing" }, { status: 403 });
    }
    const { editorName: _ignored, ...data } = body;
    const listing = await updateListing(id, data);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    return NextResponse.json({ data: listing });
  } catch (err) {
    console.error("PATCH /api/listings/[id]", err);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 400 });
  }
}