import { supabase } from "@/lib/supabase";

export async function toggleLikeRemote(
  itemType: string,
  itemId: string
): Promise<{ liked: boolean; likes: number }> {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess?.session?.access_token;
  const res = await fetch("/api/likes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ itemType, itemId }),
  });
  const j = await res.json();
  if (!res.ok || !j || typeof j.liked !== "boolean") {
    throw new Error(j?.error || "Failed to update like");
  }
  window.dispatchEvent(new Event("likes-updated"));
  return { liked: j.liked, likes: j.likes || 0 };
}