"use client";

import { useEffect, useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { useAuth } from "@/lib/context";
import { supabase } from "@/lib/supabase";

export default function FollowButton({ sellerId, sellerName = "" }: { sellerId: string; sellerName?: string }) {
  const { user, setShowAuthModal, setAuthMode } = useAuth();
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess?.session?.access_token;
        const res = await fetch(`/api/follows?sellerId=${encodeURIComponent(sellerId)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const j = await res.json();
        if (mounted) {
          setFollowers(j.followers || 0);
          setFollowing(!!j.isFollowing);
        }
      } catch {
        /* ignore */
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [sellerId]);

  const toggle = async () => {
    if (!user) {
      setAuthMode("signin");
      setShowAuthModal(true);
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      const res = await fetch("/api/follows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ followingId: sellerId }),
      });
      const j = await res.json();
      if (res.ok) {
        setFollowing(j.following);
        setFollowers(j.followers || 0);
      }
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition ${
        following
          ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
          : "bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
      }`}
      title={sellerName ? `Follow ${sellerName}` : "Follow"}
    >
      {following ? <UserCheck style={{ width: 13, height: 13 }} /> : <UserPlus style={{ width: 13, height: 13 }} />}
      <span>{following ? "Following" : "Follow"}</span>
      <span className="tabular-nums opacity-80">{followers}</span>
    </button>
  );
}