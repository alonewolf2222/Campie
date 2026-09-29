import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[client-error] " + JSON.stringify(body));
  } catch {}
  return new Response("ok");
}