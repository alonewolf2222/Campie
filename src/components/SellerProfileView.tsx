"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, GraduationCap, Users, PackageOpen, ShoppingBasket } from "lucide-react";
import ListingCard from "./ListingCard";
import FollowButton from "./FollowButton";

export default function SellerProfileView({
  sellerId,
  fallbackName = "Seller",
  onBack,
  onOpenItem,
}: {
  sellerId: string;
  fallbackName?: string;
  onBack: () => void;
  onOpenItem: (item: any) => void;
}) {
  const [profile, setProfile] = useState<{ id: string; name: string; avatar: string; university: string; campus: string; level: string } | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [followers, setFollowers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    fetch(`/api/users/${encodeURIComponent(sellerId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!mounted) return;
        if (!j.profile) {
          setError(j.error || "Could not load seller profile");
          return;
        }
        setProfile(j.profile);
        setItems(Array.isArray(j.items) ? j.items : []);
        setFollowers(j.followers || 0);
      })
      .catch(() => mounted && setError("Could not load seller profile"))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [sellerId]);

  const name = profile?.name || fallbackName;

  return (
    <div className="fixed inset-0 z-[70] bg-white dark:bg-gray-950 overflow-y-auto overscroll-contain">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">Seller Profile</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading profile…</p>
        ) : error ? (
          <div className="px-8 py-16 rounded-2xl bg-gray-50 dark:bg-gray-800 text-center">
            <PackageOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="font-bold text-gray-900 dark:text-white">{error}</p>
          </div>
        ) : (
          <>
            {/* Profile header */}
            <div className="flex items-center gap-4 mb-8">
              {profile?.avatar ? (
                <img src={profile.avatar} alt={name} className="w-20 h-20 rounded-full object-cover border-4 border-gray-100 dark:border-gray-800" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-2xl font-bold text-white">
                  {(name || "?").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-extrabold text-gray-900 dark:text-white truncate">{name}</h1>
                  <FollowButton sellerId={sellerId} sellerName={name} />
                </div>
                {(profile?.university || profile?.campus) && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 text-green-600" />
                    {profile?.university}{profile?.campus ? " · " + profile.campus : ""}
                  </div>
                )}
                {profile?.level && (
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <GraduationCap className="w-3.5 h-3.5 text-green-600" />
                    {profile.level}
                  </div>
                )}
                <div className="flex items-center gap-1.5 mt-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Users className="w-4 h-4 text-green-600" />
                  {followers} {followers === 1 ? "follower" : "followers"}
                </div>
              </div>
            </div>

            {/* Listings */}
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {name}&apos;s Listings ({items.length})
            </h2>
            {items.length === 0 ? (
              <div className="px-8 py-16 rounded-2xl bg-gray-50 dark:bg-gray-800 text-center">
                <ShoppingBasket className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="font-bold text-gray-900 dark:text-white">No listings yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This seller hasn&apos;t posted anything yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {items.map((it) => (
                  <ListingCard
                    key={it.id + it.itemType}
                    item={it}
                    onClick={() => onOpenItem(it)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}