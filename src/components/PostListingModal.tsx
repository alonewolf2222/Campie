"use client";

import { useRef, useState } from "react";
import { X, Upload, Phone, Camera, Video, ImagePlus } from "lucide-react";
import { useLang, useModal, useAuth } from "@/lib/context";
import { supabase } from "@/lib/supabase";

type ListingType = "sale" | "rent" | "event" | "food";

const CATEGORIES = [
  "Textbooks & Study", "Laptops & Tech", "Furniture & Decor",
  "Bicycles & Transit", "Clothing & Shoes", "Sports & Outdoors",
  "Electronics", "Dorm Essentials", "Food & Drinks",
  "Bags & Accessories", "Anime & Collectibles", "Others",
];

export default function PostListingModal() {
  const { t } = useLang();
  const { showPostModal, setShowPostModal, showStoryModal, setShowStoryModal } = useModal();
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    type: "sale" as ListingType,
    title: "",
    description: "",
    price: "",
    initialPrice: "",
    category: "",
    callNumber: "",
    callNumber2: "",
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    activeHours: "9am - 4pm",
    rentPeriod: "day",
    eventDate: "",
    eventVenue: "",
    freeEvent: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [postError, setPostError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageData, setImageData] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () =>
        setImageData((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageData((prev) => prev.filter((_, i) => i !== index));
  };

  const storyInputRef = useRef<HTMLInputElement>(null);
  const [storyImageData, setStoryImageData] = useState<string | null>(null);

  const handleStoryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setStoryImageData(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setPostError("");

    if (!user) {
      setPostError("Please sign in to post.");
      setSubmitted(false);
      return;
    }
    if (!user.university || !user.campus || !user.level) {
      setPostError("Set your University, Campus and Level in your Profile before posting.");
      setSubmitted(false);
      return;
    }

    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;

    const sellerName = user.name || "Student User";
    const sellerUniversity = user.university;
    const sellerLevel = user.level;
    const fallbackImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(form.title || "Item")}&background=10b981&color=fff`;

    try {
      let endpoint = "/api/listings";
      let payload: any = {
        title: form.title,
        description: form.description,
        price: Number(form.price || 0),
        initialPrice: form.initialPrice ? Number(form.initialPrice) : undefined,
        category: form.category || "Others",
        seller: sellerName,
        sellerAvatar: "",
        university: sellerUniversity,
        campus: user?.campus,
        level: sellerLevel,
        image: imageData[0] || fallbackImage,
        images: imageData,
        callNumber: form.callNumber,
        callNumber2: form.callNumber2,
        available: true,
      };

      if (form.type === "rent") {
        payload.type = "rent";
        payload.rentPeriod = form.rentPeriod;
      } else if (form.type === "food") {
        endpoint = "/api/food";
        payload = {
          name: form.title,
          specialty: form.category || "Campus Special",
          description: form.description,
          price: Number(form.price || 0),
          image: imageData[0] || fallbackImage,
          images: imageData,
          university: sellerUniversity,
          rating: 4.5,
          reviews: 0,
          available: true,
          tags: ["Local"],
          callNumber: form.callNumber,
          callNumber2: form.callNumber2,
          workingDays: form.workingDays,
          activeHours: form.activeHours,
        };
      } else if (form.type === "event") {
        endpoint = "/api/events";
        payload = {
          title: form.title,
          image: imageData[0] || fallbackImage,
          price: Number(form.price || 0),
          university: sellerUniversity,
          date: form.eventDate || new Date().toISOString().slice(0, 10),
          time: "12:00",
          venue: form.eventVenue || "TBA",
          ticketsLeft: 0,
          callNumber: form.callNumber,
          callNumber2: form.callNumber2,
        };
      } else {
        payload.type = "sale";
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Post failed");

      window.dispatchEvent(new Event("listings-updated"));
      setShowPostModal(false);
      setImageData([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setForm({ type: "sale", title: "", description: "", price: "", initialPrice: "", category: "", callNumber: "", callNumber2: "", workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"], activeHours: "9am - 4pm", rentPeriod: "day", eventDate: "", eventVenue: "", freeEvent: false });
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "Post failed");
    } finally {
      setSubmitted(false);
    }
  };

  const isVisible = showPostModal || showStoryModal;

  if (!isVisible) return null;

  // Story upload modal
  if (showStoryModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowStoryModal(false)}>
        <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowStoryModal(false)}
            className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{t("uploadVideo")}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Max 30 seconds · MP4, MOV</p>

            <input
              id="storyImageInput"
              ref={storyInputRef}
              type="file"
              accept="image/*"
              onChange={handleStoryImageChange}
              className="hidden"
            />
            <label
              htmlFor="storyImageInput"
              className="block border-2 border-dashed border-green-300 dark:border-green-700 rounded-2xl p-8 mb-4 hover:bg-green-50 dark:hover:bg-green-900/10 cursor-pointer transition text-center"
            >
              {storyImageData ? (
                <img src={storyImageData} alt="Story preview" className="w-full h-52 object-cover rounded-xl mb-2" />
              ) : (
                <>
                  <Upload className="w-10 h-10 text-green-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Tap to upload or drag & drop</p>
                  <p className="text-xs text-gray-400 mt-1">MP4, MOV up to 50MB</p>
                </>
              )}
              {storyImageData && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setStoryImageData(null); if (storyInputRef.current) storyInputRef.current.value = ""; }}
                  className="mt-2 text-xs font-medium text-red-500 hover:text-red-600"
                >
                  Remove photo
                </button>
              )}
            </label>

            <div className="flex gap-2 mb-4">
              <button className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium flex items-center justify-center gap-2">
                <Camera className="w-4 h-4" /> Record Now
              </button>
            </div>

            <textarea
              placeholder="Add a caption for your story..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 resize-none"
            />

            <button
              onClick={() => setShowStoryModal(false)}
              className="w-full mt-4 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full text-sm transition"
            >
              Share Story
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowPostModal(false)}>
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t("postNewListing")}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              as {user?.name} · {user?.university}{user?.campus ? ` · ${user.campus}` : ""} · {user?.level}
            </p>
          </div>

          <button
            onClick={() => setShowPostModal(false)}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Listing Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
              {t("listingType")}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["sale", "rent", "food", "event"] as ListingType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, type })}
                  className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wide border-2 transition ${
                    form.type === type
                      ? type === "sale" ? "bg-orange-500 border-orange-500 text-white"
                        : type === "rent" ? "bg-emerald-500 border-emerald-500 text-white"
                        : type === "food" ? "bg-amber-500 border-amber-500 text-white"
                        : "bg-purple-500 border-purple-500 text-white"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {type === "sale" ? "Sell" : type === "rent" ? "Rent" : type === "food" ? "Food" : "Event"}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t("listingTitle")}</label>
            <input
              type="text"
              required
              maxLength={50}
              placeholder={form.type === "food" ? "e.g. Mama Akua's Jollof Rice" : "e.g. Canon Camera, Introduction to Psychology..."}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 transition"
            />
            <p className="text-[11px] text-gray-400 mt-1 text-right">{form.title.length}/50</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t("listingDesc")}</label>
            <textarea
              required
              rows={3}
              maxLength={200}
              placeholder="Describe your item or service..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 resize-none transition"
            />
            <p className="text-[11px] text-gray-400 mt-1 text-right">{form.description.length}/200</p>
          </div>

          {form.type === "food" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Working Days */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Working Days
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          workingDays: form.workingDays.includes(d)
                            ? form.workingDays.filter((x) => x !== d)
                            : [...form.workingDays, d],
                        })
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                        form.workingDays.includes(d)
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-orange-300"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              {/* Active Hours */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Active Hours
                </label>
                <input
                  type="text"
                  value={form.activeHours}
                  onChange={(e) => setForm({ ...form, activeHours: e.target.value })}
                  placeholder="e.g. 9am - 4pm"
                  className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-400 transition"
                />
              </div>
            </div>
          )}

          {/* Price */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:flex sm:flex-wrap">
            <div className="sm:flex-[0_0_45%] sm:flex-grow">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Current Price</label>
              {form.type === "event" && form.freeEvent ? (
                <div className="w-full px-4 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-300 text-sm font-bold">
                  FREE
                </div>
              ) : (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">GH₵</span>
                  <input
                    type="number"
                    required={form.type !== "event"}
                    min="0"
                    placeholder="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 transition"
                  />
                </div>
              )}
            </div>
            <div className="sm:flex-[0_0_45%] sm:flex-grow">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Initial Price (optional)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">GH₵</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Original price"
                  value={form.initialPrice}
                  onChange={(e) => setForm({ ...form, initialPrice: e.target.value })}
                  className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 transition"
                />
              </div>
            </div>
            {form.type === "rent" && (
              <div className="w-full sm:w-32">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Period</label>
                <select
                  value={form.rentPeriod}
                  onChange={(e) => setForm({ ...form, rentPeriod: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none"
                >
                  <option value="hour">Per Hour</option>
                  <option value="day">Per Day</option>
                  <option value="week">Per Week</option>
                  <option value="month">Per Month</option>
                  <option value="semester">Per Semester</option>
                </select>
              </div>
            )}
          </div>

          {/* Category */}
          {form.type !== "food" && form.type !== "event" && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t("listingCategory")}</label>
              <select
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 transition"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {/* Event specific */}
          {form.type === "event" && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, freeEvent: !form.freeEvent, price: !form.freeEvent ? "0" : form.price })}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition ${
                  form.freeEvent
                    ? "bg-purple-500 border-purple-500 text-white"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-purple-300"
                }`}
              >
                <span>Is this event free?</span>
                <span>{form.freeEvent ? "✓ FREE EVENT" : "No — it has a price"}</span>
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Event Date</label>
                  <input
                    type="date"
                    value={form.eventDate}
                    onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Venue</label>
                  <input
                    type="text"
                    placeholder="e.g. Great Hall, UG"
                    value={form.eventVenue}
                    onChange={(e) => setForm({ ...form, eventVenue: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Contact Numbers - Required */}
          <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-200 dark:border-green-800 space-y-3">
            <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Contact Numbers (Call 1 required · Call 2 optional)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t("callNumber")} 1
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+233 24 000 0000"
                    value={form.callNumber}
                    onChange={(e) => setForm({ ...form, callNumber: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t("callNumber")} 2 <span className="text-gray-400">(optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-400" />
                  <input
                    type="tel"
                    placeholder="+233 24 000 0000"
                    value={form.callNumber2}
                    onChange={(e) => setForm({ ...form, callNumber2: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Upload Images */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{t("listingImages")}</label>
            <input
              id="listingImageInput"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
            {imageData.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {imageData.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img src={img} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-xs flex items-center justify-center hover:bg-black"
                      aria-label="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-[10px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded">
                        Main
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <label
              htmlFor="listingImageInput"
              className="block border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition"
            >
              {imageData.length > 0 ? (
                <span className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <ImagePlus className="w-5 h-5" /> Add more photos
                </span>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload photos</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 10MB each · select multiple</p>
                </>
              )}
            </label>
            {imageData.length > 0 && (
              <button
                type="button"
                onClick={() => { setImageData([]); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className="mt-2 text-xs font-medium text-red-500 hover:text-red-600"
              >
                Remove all photos
              </button>
            )}
          </div>

          {/* Submit */}
          {postError && (
            <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
              {postError}
            </div>
          )}
          <button
            type="submit"
            disabled={submitted}
            className="w-full py-3.5 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white font-bold rounded-full text-sm transition shadow-lg shadow-green-200 dark:shadow-green-900/40"
          >
            {submitted ? "✓ Posted Successfully!" : t("submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
