"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { translations, type Language, type TranslationKey } from "./i18n";
import { supabase } from "./supabase";

// ── Language Context ──────────────────────────────────────────────────────────
interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("campusmart-lang") as Language | null;
    if (saved === "en" || saved === "fr") setLangState(saved);
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem("campusmart-lang", l);
  };

  const t = (key: TranslationKey): string => translations[lang][key] as string;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);

// ── Auth Context ──────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  university: string;
  campus?: string;
  level: string;
  avatar?: string;
  role?: string;
  status?: string;
  provider?: string;
}

interface AuthContextType {
  user: User | null;
  signIn: (u: User) => void;
  signOut: () => void;
  showAuthModal: boolean;
  setShowAuthModal: (v: boolean) => void;
  authMode: "signin" | "signup";
  setAuthMode: (m: "signin" | "signup") => void;
  showProfileModal: boolean;
  setShowProfileModal: (v: boolean) => void;
  showMyListings: boolean;
  setShowMyListings: (v: boolean) => void;
  showProfilePrompt: boolean;
  setShowProfilePrompt: (v: boolean) => void;
  updateUser: (u: User) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  signIn: () => {},
  signOut: () => {},
  showAuthModal: false,
  setShowAuthModal: () => {},
  authMode: "signin",
  setAuthMode: () => {},
  showProfileModal: false,
  setShowProfileModal: () => {},
  showMyListings: false,
  setShowMyListings: () => {},
  showProfilePrompt: false,
  setShowProfilePrompt: () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMyListings, setShowMyListings] = useState(false);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);

  const wantsGooglePrompt = (me: User | null): boolean => {
    return !!me && me.provider === "google" && !(me.university && me.campus && me.level);
  };

  const fetchMe = useCallback(async (token: string): Promise<User | null> => {
    try {
      const res = await fetch("/api/auth/me", { headers: { Authorization: "Bearer " + token } });
      const data = await res.json();
      return data.user ?? null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (data.session) {
        const me = await fetchMe(data.session.access_token);
        if (active && me) {
          setUser(me);
          setShowProfilePrompt(wantsGooglePrompt(me));
        }
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      if (session) {
        const me = await fetchMe(session.access_token);
        if (active && me) {
          setUser(me);
          setShowProfilePrompt(wantsGooglePrompt(me));
        }
      } else {
        setUser(null);
        setShowProfilePrompt(false);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [fetchMe]);

  const signIn = (u: User) => {
    setUser(u);
    setShowAuthModal(false);
    localStorage.removeItem("campusmart-user");
  };

  const signOut = () => {
    setUser(null);
    setShowProfileModal(false);
    setShowMyListings(false);
    setShowProfilePrompt(false);
    localStorage.removeItem("campusmart-user");
    supabase.auth.signOut().catch(() => {});
  };

  const updateUser = (u: User) => {
    setUser(u);
    localStorage.removeItem("campusmart-user");
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { Authorization: "Bearer " + data.session.access_token, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: u.name,
          phone: u.phone,
          university: u.university,
          campus: u.campus,
          level: u.level,
          avatar: u.avatar,
        }),
      }).catch(() => {});
    });
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, showAuthModal, setShowAuthModal, authMode, setAuthMode, showProfileModal, setShowProfileModal, showMyListings, setShowMyListings, showProfilePrompt, setShowProfilePrompt, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// ── Modal Context ─────────────────────────────────────────────────────────────
export type PostModalType = "sale" | "rent" | "event" | "food";

interface ModalContextType {
  showPostModal: boolean;
  setShowPostModal: (v: boolean) => void;
  openPostModal: (type?: PostModalType) => void;
  postModalType: PostModalType;
  showStoryModal: boolean;
  setShowStoryModal: (v: boolean) => void;
}

const ModalContext = createContext<ModalContextType>({
  showPostModal: false,
  setShowPostModal: () => {},
  openPostModal: () => {},
  postModalType: "sale",
  showStoryModal: false,
  setShowStoryModal: () => {},
});

export function ModalProvider({ children }: { children: ReactNode }) {
  const [showPostModal, setShowPostModal] = useState(false);
  const [postModalType, setPostModalType] = useState<PostModalType>("sale");
  const [showStoryModal, setShowStoryModal] = useState(false);

  const openPostModal = (type: PostModalType = "sale") => {
    setPostModalType(type);
    setShowPostModal(true);
  };

  return (
    <ModalContext.Provider
      value={{
        showPostModal,
        setShowPostModal,
        openPostModal,
        postModalType,
        showStoryModal,
        setShowStoryModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export const useModal = () => useContext(ModalContext);

// ── University Filter Context ─────────────────────────────────────────────────
interface UniversityContextType {
  selectedUniversity: string | null;
  setSelectedUniversity: (abbr: string | null) => void;
}

const UniversityContext = createContext<UniversityContextType>({
  selectedUniversity: null,
  setSelectedUniversity: () => {},
});

export function UniversityProvider({ children }: { children: ReactNode }) {
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);

  return (
    <UniversityContext.Provider value={{ selectedUniversity, setSelectedUniversity }}>
      {children}
    </UniversityContext.Provider>
  );
}

export const useUniversity = () => useContext(UniversityContext);
