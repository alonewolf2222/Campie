"use client";

import { useState, useRef, useEffect } from "react";
import {
  X, Camera, Check, Settings, Shield, Lock, User as UserIcon,
  User as UserIcon2, FileText, Phone, Mail, GraduationCap, University,
  MapPin, ShoppingBasket,
} from "lucide-react";
import { useLang, useAuth } from "@/lib/context";
import UniPicker from "@/components/UniPicker";
import ItemDetailModal from "@/components/ItemDetailModal";
import { getFavs } from "@/lib/favourites";
import { fileToCompressedDataUrl } from "@/lib/compressImage";
import type { Listing } from "@/lib/mockData";

type Form = {
  name: string;
  email: string;
  phone: string;
  university: string;
  campus: string;
  level: string;
  avatar: string;
};

export default function ProfileModal() {
  const { user, showProfileModal, setShowProfileModal, updateUser } = useAuth();
  const { lang, setLang } = useLang();
  const [tab, setTab] = useState<"profile" | "cart" | "settings" | "privacy" | "password" | "policy">("profile");
  const [form, setForm] = useState<Form>({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    university: user?.university || "",
    campus: user?.campus || "",
    level: user?.level || "",
    avatar: user?.avatar || "",
  });
  const [saveMsg, setSaveMsg] = useState("");
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [privacy, setPrivacy] = useState(() => {
    try {
      return { phone: true, email: false, ...(JSON.parse(localStorage.getItem("campie-privacy") || "{}")) };
    } catch {
      return { phone: true, email: false };
    }
  });
  const [settings, setSettings] = useState(() => {
    try {
      return { freshView: true, campusNotifs: true, unreadBadge: true, ...(JSON.parse(localStorage.getItem("campie-settings") || "{}")) };
    } catch {
      return { freshView: true, campusNotifs: true, unreadBadge: true };
    }
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const [cartItems, setCartItems] = useState<Listing[]>([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartItem, setCartItem] = useState<Listing | null>(null);

  useEffect(() => {
    if (!showProfileModal || !user) return;
    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      university: user.university || "",
      campus: user.campus || "",
      level: user.level || "",
      avatar: user.avatar || "",
    });
    setPw({ current: "", next: "", confirm: "" });
  }, [showProfileModal, user]);

  useEffect(() => {
    if (!showProfileModal || !user || tab !== "cart") return;
    const loadCart = () => {
      setCartLoading(true);
      fetch("/api/listings")
        .then((r) => r.json())
        .then((j) => {
          const all = (j.data || []) as Listing[];
          const cartIds = getFavs();
          setCartItems(all.filter((l) => cartIds.includes(l.id)));
        })
        .catch(() => setCartItems([]))
        .finally(() => setCartLoading(false));
    };
    loadCart();
    window.addEventListener("cart-updated", loadCart);
    window.addEventListener("listings-updated", loadCart);
    return () => {
      window.removeEventListener("cart-updated", loadCart);
      window.removeEventListener("listings-updated", loadCart);
    };
  }, [showProfileModal, user, tab]);

  if (!showProfileModal || !user) return null;

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToCompressedDataUrl(file, { maxDim: 512, quality: 0.8 });
    setForm((f) => ({ ...f, avatar: dataUrl }));
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const changes = { ...form };
    if (!changes.avatar) changes.avatar = user.avatar || "";
    updateUser({ ...user, ...changes });
    setSaveMsg("Added to cart!");
    setTimeout(() => { setSaveMsg(""); setShowProfileModal(false); }, 1200);
  };

  const savePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next.length < 8 || pw.next.length > 32) {
      setSaveMsg("Password must be 8 to 32 characters");
      return;
    }
    if (pw.next !== pw.confirm) { setSaveMsg("New passwords don't match"); return; }
    updateUser({ ...user });
    setSaveMsg("Password updated");
    setTimeout(() => { setSaveMsg(""); setShowProfileModal(false); }, 1200);
  };

  const setSetting = (key: "freshView" | "campusNotifs" | "unreadBadge", value: boolean) => {
    setSettings((s: { freshView: boolean; campusNotifs: boolean; unreadBadge: boolean }) => {
      const next = { ...s, [key]: value };
      try { localStorage.setItem("campie-settings", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const togglePrivacy = (key: "phone" | "email") => {
    setPrivacy((p: { phone: boolean; email: boolean }) => {
      const next = { ...p, [key]: !p[key] };
      try { localStorage.setItem("campie-privacy", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col lg:flex-row overflow-hidden bg-white dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="shrink-0 w-full lg:w-56 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-2 py-2 sm:px-3 lg:p-4 flex flex-wrap items-center gap-1 lg:flex-col lg:items-stretch">
        <div className="hidden lg:flex items-center gap-3 px-2 pb-4 border-b border-gray-200 dark:border-gray-800 mb-2 w-full">
          <span className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center text-white"><UserIcon className="w-5 h-5" /></span>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">My Profile</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Manage everything here</p>
          </div>
        </div>
        {[
          { id: "profile" as const, label: "Profile", icon: UserIcon },
          { id: "cart" as const, label: "Cart", icon: ShoppingBasket },
          { id: "settings" as const, label: "Settings", icon: Settings },
          { id: "privacy" as const, label: "Privacy", icon: Shield },
          { id: "password" as const, label: "Password", icon: Lock },
          { id: "policy" as const, label: "Policy", icon: FileText },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-0.5 lg:gap-2.5 px-2.5 py-2 lg:px-3 lg:py-2.5 rounded-xl text-[10px] lg:text-sm font-semibold transition ${
              tab === item.id
                ? "bg-green-500 text-white shadow-md shadow-green-200 dark:shadow-green-900/40"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <item.icon className={`w-4 h-4 ${tab === item.id ? "text-white" : ""}`} />
            <span className="whitespace-nowrap">{item.label}</span>
          </button>
        ))}
        <button
          onClick={() => setShowProfileModal(false)}
          className="flex lg:hidden items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[10px] font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="w-4 h-4" /> Close
        </button>
        <div className="hidden lg:block mt-auto">
          <button
            onClick={() => setShowProfileModal(false)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-full text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
          >
            <X className="w-4 h-4" /> Close
          </button>
        </div>
      </aside>

      {/* Main panel */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-8">
          {saveMsg && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm font-semibold text-green-700 dark:text-green-400">
              {saveMsg}
            </div>
          )}

          {tab === "profile" && (
            <div className="max-w-2xl">
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Edit Profile</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Update your picture and campus details — they show on everything you post.</p>

              {/* Avatar */}
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  {form.avatar ? (
                    <img src={form.avatar} alt="avatar" className="w-28 h-28 rounded-2xl object-cover border-4 border-gray-100 dark:border-gray-800" />
                  ) : (
                    <div className="w-28 h-28 rounded-2xl bg-gray-100 dark:bg-gray-800 border-4 border-gray-100 dark:border-gray-800 flex items-center justify-center">
                      <UserIcon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-950 transition"
                    aria-label="Change profile picture"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{user.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.university}{user.campus ? ` · ${user.campus}` : ""} {user.level && `- ${user.level}`}</p>
                  <button onClick={() => fileRef.current?.click()} className="mt-2 text-sm font-semibold text-green-600 dark:text-green-400 hover:underline">
                    Set / Change Profile Picture
                  </button>
                </div>
              </div>

              <form onSubmit={save} className="space-y-5">
                {[
                  { label: "Full name", key: "name" as const, type: "text", ph: "e.g. Ama Mensah" },
                  { label: "Email", key: "email" as const, type: "email", ph: "you@university.edu.gh" },
                  { label: "Phone number", key: "phone" as const, type: "tel", ph: "+233 24 000 0000" },
                ].map((fld) => (
                  <div key={fld.key}>
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">{fld.label}</label>
                    <input
                      type={fld.type}
                      placeholder={fld.ph}
                      value={form[fld.key]}
                      onChange={(e) => setForm((f) => ({ ...f, [fld.key]: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900/40 transition"
                    />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">University</label>
                    <UniPicker
                      value={form.university}
                      onChange={(abbr) => setForm((f) => ({ ...f, university: abbr }))}
                      placeholder="Type to search..."
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">Campus</label>
                    <input
                      type="text"
                      placeholder="e.g. Legon, Achimota, Kumasi..."
                      value={form.campus}
                      onChange={(e) => setForm((f) => ({ ...f, campus: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900/40 transition"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">Level</label>
                    <select
                      value={form.level}
                      onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-base text-gray-900 dark:text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900/40 transition"
                    >
                      <option value="">Select level</option>
                      <option>100</option>
                      <option>200</option>
                      <option>300</option>
                      <option>400</option>
                      <option>500</option>
                      <option>600</option>
                      <option>700</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="px-8 py-3 rounded-full bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition shadow-lg shadow-green-200 dark:shadow-green-900/40">
                  Save
                </button>
              </form>
            </div>
          )}

          {tab === "cart" && (
            <div className="max-w-4xl">
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">My Cart</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Everything you added to your cart — all in one place.</p>

              {cartLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
              ) : cartItems.length === 0 ? (
                <div className="px-8 py-16 rounded-2xl bg-gray-50 dark:bg-gray-800 text-center">
                  <ShoppingBasket className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="font-bold text-gray-900 dark:text-white">No items in your cart yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tap the basket on any listing to add it here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setCartItem(item)}
                      className="group rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 transition-all cursor-pointer"
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {item.type === "rent" && (
                          <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white z-10">RENT</span>
                        )}
                        {item.type === "sale" && (
                          <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white z-10">SALE</span>
                        )}
                      </div>
                      <div className="p-2.5 flex flex-col gap-1.5">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-xs leading-snug line-clamp-2">{item.title}</h3>
                        <span className="font-bold text-gray-900 dark:text-white text-sm">{item.type === "event" && item.price === 0 ? "FREE" : "GH₵ " + item.price.toLocaleString()}</span>
                        <p className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                          <MapPin className="w-3 h-3" /> {item.university}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "settings" && (
            <div className="max-w-xl">
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-8">Settings</h1>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">App language</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Currently {lang === "fr" ? "Français" : "English"} — tap to switch to {lang === "fr" ? "English" : "Français"}</p>
                  </div>
                  <button
                    onClick={() => setLang(lang === "en" ? "fr" : "en")}
                    className={`w-12 h-7 rounded-full transition ${lang === "fr" ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
                  >
                    <span className={`block w-5 h-5 bg-white rounded-full mt-1 transition ${lang === "fr" ? "ml-6" : "ml-1"}`} />
                  </button>
                </div>
                {([
                  { key: "freshView" as const, label: "Default view", hint: "Fresh Listings first" },
                  { key: "campusNotifs" as const, label: "Campus notifications", hint: "Deals, events & safety alerts" },
                  { key: "unreadBadge" as const, label: "Unread badge", hint: "Show count on bell" },
                ]).map((s) => {
                  const isOn = settings[s.key];
                  return (
                    <div key={s.label} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{s.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{s.hint}</p>
                      </div>
                      <button
                        onClick={() => setSetting(s.key, !isOn)}
                        className={`w-12 h-7 rounded-full transition ${isOn ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
                      >
                        <span className={`block w-5 h-5 bg-white rounded-full mt-1 transition ${isOn ? "ml-6" : "ml-1"}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "privacy" && (
            <div className="max-w-xl">
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-8">Privacy</h1>
              <div className="space-y-4">
                {([
                  { key: "phone" as const, label: "Show phone to buyers", hint: "Visible on your listings" },
                  { key: "email" as const, label: "Show email to buyers", hint: "Visible on your listings" },
                ]).map((s) => {
                  const isOn = privacy[s.key];
                  return (
                    <div key={s.label} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{s.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{s.hint}</p>
                      </div>
                      <button
                        onClick={() => togglePrivacy(s.key)}
                        className={`w-12 h-7 rounded-full transition ${isOn ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
                      >
                        <span className={`block w-5 h-5 bg-white rounded-full mt-1 transition ${isOn ? "ml-6" : "ml-1"}`} />
                      </button>
                    </div>
                  );
                })}
                <p className="text-xs text-gray-400 dark:text-gray-500 pt-2">
                  Admins always keep your law-enforcement required details private. Change of university/level only visible after you save.
                </p>
              </div>
            </div>
          )}

          {tab === "password" && (
            <div className="max-w-xl">
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-8">Change Password</h1>
              <form onSubmit={savePassword} className="space-y-5">
                {[
                  { label: "Current password", key: "current" as const, ph: "Current password" },
                  { label: "New password", key: "next" as const, ph: "New password (8 - 32 chars)" },
                  { label: "Confirm new password", key: "confirm" as const, ph: "Repeat new password" },
                ].map((fld) => (
                  <div key={fld.key}>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{fld.label}</label>
                    <input
                      type="password"
                      placeholder={fld.ph}
                      value={pw[fld.key]}
                      onChange={(e) => setPw((p) => ({ ...p, [fld.key]: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm outline-none focus:border-green-400 transition"
                    />
                  </div>
                ))}
                <button type="submit" className="px-8 py-3 rounded-full bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition shadow-lg shadow-green-200 dark:shadow-green-900/40">
                  Update Password
                </button>
              </form>
            </div>
          )}

          {tab === "policy" && (
            <div className="max-w-xl">
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-8">Policies</h1>
              <div className="space-y-5 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                <section>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">Privacy Policy</h3>
                  <p>We store only what makes CampusMarket work: your name, university, level, phone, email and avatar. Your phone/email stay visible so buyers can reach you. We never sell your data.</p>
                </section>
                <section>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">Terms of Service</h3>
                  <p>Post only real items you can actually sell. Campus goods only. Scams, fraud or fake listings get you banned and reported to your university office.</p>
                </section>
                <section>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">Safety Rules</h3>
                  <p>Always meet on campus in a public spot, verify the item before paying, and never send money in advance. Report shady sellers.</p>
                </section>
              </div>
            </div>
          )}
        </div>
      </main>
      <ItemDetailModal selectedItem={cartItem} setSelectedItem={setCartItem} />
    </div>
  );
}
