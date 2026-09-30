"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Heart, Share2, Phone, MessageCircle, ShieldCheck, MapPin, GraduationCap, Pencil, Send, Timer, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useLang, useAuth } from "@/lib/context";
import { isFav, toggleFav, getFavs } from "@/lib/favourites";
import { supabase } from "@/lib/supabase";
import { bumpStat } from "@/lib/stats";
import FollowButton from "./FollowButton";
import LikeButton from "./LikeButton";
import EditListingModal from "./EditListingModal";
import ListingCard from "./ListingCard";
import AllItemsView from "./AllItemsView";
import Navbar from "./Navbar";
import { UNIVERSITIES } from "@/lib/universities";

function normalizeLevel(level?: string): string {
  if (!level) return "Level 100";
  const map: Record<string, string> = {
    "Freshman": "100",
    "Junior": "200",
    "Sophomore": "300",
    "Senior": "400",
    "Graduate": "500",
  };
  return "Level " + (map[level] || level);
}

function normalize(item: any) {
  if (!item) return null;
  if (item.category) {
    return {
      ...item,
      kind: item.type === "event" ? "event" : "listing",
      title: item.title,
      price: item.price,
      image: item.image,
      images: Array.isArray(item.images) && item.images.length ? item.images : (item.image ? [item.image] : []),
      type: item.type,
      university: item.university,
      campus: item.campus,
      seller: item.seller,
      sellerAvatar: item.sellerAvatar,
      level: item.level,
      description: item.description,
      callNumber: item.callNumber,
      callNumber2: item.callNumber2,
      whatsappNumber: item.whatsappNumber,
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
      seller: "Event Organizer",
      sellerAvatar: item.organizerAvatar || "",
      level: "",
      description: item.venue + "  " + item.date + "  " + item.time,
      callNumber: item.callNumber,
      whatsappNumber: item.whatsappNumber,
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
    seller: item.vendor || "Campus Vendor",
    sellerAvatar: item.vendorAvatar || "",
    level: "",
    description: item.description || item.specialty || "",
    callNumber: item.callNumber,
    whatsappNumber: item.whatsappNumber,
    category: "food",
  };
}

function itemTypeOf(item: any): string {
  if (!item) return "listing";
  if (item.kind === "event") return "event";
  if (item.kind === "food") return "food";
  return "listing";
}

export default function ItemDetailModal({ selectedItem, setSelectedItem, hideSimilar }: { selectedItem: any; setSelectedItem: (item: any) => void; hideSimilar?: boolean }) {
  const { t } = useLang();
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState("newest");
  const [fCategory, setFCategory] = useState("all");
  const [fUniversity, setFUniversity] = useState("all");
  const [fPriceMin, setFPriceMin] = useState("");
  const [fPriceMax, setFPriceMax] = useState("");
  const [showContact, setShowContact] = useState(false);
  const [showAllView, setShowAllView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [favs, setFavs] = useState<string[]>([]);
  const [shareMsg, setShareMsg] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [allItems, setAllItems] = useState<any[]>([]);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<{ text: string; from: "me" | "seller"; ts: number }[]>([]);
  const [draft, setDraft] = useState("");
  const [nowTick, setNowTick] = useState(Date.now());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const WEEK = 7 * 24 * 60 * 60 * 1000;

  useEffect(() => {
    if (!selectedItem) return;
    setChatOpen(false);
    setDraft("");
    try {
      const raw = localStorage.getItem("campie-chat-" + selectedItem.id);
      let msgs: any[] = raw ? JSON.parse(raw) : [];
      msgs = msgs.filter((m) => Date.now() - m.ts < WEEK);
      localStorage.setItem("campie-chat-" + selectedItem.id, JSON.stringify(msgs));
      setChatMsgs(msgs);
    } catch {
      setChatMsgs([]);
    }
  }, [selectedItem]);

  useEffect(() => {
    if (!chatOpen) return;
    const iv = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [chatOpen]);

  const sendChat = () => {
    const text = draft.trim();
    if (!text || !selectedItem) return;
    const id = selectedItem.id;
    const msgs = [...chatMsgs, { text, from: "me" as const, ts: Date.now() }];
    setChatMsgs(msgs);
    localStorage.setItem("campie-chat-" + id, JSON.stringify(msgs));
    setDraft("");
    setTimeout(() => {
      setChatMsgs((prev) => {
        const next = [...prev, { text: "Thanks for your interest! I'm available — call me to arrange pickup.", from: "seller" as const, ts: Date.now() }];
        localStorage.setItem("campie-chat-" + id, JSON.stringify(next));
        return next;
      });
    }, 1200);
  };

  const chatExpires = chatMsgs.length ? chatMsgs[0].ts + WEEK - nowTick : 0;
  const fmtLeft = (ms: number) => {
    const d = Math.floor(ms / 86400000);
    const h = Math.floor(ms / 3600000) % 24;
    const m = Math.floor(ms / 60000) % 60;
    const s = Math.floor(ms / 1000) % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  useEffect(() => {
    setActiveImg(0);
  }, [selectedItem]);

  // Lock the background page while the detail window is open so there is only
  // one scrollbar (the window's own). It restores on close.
  useEffect(() => {
    if (!selectedItem) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selectedItem]);

  useEffect(() => {
    const load = () => {
      Promise.all([
        fetch("/api/listings").then((r) => r.json()).then((j) => j.data || []).catch(() => []),
        fetch("/api/events").then((r) => r.json()).then((j) => j.data || []).catch(() => []),
        fetch("/api/food").then((r) => r.json()).then((j) => j.data || []).catch(() => []),
      ]).then(([l, e, f]) => setAllItems([...l, ...e, ...f]));
    };
    load();
    window.addEventListener("listings-updated", load);
    return () => window.removeEventListener("listings-updated", load);
  }, []);

  useEffect(() => {
    const sync = () => setFavs(getFavs());
    sync();
    window.addEventListener("favs-updated", sync);
    return () => window.removeEventListener("favs-updated", sync);
  }, []);

  if (!selectedItem) return null;

  const item = normalize(selectedItem);
  if (!item) return null;

  // Record a view + clear any matching unread notification when an item is opened.
  useEffect(() => {
    const sel = selectedItem ? normalize(selectedItem) : null;
    if (!sel) return;
    const itemType = sel.kind === "event" ? "event" : sel.kind === "food" ? "food" : "listing";
    bumpStat(itemType, sel.id, "view");
    const clearNotif = async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess?.session?.access_token;
        if (!token) return;
        await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ itemType, itemId: sel.id }),
        });
        window.dispatchEvent(new Event("notifications-updated"));
      } catch {
        /* ignore */
      }
    };
    clearNotif();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem]);

  const isFood = item.kind === "food";

  const favorited = favs.includes(item.id);

  const onToggleFav = () => {
    toggleFav(item.id);
  };

  const shareItem = () => {
    const url = typeof window !== "undefined" ? window.location.origin + "/?item=" + encodeURIComponent(item.id) : "";
    const text = item.title + " - " + (item.kind === "event" && item.price === 0 ? "FREE" : "GH₵ " + item.price.toLocaleString()) + " on Campie";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        navigator.share({ title: "Campie", text, url }).catch(() => {});
        return;
      }
    } catch {}
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(text + " " + url).then(() => {}, () => fallbackCopy(text + " " + url));
      } else {
        fallbackCopy(text + " " + url);
      }
    } catch {
      fallbackCopy(text + " " + url);
    }
    setShareMsg("Link copied!");
    setTimeout(() => setShareMsg(""), 1500);
  };

  const fallbackCopy = (value: string) => {
    try {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch {}
  };

  const similarItems = allItems
    .map(normalize)
    .filter(Boolean)
    .filter((x: any) =>
      item.kind === "event"
        ? x.kind === "event" && x.id !== item.id
        : x.kind === "listing" && x.category === item.category && x.id !== item.id
    );

  const moreFromSeller = allItems
    .map(normalize)
    .filter(Boolean)
    .filter(
      (x: any) =>
        x.seller && item.seller && x.seller === item.seller && x.id !== item.id
    );

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

  const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
  ];

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

  const applyFilters = (list: any[]) =>
    list.filter(
      (x: any) =>
        categoryMatches(x.category, fCategory) &&
        universityMatches(x.university, fUniversity) &&
        (!fPriceMin || x.price >= Number(fPriceMin)) &&
        (!fPriceMax || x.price <= Number(fPriceMax))
    );

  const applySort = (list: any[]) =>
    [...list].sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      return 0;
    });

  const filteredSimilar = applySort(applyFilters(similarItems));
  const filteredMoreFromSeller = applySort(applyFilters(moreFromSeller));

  const badgeClass =
    item.type === "sale"
      ? "bg-orange-500"
      : item.type === "rent"
      ? "bg-emerald-500"
      : item.type === "food"
      ? "bg-red-500"
      : "bg-purple-500";

  const filterBar = (onBack: () => void) => (
    <div className="sticky top-16 z-20 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-2">
        <button
          onClick={onBack}
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-3 -mt-0.5 flex flex-wrap items-center gap-2.5">
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
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );

  const renderItemCard = (sim: any, onClick: () => void) => (
    <ListingCard key={sim.id} item={sim} onClick={onClick} />
  );

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-950 overflow-y-auto overscroll-contain">
      {/* Site Header */}
      <Navbar />

      {/* Top Filter / Sort Bar */}
      {filterBar(() => { setSelectedItem(null); setShowContact(false); })}

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Item Detail Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Image Panel */}
          <div>
            <div
              className="relative w-full rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-800"
              onTouchStart={(e) => {
                touchStartX.current = e.touches[0].clientX;
                touchStartY.current = e.touches[0].clientY;
              }}
              onTouchEnd={(e) => {
                if (touchStartX.current === null || touchStartY.current === null) return;
                const dx = e.changedTouches[0].clientX - touchStartX.current;
                const dy = e.changedTouches[0].clientY - touchStartY.current;
                touchStartX.current = null;
                touchStartY.current = null;
                if (!item.images || item.images.length < 2) return;
                if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
                if (dx < 0) setActiveImg((i) => (i + 1) % item.images.length);
                else setActiveImg((i) => (i - 1 + item.images.length) % item.images.length);
              }}
            >
              <img
                src={(item.images && item.images.length ? item.images[activeImg] : item.image) || item.image}
                alt={item.title}
                className="w-full h-auto object-cover"
              />
              {item.images && item.images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImg((i) => (i - 1 + item.images.length) % item.images.length)}
                    aria-label="Previous image"
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/70 active:bg-black/70 transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActiveImg((i) => (i + 1) % item.images.length)}
                    aria-label="Next image"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/70 active:bg-black/70 transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              {item.images && item.images.length > 1 && (
                <span className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-lg">
                  {activeImg + 1} / {item.images.length}
                </span>
              )}
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 text-xs font-bold rounded-full text-white ${badgeClass}`}>
                  {item.type.toUpperCase()}
                </span>
              </div>
            </div>
            {item.images && item.images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {item.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition ${
                      i === activeImg
                        ? "border-green-500"
                        : "border-gray-200 dark:border-gray-700 hover:border-green-300"
                    }`}
                  >
                    <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details Panel */}
          <div className="flex flex-col">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                {item.sellerAvatar ? (
                  <img
                    src={item.sellerAvatar}
                    alt={item.seller}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">
                    {(item.seller || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.seller}</p>
                  {item.user_id && item.user_id !== user?.id && (
                    <div className="mt-1.5">
                      <FollowButton sellerId={item.user_id} sellerName={item.seller} />
                    </div>
                  )}
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 break-words">{item.title}</h2>
              <div className="flex items-baseline gap-2 mb-4">
                <p className={`text-3xl font-bold ${isFood ? "text-orange-500" : "text-green-600"}`}>{item.kind === "event" && item.price === 0 ? "FREE" : "GH₵ " + item.price.toLocaleString()}</p>
                {item.initialPrice > 0 && (
                  <p className="text-lg text-gray-400 line-through">GH₵ {item.initialPrice.toLocaleString()}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <MapPin className="w-3.5 h-3.5 text-green-600" />
                  {item.university}{item.campus ? " · " + item.campus : ""}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <GraduationCap className="w-3.5 h-3.5 text-green-600" />
                  {normalizeLevel(item.level)}
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6 break-words whitespace-pre-wrap">
                {item.description}
              </p>

              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Campus Verified Seller</p>
              </div>
            </div>

            {item.kind === "listing" && user && item.seller === user.name && (
              <button
                onClick={() => setShowEdit(true)}
                className="w-full mb-3 py-2.5 flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold rounded-full hover:opacity-90 transition"
              >
                <Pencil className="w-4 h-4" /> Edit Listing
              </button>
            )}

            <div className="flex items-center gap-3 mt-6 md:flex-col md:items-stretch md:gap-2.5">
              {!showContact ? (
                <>
                  <button
                    onClick={() => setChatOpen(!chatOpen)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-2.5 bg-white dark:bg-gray-800 border-2 ${
                  isFood
                    ? "border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    : "border-green-500 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                } font-bold rounded-full transition`}
                  >
                    <MessageCircle className="w-4 h-4" /> Chat
                  </button>
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
                        setShowContact(true);
                      } else {
                        setContactOpen(true);
                      }
                      bumpStat(itemTypeOf(item), item.id, "click");
                    }}
                    className={`flex-1 py-3 md:py-2.5 ${
                      isFood ? "bg-orange-500 hover:bg-orange-600" : "bg-green-500 hover:bg-green-600"
                    } text-white font-bold rounded-full transition`}
                  >
                    <span className="md:hidden flex items-center justify-center"><Phone className="w-5 h-5" /></span>
                    <span className="hidden md:inline-flex items-center justify-center gap-2"><Phone className="w-4 h-4" /> Contact Seller</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setChatOpen(!chatOpen)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-2.5 bg-white dark:bg-gray-800 border-2 ${
                  isFood
                    ? "border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    : "border-green-500 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                } font-bold rounded-full transition`}
                  >
                    <MessageCircle className="w-4 h-4" /> Chat
                  </button>
                  <a
                    href={`tel:${item.callNumber || ""}`}
                    onClick={() => bumpStat(itemTypeOf(item), item.id, "click")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-2.5 ${
                  isFood ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-500 hover:bg-blue-600"
                } text-white font-bold rounded-full transition`}
                  >
                    <Phone className="w-4 h-4" /> Call
                  </a>
                  {(item.callNumber2 || item.whatsappNumber) ? (
                    <a
                      href={`tel:${item.callNumber2 || item.whatsappNumber || ""}`}
                      onClick={() => bumpStat(itemTypeOf(item), item.id, "click")}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-2.5 ${
                  isFood ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-500 hover:bg-blue-600"
                } text-white font-bold rounded-full transition`}
                    >
                      <Phone className="w-4 h-4" /> Call 2
                    </a>
                  ) : null}
                </>
              )}
              <button
                onClick={onToggleFav}
                className={`p-3 border rounded-xl md:w-full md:py-2.5 md:px-4 md:flex md:items-center md:justify-center md:gap-2 md:rounded-full transition ${
                  favorited
                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <Heart className={`w-5 h-5 md:w-4 md:h-4 ${favorited ? "text-red-500 fill-red-500" : "text-gray-600 dark:text-gray-400"}`} />
                <span className="hidden md:inline text-sm font-bold">{favorited ? "Added to Watchlist" : "Add to Watchlist"}</span>
              </button>
              <button
                onClick={shareItem}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl md:w-full md:py-2.5 md:px-4 md:flex md:items-center md:justify-center md:gap-2 md:rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <Share2 className="w-5 h-5 md:w-4 md:h-4 text-gray-600 dark:text-gray-400" />
                <span className="hidden md:inline text-sm font-bold">Share</span>
              </button>
              <LikeButton
                itemType={itemTypeOf(item)}
                itemId={item.id}
                initialCount={item.likeCount}
                liked={item.liked}
                variant="inline"
                iconSize={14}
                className="md:w-full"
              />
            </div>
            {shareMsg && (
              <p className="text-xs font-semibold text-green-600 mt-2 text-center">{shareMsg}</p>
            )}

            {/* Mobile contact menu: two call options pop up */}
            {contactOpen && (
              <>
                <div className="fixed inset-0 z-[65] md:hidden" onClick={() => setContactOpen(false)} />
                <div className="fixed inset-x-4 bottom-6 z-[70] md:hidden max-w-md mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 animate-in slide-in-from-bottom-4 duration-200 pb-[env(safe-area-inset-bottom)]">
                  <div className="flex items-center justify-between px-1 pb-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Contact {item.seller}</p>
                    <button
                      onClick={() => setContactOpen(false)}
                      className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label="Close contact menu"
                    >
                      <span className="text-2xl leading-none">×</span>
                    </button>
                  </div>
                  <a
                    href={`tel:${item.callNumber || ""}`}
                    className={`flex items-center gap-3 px-3 py-3 rounded-2xl ${
                      isFood
                        ? "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300"
                        : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                    } font-bold text-sm mb-2`}
                  >
                    <span className={`w-9 h-9 rounded-full ${isFood ? "bg-orange-500" : "bg-green-500"} text-white flex items-center justify-center`}>
                      <Phone className="w-4 h-4" />
                    </span>
                    Call {item.callNumber}
                  </a>
                  {(item.callNumber2 || item.whatsappNumber) ? (
                    <a
                      href={`tel:${item.callNumber2 || item.whatsappNumber || ""}`}
                      className={`flex items-center gap-3 px-3 py-3 rounded-2xl ${
                        isFood
                          ? "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300"
                          : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      } font-bold text-sm`}
                    >
                      <span className={`w-9 h-9 rounded-full ${isFood ? "bg-orange-500" : "bg-blue-500"} text-white flex items-center justify-center`}>
                        <Phone className="w-4 h-4" />
                      </span>
                      Call 2 {item.callNumber2 || item.whatsappNumber}
                    </a>
                  ) : null}
                </div>
              </>
            )}

            {chatOpen && (
              <>
                <div
                  className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-[1px]"
                  onClick={() => setChatOpen(false)}
                />
                <div className={`fixed z-[75] inset-x-0 bottom-0 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:bottom-6 md:w-[420px] max-h-[75vh] flex flex-col bg-white dark:bg-gray-900 border-2 ${isFood ? "border-orange-500" : "border-green-500"} rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-200 pb-[env(safe-area-inset-bottom)]`}
                >
                  <div className={`flex items-center justify-between px-4 py-3 ${isFood ? "bg-orange-50 dark:bg-orange-900/20 border-b-2 border-orange-500" : "bg-green-50 dark:bg-green-900/20 border-b-2 border-green-500"}`}>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Chat with {item.seller}</p>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-red-500">
                        <Timer className="w-3.5 h-3.5" />
                        Disappears in {fmtLeft(Math.max(0, chatExpires))}
                      </span>
                      <button
                        onClick={() => setChatOpen(false)}
                        className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition"
                        aria-label="Close chat"
                      >
                        <span className="text-xl leading-none">×</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 overscroll-contain">
                    {chatMsgs.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">No messages yet — start the conversation.</p>
                    )}
                    {chatMsgs.map((m, i) => (
                      <div
                        key={i}
                        className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm break-words ${
                          m.from === "me"
                            ? "bg-green-500 text-white ml-auto rounded-br-sm"
                            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm"
                        }`}
                      >
                        {m.text}
                      </div>
                    ))}
                  </div>
                  {chatMsgs.length > 0 && (
                    <p className="px-4 pb-2 text-[11px] text-gray-400">Messages auto-delete 7 days after this chat starts.</p>
                  )}
                  <div className="flex items-center gap-2 p-3 border-t border-gray-200 dark:border-gray-700">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-green-500 transition"
                    />
                    <button
                      onClick={sendChat}
                      className={`p-2.5 rounded-full ${isFood ? "bg-orange-500 hover:bg-orange-600" : "bg-green-500 hover:bg-green-600"} text-white transition`}
                      aria-label="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Similar Items Beneath */}
        {!hideSimilar && item.kind !== "food" && filteredSimilar.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Similar Items</h3>
              <button
                onClick={() => { setFCategory("all"); setFUniversity("all"); setFPriceMin(""); setFPriceMax(""); setShowAllView(true); }}
                className="text-sm font-semibold text-green-600 hover:text-green-700 transition"
              >
                See all
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredSimilar.slice(0, 4).map((sim) =>
                renderItemCard(sim, () => { setSelectedItem(sim); setShowContact(false); })
              )}
            </div>
          </div>
        )}

        {/* More from Seller */}
        {filteredMoreFromSeller.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              More from {item.seller}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredMoreFromSeller.map((sim) =>
                renderItemCard(sim, () => { setSelectedItem(sim); setShowContact(false); })
              )}
            </div>
          </div>
        )}
      </div>

      {/* All Items Full View */}
      {showAllView && (
        <AllItemsView
          onClose={() => setShowAllView(false)}
          onOpenItem={(it) => {
            setSelectedItem(it);
            setShowAllView(false);
            setShowContact(false);
          }}
        />
      )}

      {showEdit && item.kind === "listing" && (
        <EditListingModal
          item={item}
          onClose={(updated) => {
            setShowEdit(false);
            if (updated) {
              setSelectedItem(updated);
            }
          }}
          onDeleted={() => {
            setShowEdit(false);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
}