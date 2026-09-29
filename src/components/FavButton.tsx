"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { isFav, toggleFav } from "@/lib/favourites";

export default function FavButton({ id, className = "" }: { id: string; className?: string }) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    const sync = () => setFav(isFav(id));
    sync();
    window.addEventListener("favs-updated", sync);
    return () => window.removeEventListener("favs-updated", sync);
  }, [id]);

  return (
    <button
      type="button"
      aria-label="Save to favourites"
      onClick={(e) => {
        e.stopPropagation();
        toggleFav(id);
      }}
      className={`absolute top-2 right-2 z-10 w-9 h-9 rounded-full flex items-center justify-center transition shadow-md ${
        fav
          ? "bg-red-500 text-white"
          : "bg-white/90 dark:bg-gray-900/80 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-900"
      } ${className}`}
    >
      <Heart className={`w-5 h-5 ${fav ? "fill-white" : "fill-transparent"}`} />
    </button>
  );
}