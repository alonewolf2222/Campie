"use client";
import { useState, useEffect } from "react";
import {
  BookOpen,
  Laptop,
  Sofa,
  Bike,
  Shirt,
  Dumbbell,
  Ticket,
  UtensilsCrossed,
  Tv2,
  BedDouble,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  SlidersHorizontal,
  LayoutGrid,
  X,
  Package,
} from "lucide-react";
import { useLang } from "@/lib/context";
import { useUniversity } from "@/lib/context";
import type { Listing } from "@/lib/mockData";
import ItemDetailModal from "./ItemDetailModal";
import ListingCard from "./ListingCard";
import AllItemsView from "./AllItemsView";
import { apiGet } from "@/lib/stats";

const CATEGORIES = [
  { icon: BookOpen, key: "textbooksStudy" as const },
  { icon: Laptop, key: "laptopsTech" as const },
  { icon: Sofa, key: "furnitureDecor" as const },
  { icon: Bike, key: "bicyclesTransit" as const },
  { icon: Shirt, key: "clothingShoes" as const },
  { icon: Dumbbell, key: "sportsOutdoors" as const },
  { icon: Ticket, key: "ticketsEvents" as const },
  { icon: UtensilsCrossed, key: "foodDrinks" as const },
  { icon: Tv2, key: "electronics" as const },
  { icon: BedDouble, key: "dormEssentials" as const },
  { icon: ShoppingBag, key: "bagsAccessories" as const },
  { icon: Sparkles, key: "animeCollectibles" as const },
  { icon: Package, key: "others" as const },
];

const SORT_OPTIONS = ["Newest", "Price: Low-High", "Price: High-Low"];

export default function ListingsSection() {
  const { t } = useLang();
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sort, setSort] = useState("Newest");
  const [showSafetyGuide, setShowSafetyGuide] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Listing | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);

  useEffect(() => {
    const load = () => {
      apiGet("/api/listings")
        .then((r) => (r ? r.json() : { data: [] }))
        .then((j) => setListings(j.data || []))
        .catch(() => setListings([]));
    };
    load();
    window.addEventListener("listings-updated", load);
    return () => window.removeEventListener("listings-updated", load);
  }, []);

  const { selectedUniversity } = useUniversity();

  const categoryFiltered = activeCategory
    ? listings.filter((l) => {
        const a = (l.category || "").toLowerCase();
        const b = activeCategory.toLowerCase();
        if ((a === "other" || a === "others") && (b === "other" || b === "others")) return true;
        return a === b;
      })
    : listings;

  const filtered = selectedUniversity
    ? categoryFiltered.filter(
        (l) =>
          l.university === selectedUniversity ||
          l.university.toLowerCase().includes(selectedUniversity.toLowerCase())
      )
    : categoryFiltered;

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "Price: Low-High") return a.price - b.price;
    if (sort === "Price: High-Low") return b.price - a.price;
    return 0;
  });

  const visible = sorted.slice(0, 10);

  const renderCategories = (expanded: boolean, onPick: () => void) => (
    <ul className="space-y-1">
      <li>
        <button
          onClick={() => {
            setActiveCategory(null);
            onPick();
          }}
          className={`w-full flex items-center ${expanded ? "justify-start" : "justify-center"} gap-2 px-3 py-2 rounded-lg text-sm transition ${
            activeCategory === null
              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 font-semibold"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <LayoutGrid className="w-4 h-4 shrink-0" />
          <span className={`${expanded ? "inline" : "hidden"} whitespace-nowrap`}>All Items</span>
        </button>
      </li>
      {CATEGORIES.map(({ icon: Icon, key }) => (
        <li key={key}>
          <button
            onClick={() => {
              setActiveCategory(t(key));
              onPick();
            }}
            className={`w-full flex items-center ${expanded ? "justify-start" : "justify-center"} gap-2 px-3 py-2 rounded-lg text-sm transition ${
              activeCategory === t(key)
                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 font-semibold"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className={`${expanded ? "inline" : "hidden"} whitespace-nowrap`}>{t(key)}</span>
          </button>
        </li>
      ))}
    </ul>
  );

  const renderSafety = () => (
    <div className="rounded-2xl p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
        <h4 className="font-bold text-sm text-red-900 dark:text-red-200">
          {t("safetyFirst")}
        </h4>
      </div>
      <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed mb-2">
        {t("safetyTip")}
      </p>
      {showSafetyGuide && (
        <div className="text-xs text-red-700 dark:text-red-300 whitespace-pre-line mb-2">
          {t("safetyRules")}
        </div>
      )}
      <button
        onClick={() => setShowSafetyGuide(!showSafetyGuide)}
        className="text-xs text-red-900 dark:text-red-200 font-semibold flex items-center gap-1 hover:underline"
      >
        {t("viewSafetyGuide")}{" "}
        <ChevronRight
          className={`w-3 h-3 transition-transform ${
            showSafetyGuide ? "rotate-90" : ""
          }`}
        />
      </button>
    </div>
  );

  return (
    <section id="buy" className="py-10 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar (desktop only) */}
          <aside className="hidden lg:block shrink-0 w-56">
            {/* Compact categories bar: one line of icons, expands on hover */}
            <div
              onMouseEnter={() => setCatOpen(true)}
              onMouseLeave={() => setCatOpen(false)}
              className="bg-white dark:bg-gray-900 rounded-2xl p-2.5"
            >
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  title="All Items"
                  onClick={() => setActiveCategory(null)}
                  className={`shrink-0 p-2 rounded-lg transition flex items-center justify-center ${
                    activeCategory === null
                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                {CATEGORIES.map(({ icon: Icon, key }) => (
                  <button
                    key={key}
                    title={t(key)}
                    onClick={() => setActiveCategory(t(key))}
                    className={`shrink-0 p-2 rounded-lg transition flex items-center justify-center ${
                      activeCategory === t(key)
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
              <div
                className={`grid grid-cols-1 gap-0.5 transition-all duration-200 overflow-hidden ${
                  catOpen ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0"
                }`}
              >
                {renderCategories(true, () => {})}
              </div>
            </div>
            {/* Safety First fills the space below the categories */}
            <div className="mt-4">
              {renderSafety()}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMobileCatOpen(true)}
                  className="lg:hidden p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 shadow-sm"
                  aria-label="Browse categories"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                </button>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  {t("trending")}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowAllItems(true)}
                  className="px-4 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 transition"
                >
                  See all
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t("sortBy")}:
                </span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 outline-none cursor-pointer"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Trending grid: masonry-style, listings flow into available space */}
            <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4">
              {visible.map((item) => (
                <div key={item.id} className="mb-4 break-inside-avoid">
                  <ListingCard item={item} onClick={() => setSelectedItem(item)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Safety card - mobile only (desktop shows it in the sidebar) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 lg:hidden">
        {renderSafety()}
      </div>

      {/* Mobile categories drawer (slides in from the left, same level as trending header) */}
      {mobileCatOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileCatOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-gray-950 shadow-2xl overflow-y-auto p-4 animate-in slide-in-from-left-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                  {t("browseCategories")}
                </span>
              </div>
              <button
                onClick={() => setMobileCatOpen(false)}
                className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close categories"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderCategories(true, () => setMobileCatOpen(false))}
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      <ItemDetailModal
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
      />

      {/* All Items page (full catalog) */}
      {showAllItems && (
        <AllItemsView
          onClose={() => setShowAllItems(false)}
          onOpenItem={(item) => {
            setSelectedItem(item);
            setShowAllItems(false);
          }}
        />
      )}
    </section>
  );
}