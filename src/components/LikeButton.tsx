"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@/lib/context";
import { supabase } from "@/lib/supabase";

interface LikeButtonProps {
  itemType: string;
  itemId: string;
  initialCount?: number;
  liked?: boolean;
  variant?: "pill" | "inline";
  iconSize?: number;
  className?: string;
}

export default function LikeButton({
  itemType,
  itemId,
  initialCount = 0,
  liked = false,
  variant = "pill",
  iconSize = 14,
  className = "",
}: LikeButtonProps) {
  const { user, setShowAuthModal, setAuthMode } = useAuth();
  const [count, setCount] = useState(initialCount);
  const [active, setActive] = useState(liked);
  const [busy, setBusy] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (busy) return;
    if (!user) {
      setAuthMode("signin");
      setShowAuthModal(true);
      return;
    }
    setBusy(true);
    try {
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
      if (res.ok) {
        setActive(j.liked);
        setCount(j.likes || 0);
        window.dispatchEvent(new Event("likes-updated"));
      }
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={`flex items-center gap-1.5 px-3 py-2 border rounded-full text-xs font-bold transition ${
          active
            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
            : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
        } ${className}`}
      >
        <Heart style={{ width: iconSize, height: iconSize }} className={active ? "text-red-500 fill-red-500" : "text-gray-600 dark:text-gray-400"} />
        <span>{active ? "Liked" : "Like"}</span>
        {count > 0 && <span className="tabular-nums">{count}</span>}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="Like"
      onClick={toggle}
      disabled={busy}
      className={`absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold shadow-md transition ${
        active
          ? "bg-red-500 text-white"
          : "bg-white/90 dark:bg-gray-900/80 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-900"
      } ${className}`}
    >
      <Heart style={{ width: iconSize, height: iconSize }} className={active ? "fill-white" : "fill-transparent"} />
      <span className="tabular-nums">{count}</span>
    </button>
  );
}