"use client";

import { useState, useEffect, useRef } from "react";
import {
  Phone,
  Star,
  Clock,
  MapPin,
  UtensilsCrossed,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useLang, useModal, useAuth } from "@/lib/context";
import type { FoodItem } from "@/lib/mockData";
import ItemDetailModal from "./ItemDetailModal";

const FILTERS = ["All", "Local", "Snack", "Healthy", "Drinks"];

export default function FoodSection() {
  const { t } = useLang();
  const { openPostModal } = useModal();
  const { user, setShowAuthModal, setAuthMode, setShowProfileModal } = useAuth();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [showContact, setShowContact] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const openListFood = () => {
    if (user) {
      if (!user.university || !user.campus || !user.level) {
        setShowProfileModal(true);
        return;
      }
      openPostModal("food");
    } else {
      setAuthMode("signin");
      setShowAuthModal(true);
    }
  };

  const scrollMarquee = (dir: number) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector(".marquee-track > div");
    const step = card ? card.clientWidth + 24 : 200;
    track.scrollBy({ left: dir * step * 2, behavior: "smooth" });
  };

  useEffect(() => {
    const load = () => {
      fetch("/api/food")
        .then((r) => r.json())
        .then((j) => setFoods(j.data || []))
        .catch(() => setFoods([]));
    };
    load();
    window.addEventListener("listings-updated", load);
    return () => window.removeEventListener("listings-updated", load);
  }, []);

  const filtered = activeFilter === "All"
    ? foods
    : foods.filter((f) =>
        f.tags.some((tag) => tag.toLowerCase().startsWith(activeFilter.toLowerCase()))
      );

  return (
    <section id="food" className="py-14 bg-gradient-to-br from-white via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-600 dark:text-orange-400 text-sm font-semibold mb-3">
            <UtensilsCrossed className="w-4 h-4" />
            Campus Food Corner
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
            {t("foodSection")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">{t("foodSub")}</p>
        </div>

        {/* Filter Tags */}
        <div className="flex gap-2 flex-wrap justify-center mb-4">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                activeFilter === f
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-orange-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Food Row */}
        <div className="relative">
          <button
            onClick={() => scrollMarquee(-1)}
            className="hidden md:block absolute left-1 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Scroll food left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scrollMarquee(1)}
            className="hidden md:block absolute right-1 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Scroll food right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        <div className="overflow-hidden">
          <div ref={trackRef} className="flex overflow-x-auto no-scrollbar">
            <div className="marquee-track flex w-max gap-6 will-change-transform pb-2">
            {[...filtered, ...filtered].map((food, i) => (
              <div
                key={`${food.id}-${i}`}
                className="flex-none w-64 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer"
                onClick={() => { setSelectedFood(food); setShowContact(null); }}
              >
              {/* Food Image Panel */}
              <div className="relative w-full overflow-hidden bg-orange-50 dark:bg-gray-800 border border-orange-100 dark:border-gray-800 rounded-2xl">
                <img
                  src={food.image}
                  alt={food.name}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Availability Badge */}
                <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold ${
                  food.available
                    ? "bg-green-500 text-white"
                    : "bg-gray-500 text-white"
                }`}>
                  {food.available ? t("available") : t("soldOut")}
                </div>
                {/* Rating */}
                <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full px-2 py-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{food.rating}</span>
                </div>
                {/* Price Badge */}
                <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl px-3 py-1.5">
                  <span className="text-lg font-extrabold text-orange-600 dark:text-orange-400">GH₵ {food.price}</span>
                </div>
              </div>

              {/* Details directly on app background */}
              <div className="p-2 flex flex-col gap-1.5">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug line-clamp-1">{food.name}</h3>
                <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold truncate">{food.specialty}</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2">{food.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {food.university}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Orders open
                  </span>
                </div>

                {showContact === food.id ? (
                  <div className="mt-auto pt-1 flex gap-2">
                    <a
                      href={`tel:${food.callNumber}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {t("callSeller")}
                    </a>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowContact(food.id); }}
                    disabled={!food.available}
                    className={`mt-auto w-full py-2.5 rounded-xl text-sm font-bold transition ${
                      food.available
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {food.available ? t("orderNow") : t("soldOut")}
                  </button>
                )}
              </div>
            </div>
          ))}
            </div>
            </div>
        </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-10">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Are you a food vendor on campus?</p>
          <button
            onClick={openListFood}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full text-sm transition shadow-lg shadow-orange-200 dark:shadow-orange-900/40"
          >
            List Your Food Business
          </button>
        </div>
      </div>

      <ItemDetailModal selectedItem={selectedFood} setSelectedItem={setSelectedFood} />
    </section>
  );
}
