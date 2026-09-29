"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Plus, X, ShoppingBag, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { useLang, useModal } from "@/lib/context";
import type { Listing } from "@/lib/mockData";
import ItemDetailModal from "./ItemDetailModal";

const ICONS = {
  bags: ShoppingBag,
  anime: Sparkles,
} as const;

export default function GoodsSection({
  category,
  badge,
  icon,
  accent,
  title,
  subtitle,
}: {
  category: string;
  badge: string;
  icon: keyof typeof ICONS;
  accent: string;
  title: string;
  subtitle: string;
}) {
  const BadgeIcon = ICONS[icon];
  const { t } = useLang();
  const { setShowPostModal } = useModal();
  const [items, setItems] = useState<Listing[]>([]);
  const [selectedItem, setSelectedItem] = useState<Listing | null>(null);
  const [showAll, setShowAll] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollMarquee = (dir: number) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector(".marquee-track > div");
    const step = card ? card.clientWidth + 24 : 200;
    track.scrollBy({ left: dir * step * 2, behavior: "smooth" });
  };

  useEffect(() => {
    const load = () => {
      fetch("/api/listings")
        .then((r) => r.json())
        .then((j) =>
          setItems(
            (j.data || []).filter((l: Listing) => l.category === category)
          )
        )
        .catch(() => setItems([]));
    };
    load();
    window.addEventListener("listings-updated", load);
    return () => window.removeEventListener("listings-updated", load);
  }, [category]);

  const visible = showAll ? items : items.slice(0, 10);

  const renderCard = (item: Listing, keySuffix: string) => (
    <div
      key={`${item.id}-${keySuffix}`}
      onClick={() => setSelectedItem(item)}
      className="group transition-all cursor-pointer"
    >
      <div className="relative w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {item.type === "sale" ? (
          <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">SALE</span>
        ) : (
          <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">RENT</span>
        )}
        <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl px-3 py-1.5">
          <span className="text-lg font-extrabold text-gray-900 dark:text-white">
            {item.type === "event" && item.price === 0 ? "FREE" : "GH₵ " + item.price.toLocaleString()}
          </span>
        </div>
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
            <span className="text-[11px] text-gray-400">/ {item.rentPeriod}</span>
          )}
        </div>
        <p className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 break-words">
          <MapPin className="w-3 h-3 text-gray-400 dark:text-gray-500" />
          {item.university}
        </p>
      </div>
    </div>
  );

  return (
    <section className={`py-14 bg-gradient-to-br from-white via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 mb-8 md:flex-row md:justify-between">
          <div className="text-center md:text-left">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-3 ${accent}`}>
              <BadgeIcon className="w-4 h-4" />
              {badge}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">{title}</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl">{subtitle}</p>
          </div>
          <button
            onClick={() => setShowPostModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full text-sm transition shadow-lg shadow-green-200 dark:shadow-green-900/40"
          >
            <Plus className="w-4 h-4" />
            {t("sellItems")}
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            <BadgeIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Nothing listed here yet — be the first to sell.
            </p>
            <button
              onClick={() => setShowPostModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full text-sm transition"
            >
              <Plus className="w-4 h-4" />
              Post an Item
            </button>
          </div>
        ) : showAll ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {visible.map((item) => renderCard(item, "grid"))}
          </div>
        ) : (
          <div className="relative">
          <button
            onClick={() => scrollMarquee(-1)}
            className="hidden md:block absolute left-1 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Scroll goods left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scrollMarquee(1)}
            className="hidden md:block absolute right-1 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Scroll goods right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="overflow-hidden">
            <div ref={trackRef} className="flex overflow-x-auto no-scrollbar">
            <div className="marquee-track flex w-max gap-6 will-change-transform pb-2">
              {[...items, ...items].map((item, i) => (
                <div key={`gm-${item.id}-${i}`} className="flex-none w-56 sm:w-64">
                  {renderCard(item, `m-${i}`)}
                </div>
              ))}
            </div>
            </div>
          </div>
          </div>
        )}

        {items.length > 0 && (
          <div className="text-center mt-10">
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-semibold rounded-full text-sm border border-gray-200 dark:border-gray-700 hover:border-green-400 hover:text-green-600 dark:hover:text-green-400 transition"
            >
              <X className="w-4 h-4 rotate-45" />
              {showAll ? "Back to Marquee" : `${t("viewAll")} (${items.length})`}
            </button>
          </div>
        )}
      </div>

      <ItemDetailModal selectedItem={selectedItem} setSelectedItem={setSelectedItem} />
    </section>
  );
}