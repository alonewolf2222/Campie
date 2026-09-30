"use client";

import { useState, useEffect } from "react";
import {
  ShoppingBag, Search, Bell, ChevronDown,
  Globe, Menu, X, Plus, LogOut, User as UserIcon, List, ShieldCheck, Heart,
  UtensilsCrossed, Calendar, Inbox,
} from "lucide-react";
import { useLang } from "@/lib/context";
import { useAuth } from "@/lib/context";
import { useModal } from "@/lib/context";
import { supabase } from "@/lib/supabase";
import type { Language } from "@/lib/i18n";
import AdminPanel from "./AdminPanel";

const NAV_LINKS = [
  { key: "buy" as const, href: "#buy" },
  { key: "sell" as const, href: "#sell" },
  { key: "rent" as const, href: "#rent" },
  { key: "events" as const, href: "#events" },
  { key: "navFood" as const, href: "#food" },
  { key: "stories" as const, href: "#stories" },
];

export default function Navbar() {
  const { t, lang, setLang } = useLang();
  const { user, signOut, setShowAuthModal, setAuthMode, setShowProfileModal, setShowMyListings } = useAuth();
  const { setShowPostModal } = useModal();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [notifs, setNotifs] = useState<
    { id: string; itemType: string; itemId: string; title: string; body: string; read: boolean; createdAt: string }[]
  >([]);
  const [unread, setUnread] = useState(0);

  const loadNotifs = async () => {
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      if (!token) return;
      const res = await fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } });
      const j = await res.json();
      setNotifs(j.notifications || []);
      setUnread(j.unread || 0);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!user) {
      setNotifs([]);
      setUnread(0);
      return;
    }
    loadNotifs();
    const onUpd = () => loadNotifs();
    window.addEventListener("notifications-updated", onUpd);
    window.addEventListener("listings-updated", onUpd);
    const poll = setInterval(loadNotifs, 45000);
    return () => {
      window.removeEventListener("notifications-updated", onUpd);
      window.removeEventListener("listings-updated", onUpd);
      clearInterval(poll);
    };
  }, [user]);

  const markAllRead = async () => {
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      if (!token) return;
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      loadNotifs();
    } catch {
      /* ignore */
    }
  };

  const openNotification = async (n: { id: string; itemType: string; read: boolean }) => {
    if (!n.read) {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess?.session?.access_token;
        if (token) {
          await fetch("/api/notifications/read", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id: n.id }),
          });
        }
      } catch {
        /* ignore */
      }
      loadNotifs();
    }
    setNotifsOpen(false);
    const target = n.itemType === "food" ? "#food" : n.itemType === "event" ? "#events" : "#buy";
    document.querySelector(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const notifIcon = (itemType: string) => {
    if (itemType === "food")
      return <UtensilsCrossed className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
    if (itemType === "event")
      return <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    return <List className="w-5 h-5 text-green-600 dark:text-green-400" />;
  };

  const notifTime = (createdAt: string) => {
    const s = createdAt || "";
    return s.length > 16 ? s.slice(5, 16) : s;
  };

  const openSignIn = () => { setAuthMode("signin"); setShowAuthModal(true); };
  const openSignUp = () => { setAuthMode("signup"); setShowAuthModal(true); };
  const openSell = () => {
    if (!user) return openSignIn();
    if (!user.university || !user.campus || !user.level) {
      setShowProfileModal(true);
      return;
    }
    setShowPostModal(true);
  };

  const goHome = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileOpen(false);
    setSearchOpen(false);
    setUserMenuOpen(false);
    setNotifsOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
    <nav className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-3">
          {/* Logo */}
          <a
            href="#"
            onClick={goHome}
            className="shrink-0 text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white min-h-10 flex items-center"
            aria-label="Campie home"
          >
            Camp<span className="text-green-500">ie</span>
          </a>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-3 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t("search")}
                className="w-full pl-10 pr-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-transparent focus:border-green-400 focus:bg-white dark:focus:bg-gray-700 text-sm outline-none transition dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ key, href }) =>
              key === "sell" ? (
                <button
                  key={key}
                  onClick={() => { openSell(); setMobileOpen(false); }}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                >
                  {t(key)}
                </button>
              ) : (
                <a
                  key={key}
                  href={href}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                >
                  {t(key)}
                </a>
              )
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Mobile Search */}
            <button
              onClick={() => { setSearchOpen(!searchOpen); setMobileOpen(false); setUserMenuOpen(false); setNotifsOpen(false); }}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === "en" ? "fr" : "en")}
              className="flex items-center gap-1 p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 transition text-xs font-bold"
              title={t("language")}
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:block">{lang === "en" ? "FR" : "EN"}</span>
            </button>

            {/* Notifications */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => {
                    setNotifsOpen(!notifsOpen);
                    loadNotifs();
                    setUserMenuOpen(false);
                    setSearchOpen(false);
                    setMobileOpen(false);
                  }}
                  className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 transition"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </button>

                {notifsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifsOpen(false)} />
                    <div className="fixed right-3 sm:right-4 top-16 w-80 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm text-gray-900 dark:text-white">Notifications</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {unread > 0 ? `${unread} unread` : "All caught up"}
                          </p>
                        </div>
                        {unread > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-[11px] font-bold text-green-600 dark:text-green-400 hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifs.length === 0 ? (
                          <div className="px-6 py-10 flex flex-col items-center justify-center text-center">
                            <Inbox className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No notifications yet
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              New campus posts will appear here.
                            </p>
                          </div>
                        ) : (
                          notifs.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => openNotification(n)}
                              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition ${
                                n.read
                                  ? "hover:bg-gray-50 dark:hover:bg-gray-700"
                                  : "bg-green-50/60 dark:bg-green-900/15 hover:bg-green-50 dark:hover:bg-green-900/25"
                              }`}
                            >
                              <span className="w-9 h-9 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                                {notifIcon(n.itemType)}
                              </span>
                              <span className="flex-1 min-w-0">
                                <span className="flex items-center gap-2">
                                  <span className="block text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {n.title}
                                  </span>
                                  {!n.read && <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />}
                                </span>
                                <span className="block text-xs text-gray-500 dark:text-gray-400 leading-snug">{n.body}</span>
                                <span className="block text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{notifTime(n.createdAt)}</span>
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Post Listing */}
            <button
              onClick={openSell}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-full transition shadow-md shadow-green-200 dark:shadow-green-900/40"
            >
              <Plus className="w-4 h-4" />
              <span>{t("postListing")}</span>
            </button>

            {/* Auth / User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen);
                    setNotifsOpen(false);
                    setSearchOpen(false);
                    setMobileOpen(false);
                  }}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                    {user.name.charAt(0)}
                  </div>
                  <>
                    <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">{user.name.split(" ")[0]}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
                  </>
                </button>

                {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="fixed right-3 sm:right-4 top-16 w-52 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.university}</p>
                    </div>
                    <button
                      onClick={() => { setShowProfileModal(true); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                    >
                      <UserIcon className="w-4 h-4" /> {t("profile")}
                    </button>
                    <button
                      onClick={() => { setShowMyListings(true); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                    >
                      <List className="w-4 h-4" /> {t("myListings")}
                    </button>
                    {user.role === "admin" && (
                      <button
                        onClick={() => { setShowAdmin(true); setUserMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 text-left"
                      >
                        <ShieldCheck className="w-4 h-4" /> Admin Panel
                      </button>
                    )}
                    <button
                      onClick={() => { signOut(); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <LogOut className="w-4 h-4" /> {t("signOut")}
                    </button>
                  </div>
                </>
              )}
            </div>
            ) : (
              <button
                onClick={openSignUp}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-full transition shadow-md shadow-green-200"
              >
                {t("signUp")}
              </button>
            )}

            {/* Mobile Menu */}
            <button
              onClick={() => { setMobileOpen(!mobileOpen); setSearchOpen(false); setUserMenuOpen(false); setNotifsOpen(false); }}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        {searchOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setSearchOpen(false)} />
            <div className="md:hidden pb-3 relative z-40">
              <button
                onClick={() => setSearchOpen(false)}
                className="absolute -right-1 -top-1 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-50"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t("search")}
                className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm outline-none dark:text-white"
              />
            </div>
            </div>
          </>
        )}

        {/* Mobile Nav */}
        {mobileOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMobileOpen(false)} />
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 py-3 space-y-1 relative z-40">
            {NAV_LINKS.map(({ key, href }) =>
              key === "sell" ? (
                <button
                  key={key}
                  onClick={() => { openSell(); setMobileOpen(false); }}
                  className="block w-full text-left px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 rounded-lg"
                >
                  {t(key)}
                </button>
              ) : (
                <a
                  key={key}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 rounded-lg"
                >
                  {t(key)}
                </a>
              )
            )}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2 px-4">
              {!user && (
                <>
                  <button onClick={openSignIn} className="touch-target w-full py-2.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-full dark:text-gray-300">
                    {t("signIn")}
                  </button>
                  <button onClick={openSignUp} className="touch-target w-full py-2.5 text-sm font-semibold text-white bg-green-500 rounded-full dark:bg-green-500">
                    {t("signUp")}
                  </button>
                </>
              )}
              <button
                onClick={() => { openSell(); setMobileOpen(false); }}
                className="touch-target w-full py-2.5 text-sm font-semibold text-white bg-green-500 rounded-full flex items-center justify-center gap-2 dark:bg-green-500"
              >
                <Plus className="w-4 h-4" /> {t("postListing")}
              </button>
            </div>
          </div>
          </>
        )}
      </div>
    </nav>
    <AdminPanel open={showAdmin} onClose={() => setShowAdmin(false)} />
    </>
  );
}