"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  SlidersHorizontal,
  ChevronDown,
  PackageOpen,
} from "lucide-react";
import Navbar from "./Navbar";
import ListingCard from "./ListingCard";
import { UNIVERSITIES } from "@/lib/universities";

const FILTER_CATEGORIES = [
  { value: "Textbooks & Study", label: "Textbooks & Study" },
  { value: "Laptops & Tech", label: "Laptops & Tech" },
  { value: "Furniture & Decor", label: "Furniture & Decor" },
  { value: "Bicycles & Transit", label: "Bicycles & Transit" },
  { value: "Clothing & Shoes", label: "Clothing & Shoes" },
  { value: "Sports & Outdoors", label: "Sports & Outdoors" },
  { value: "Electronics", label: "Electronics" },
  { value: "Dorm Essentials", label: "Dorm Essentials" },
  { value: "Bags & Accessories", label: "Bags & Accessories" },
  { value: "Anime & Collectibles", label: "Anime & Collectibles" },
  { value: "Food & Drinks", label: "Food & Drinks" },
  { value: "Others", label: "Others" },
  { value: "events", label: "Events" },
  { value: "food", label: "Food" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

function normalize(item: any) {
  if (!item) return null;
  if (item.category) {
    return {
      ...item,
      kind: item.type === "event" ? "event" : "listing",
      title: item.title,
      price: item.price,
      image: item.image,
      type: item.type,
      university: item.university,
      category: item.category,
    };
  }
  if (item.venue !== undefined) {
    return {
      ...item,
      kind: "event",
      title: item.title,
      price: item.price,
      image: item.image,
      type: "event",
      university: item.university,
      category: "events",
    };
  }
  return {
    ...item,
    kind: "food",
    title: item.name || item.title,
    price: item.price,
    image: item.image,
    type: "food",
    university: item.university,
    category: "food",
  };
}

const universityMatches = (itemUni: string | undefined, sel: string) => {
  if (sel === "all") return true;
  const opt = UNIVERSITIES.find((u) => u.abbr === sel);
  const val = (itemUni || "").trim().toLowerCase();
  if (!val) return false;
  if (!opt) return val === sel.toLowerCase();
  const name = opt.name.toLowerCase();
  const abbr = opt.abbr.toLowerCase();
  return (
    val === abbr ||
    val === name ||
    name.includes(val) ||
    val.includes(name) ||
    (abbr.length >= 3 && val.includes(abbr))
  );
};

const categoryMatches = (itemCat: string | undefined, sel: string) => {
  if (sel === "all") return true;
  const a = String(itemCat || "").trim().toLowerCase();
  const b = sel.trim().toLowerCase();
  if (a === b) return true;
  if ((a === "other" || a === "others") && (b === "other" || b === "others")) return true;
  return false;
};

export default function AllItemsView({
  onClose,
  onOpenItem,
  initialCategory = "all",
  initialUniversity = "all",
  excludeId,
}: {
  onClose: () => void;
  onOpenItem: (item: any) => void;
  initialCategory?: string;
  initialUniversity?: string;
  excludeId?: string;
}) {
  const [allItems, setAllItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fCategory, setFCategory] = useState(initialCategory);
  const [fUniversity, setFUniversity] = useState(initialUniversity);
  const [fPriceMin, setFPriceMin] = useState("");
  const [fPriceMax, setFPriceMax] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/listings").then((r) => r.json()).then((j) => j.data || []).catch(() => []),
      fetch("/api/events").then((r) => r.json()).then((j) => j.data || []).catch(() => []),
      fetch("/api/food").then((r) => r.json()).then((j) => j.data || []).catch(() => []),
    ])
      .then(([l, e, f]) => {
        setAllItems([...l, ...e, ...f]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    window.addEventListener("listings-updated", load);
    return () => window.removeEventListener("listings-updated", load);
  }, [load]);

  // Lock the background page while the catalog window is open so there is only
  // one scrollbar (the window's own).
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const entries = allItems
    .map((raw: any) => ({ n: normalize(raw), raw }))
    .filter((e: any) => e.n && e.n.id !== excludeId);

  const normalized = entries.map((e: any) => e.n);

  const filtered = normalized
    .filter(
      (x: any) =>
        categoryMatches(x.category, fCategory) &&
        universityMatches(x.university, fUniversity) &&
        (!fPriceMin || x.price >= Number(fPriceMin)) &&
        (!fPriceMax || x.price <= Number(fPriceMax))
    )
    .sort((a: any, b: any) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      return 0;
    });

  const rawFor = (n: any) => {
    const entry = entries.find((e: any) => e.n.id === n.id);
    return entry ? entry.raw : n;
  };

  return (
    <div className="fixed inset-0 z-[60] bg-gray-50 dark:bg-gray-950 overflow-y-auto overscroll-contain">
      <Navbar />

      {/* Sticky Filter / Sort Bar */}
      <div className="sticky top-16 z-20 bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-1.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Sort &amp; Filter
            <ChevronDown className={`w-4 h-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
        {filtersOpen && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 -mt-0.5 flex flex-wrap items-center gap-2.5">
            <select
              value={fCategory}
              onChange={(e) => setFCategory(e.target.value)}
              className="text-sm px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 outline-none max-w-full"
            >
              <option value="all">All Categories</option>
              {FILTER_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              value={fUniversity}
              onChange={(e) => setFUniversity(e.target.value)}
              className="text-sm px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 outline-none max-w-[160px] sm:max-w-none min-w-0 truncate"
            >
              <option value="all">All Schools</option>
              {UNIVERSITIES.map((u) => (
                <option key={u.id} value={u.abbr}>{u.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                placeholder="Min GH₵"
                value={fPriceMin}
                onChange={(e) => setFPriceMin(e.target.value)}
                className="w-20 sm:w-24 text-sm px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 outline-none placeholder:text-gray-400"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                min="0"
                placeholder="Max GH₵"
                value={fPriceMax}
                onChange={(e) => setFPriceMax(e.target.value)}
                className="w-20 sm:w-24 text-sm px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 outline-none placeholder:text-gray-400"
              />
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 outline-none"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              All Items ({loading ? "…" : filtered.length})
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Browse the complete marketplace catalog
            </p>
          </div>
        </div>

        {loading ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="mb-4 break-inside-avoid">
                <div className="w-full aspect-[4/3] rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                <div className="p-2.5 space-y-2">
                  <div className="h-3 rounded bg-gray-200 dark:bg-gray-800 animate-pulse w-3/4" />
                  <div className="h-3 rounded bg-gray-200 dark:bg-gray-800 animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <PackageOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">
              No items found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              No items match your filters. Try widening your search.
            </p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4">
            {filtered.map((item: any) => (
              <div key={item.id} className="mb-4 break-inside-avoid">
                <ListingCard
                  item={item}
                  onClick={() => onOpenItem(rawFor(item))}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}