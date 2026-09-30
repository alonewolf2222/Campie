"use client";

import { useRef, useState } from "react";
import { X, ImagePlus, Upload, Trash2 } from "lucide-react";
import { useLang, useAuth } from "@/lib/context";
import { fileToCompressedDataUrl, MAX_IMAGES } from "@/lib/compressImage";

const CATEGORIES = [
  "Textbooks & Study", "Laptops & Tech", "Furniture & Decor",
  "Bicycles & Transit", "Clothing & Shoes", "Sports & Outdoors",
  "Electronics", "Dorm Essentials", "Food & Drinks",
  "Bags & Accessories", "Anime & Collectibles", "Others",
];

export default function EditListingModal({ item, onClose, onDeleted }: { item: any; onClose: (updated?: any) => void; onDeleted?: () => void }) {
  const { t } = useLang();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: item.title || "",
    description: item.description || "",
    price: String(item.price ?? ""),
    initialPrice: item.initialPrice ? String(item.initialPrice) : "",
    category: item.category || "",
    rentPeriod: item.rentPeriod || "day",
  });
  const [images, setImages] = useState<string[]>(
    Array.isArray(item.images) && item.images.length
      ? item.images
      : item.image
      ? [item.image]
      : []
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [doneMsg, setDoneMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = MAX_IMAGES - images.length;
    const picked = files.slice(0, remaining);
    if (!picked.length) return;
    for (const file of picked) {
      try {
        const dataUrl = await fileToCompressedDataUrl(file);
        setImages((prev) => [...prev, dataUrl]);
      } catch {
        /* ignore unreadable files */
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setDoneMsg("");
    try {
      const res = await fetch(`/api/listings/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editorName: user?.name,
          title: form.title,
          description: form.description,
          price: Number(form.price || 0),
          initialPrice: form.initialPrice ? Number(form.initialPrice) : undefined,
          category: form.category || "Others",
          rentPeriod: item.type === "rent" ? form.rentPeriod : undefined,
          image: images[0] || item.image,
          images,
        }),
      });
      const text = await res.text();
      let result: any = {};
      try {
        result = JSON.parse(text);
      } catch {
        result = {};
      }
      if (!res.ok) {
        if (res.status === 413) throw new Error("Photos are too large — use fewer or smaller images.");
        throw new Error(result.error || "Update failed");
      }
      window.dispatchEvent(new Event("listings-updated"));
      setDoneMsg("Saved!");
      setTimeout(() => onClose(result.data), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this listing permanently? This cannot be undone.")) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/listings/${item.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editorName: user?.name }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Delete failed");
      window.dispatchEvent(new Event("listings-updated"));
      onDeleted && onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => onClose()}>
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-gray-900 px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Listing</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Update price, description, photos or delete</p>
          </div>
          <button
            onClick={() => onClose()}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t("listingTitle")}</label>
            <input
              type="text"
              required
              maxLength={50}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 transition"
            />
            <p className="text-[11px] text-gray-400 mt-1 text-right">{form.title.length}/50</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t("listingDesc")}</label>
            <textarea
              required
              rows={4}
              maxLength={200}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 resize-none transition"
            />
            <p className="text-[11px] text-gray-400 mt-1 text-right">{form.description.length}/200</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Current Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">GH₵</span>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Initial Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">GH₵</span>
                <input
                  type="number"
                  min="0"
                  value={form.initialPrice}
                  onChange={(e) => setForm({ ...form, initialPrice: e.target.value })}
                  className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 transition"
                />
              </div>
            </div>
          </div>

          {item.type === "rent" && (
            <div>
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

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t("listingCategory")}</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 transition"
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Photos</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
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
            {images.length < MAX_IMAGES ? (
              <label
                onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                className="block border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-5 text-center hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition"
              >
                {images.length > 0 ? (
                  <span className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <ImagePlus className="w-5 h-5" /> Add more photos
                  </span>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload photos</p>
                    <p className="text-xs text-gray-400 mt-1">Photos are automatically compressed — up to {MAX_IMAGES} photos</p>
                  </>
                )}
              </label>
            ) : (
              <p className="text-xs text-gray-400 mt-1 text-center">
                Maximum {MAX_IMAGES} photos reached — remove one to add another.
              </p>
            )}
            {images.length > 0 && (
              <button
                type="button"
                onClick={() => { setImages([]); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className="mt-2 text-xs font-medium text-red-500 hover:text-red-600"
              >
                Remove all photos
              </button>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium">{error}</p>
          )}
          {doneMsg && (
            <p className="text-xs text-green-600 font-medium">{doneMsg}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white font-bold rounded-full text-sm transition shadow-lg shadow-green-200 dark:shadow-green-900/40"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="w-full py-3 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold rounded-full text-sm transition"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? "Deleting..." : "Delete Listing"}
          </button>
        </form>
      </div>
    </div>
  );
}