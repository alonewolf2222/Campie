import { NextResponse } from "next/server";
import { getListings, createListing } from "@/lib/db";

export async function GET() {
  try {
    return NextResponse.json({ data: await getListings() });
  } catch (err) {
    console.error("GET /api/listings", err);
    return NextResponse.json({ error: "Failed to load listings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const listing = await createListing(body);
    return NextResponse.json({ data: listing }, { status: 201 });
  } catch (err) {
    console.error("POST /api/listings", err);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 400 });
  }
}