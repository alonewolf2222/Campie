"use client";

import { useState, useEffect } from "react";
import { X, MapPin, PackageOpen } from "lucide-react";
import { useAuth, useLang } from "@/lib/context";
import type { Listing } from "@/lib/mockData";
import ItemDetailModal from "./ItemDetailModal";
import FavButton from "./FavButton";

function TypeBadge({ type }: { type: string }) {
  const base = "absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full z-10";
  if (type === "sale")
    return <span className={`${base} bg-orange-500 text-white`}>SALE</span>;
  if (type === "rent")
    return <span className={`${base} bg-emerald-500 text-white`}>RENT</span>;
  if (type === "event")
    return <span className={`${base} bg-purple-500 text-white`}>EVENT</span>;
  if (type === "food")
    return <span className={`${base} bg-red-500 text-white`}>FOOD</span>;
  return null;
}

export default function MyListingsModal() {
  const { user, showMyListings, setShowMyListings } = useAuth();
  const { t } = useLang();
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Listing | null>(null);

  useEffect(() => {
    if (!showMyListings || !user) return;
    const load = () => {
      setLoading(true);
      fetch("/api/listings")
        .then((r) => r.json())
        .then((j) => {
          const all = (j.data || []) as Listing[];
          setItems(
            all.filter((l) => l.seller && user && l.seller === user.name)
          );
        })
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    };
    load();
    window.addEventListener("listings-updated", load);
    return () => window.removeEventListener("listings-updated", load);
  }, [showMyListings, user]);

  if (!showMyListings || !user) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm overflow-y-auto">
      {/* My Listings Modal */}
      <div className="relative z-10 min-h-full bg-white dark:bg-gray-950 pt-[env(safe-area-inset-top)]">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <button
              onClick={() => setShowMyListings(false)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-semibold transition"
            >
              <X className="w-5 h-5" /> Close
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              My Listings
            </h1>
            <div className="w-16" />
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {user.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {user.university}
              {user.campus ? ` · ${user.campus}` : ""} · {user.level}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              {items.length} posted item{items.length === 1 ? "" : "s"} — tap one
              to view or edit
            </p>
          </div>

          {loading ? (
            <div className="py-20 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <PackageOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                No listings yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                When you post an item, it will show up here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="group transition-all cursor-pointer"
                >
                  <div className="relative w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <TypeBadge type={item.type} />
                    <FavButton id={item.id} />
                  </div>
                  <div className="p-2.5 flex flex-col gap-1.5">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-xs leading-snug break-words">{item.title}</h3>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="font-bold text-gray-900 dark:text-white text-sm">
                          {item.type === "event" && item.price === 0 ? "FREE" : "GH₵ " + item.price.toLocaleString()}
                        </span>
                      {item.initialPrice != null && item.initialPrice > 0 && (
                        <span className="text-[11px] text-gray-400 line-through">
                          GH₵ {item.initialPrice.toLocaleString()}
                        </span>
                      )}
                      {item.type === "rent" && item.rentPeriod && (
                        <span className="text-[11px] text-gray-400">
                          / {item.rentPeriod}
                        </span>
                      )}
                    </div>
                    <p className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 break-words">
                      <MapPin className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                      {item.university}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Item detail (Edit available for the owner) */}
      <ItemDetailModal
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        hideSimilar
      />
    </div>
  );
}