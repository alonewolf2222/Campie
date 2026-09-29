import { NextResponse } from "next/server";
import { getFoodItems, createFoodItem } from "@/lib/db";

export async function GET() {
  try {
    return NextResponse.json({ data: await getFoodItems() });
  } catch (err) {
    console.error("GET /api/food", err);
    return NextResponse.json({ error: "Failed to load food items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await createFoodItem(body);
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (err) {
    console.error("POST /api/food", err);
    return NextResponse.json({ error: "Failed to create food item" }, { status: 400 });
  }
}