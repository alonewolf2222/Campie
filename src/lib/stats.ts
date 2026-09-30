import { supabase } from "@/lib/supabase";

export async function bumpStat(itemType: string, itemId: string, stat: "view" | "click") {
  try {
    await fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemType, itemId, stat }),
    });
  } catch {
    /* ignore */
  }
}

export async function apiGet(path: string) {
  try {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;
    const res = await fetch(path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return res;
  } catch {
    return null;
  }
}