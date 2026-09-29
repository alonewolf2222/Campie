"use client";

import { useState } from "react";
import { X, Eye, EyeOff, ShoppingBag } from "lucide-react";
import { useLang, useAuth } from "@/lib/context";
import { supabase } from "@/lib/supabase";
import UniPicker from "@/components/UniPicker";

export default function AuthModal() {
  const { t } = useLang();
  const { showAuthModal, setShowAuthModal, authMode, setAuthMode, signIn } = useAuth();
  const [showPwd, setShowPwd] = useState(false);
  const [pwError, setPwError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", university: "", campus: "", level: "",
  });

  if (!showAuthModal) return null;

  const resolveMe = async (token: string) => {
    try {
      const res = await fetch("/api/auth/me", { headers: { Authorization: "Bearer " + token } });
      const data = await res.json();
      return data.user ?? null;
    } catch {
      return null;
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setPwError("");
    setNotice("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setPwError("Google sign-in isn't ready yet: " + error.message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setNotice("");
    if (form.password.length < 8 || form.password.length > 16) {
      setPwError(authMode === "signup" ? "Password must be 8 to 16 characters" : "Incorrect password.");
      return;
    }
    setLoading(true);

    if (authMode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            name: form.name,
            phone: form.phone,
            university: form.university,
            campus: form.campus,
            level: form.level,
          },
        },
      });
      if (error) {
        setPwError(error.message);
        setLoading(false);
        return;
      }
      if (data.session) {
        const me = await resolveMe(data.session.access_token);
        if (me) {
          signIn(me);
        } else {
          setPwError("Account created. Please sign in.");
          setAuthMode("signin");
        }
      } else {
        setNotice("We sent a confirmation link to your email. Click it to activate your account, then sign in.");
        setAuthMode("signin");
      }
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (error) {
      setPwError("Incorrect email or password.");
      setLoading(false);
      return;
    }
    const me = await resolveMe(data.session!.access_token);
    if (me && me.status === "suspended") {
      await supabase.auth.signOut().catch(() => {});
      setPwError("Your account has been suspended. Contact support.");
      setLoading(false);
      return;
    }
    if (me) signIn(me);
    setLoading(false);
  };

  const levels = ["100", "200", "300", "400", "500", "600", "700"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAuthModal(false)}>
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
        {/* Close Button (pinned while scrolling) */}
        <div className="sticky top-0 z-30 h-0 flex justify-end">
          <button
            onClick={() => setShowAuthModal(false)}
            className="m-4 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-500 dark:text-gray-400 shadow hover:bg-gray-100 dark:hover:bg-gray-700 backdrop-blur"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-8 pt-8 pb-12">
          <h2 className="text-2xl font-extrabold text-white">
            {authMode === "signin" ? t("welcomeBack") : t("createAccount")}
          </h2>
          <p className="text-green-100 text-sm mt-1">{t("joinCommunity")}</p>
        </div>

        {/* Form Card */}
        <div className="px-8 pb-8 -mt-6 relative">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-6">
            
            {/* Tab Switch */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
              <button
                onClick={() => setAuthMode("signin")}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                  authMode === "signin"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {t("signIn")}
              </button>
              <button
                onClick={() => setAuthMode("signup")}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                  authMode === "signup"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {t("signUp")}
              </button>
            </div>

            {/* Google Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition mb-4 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {t("continueGoogle")}
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-400">{t("orEmail")}</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {authMode === "signup" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("fullName")}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kwame Mensah"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 transition"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("email")}</label>
                <input
                  type="email"
                  required
                  placeholder="student@university.edu.gh"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("password")}</label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    minLength={8}
                    maxLength={16}
                    value={form.password}
                    onChange={(e) => { setForm({ ...form, password: e.target.value }); setPwError(""); }}
                    className="w-full px-4 py-2.5 pr-10 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {authMode === "signup" && (
                  <p className="text-[11px] text-gray-400 mt-1">8 - 16 characters</p>
                )}
                {pwError && (
                  <p className="text-[11px] font-semibold text-red-500 mt-1">{pwError}</p>
                )}
              </div>

              {authMode === "signup" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("phoneNumber")}</label>
                    <input
                      type="tel"
                      placeholder="+233 24 000 0000"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("university")}</label>
                    <UniPicker
                      required
                      value={form.university}
                      onChange={(abbr) => setForm({ ...form, university: abbr })}
                      placeholder="Type to search your university..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Campus</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Legon, Achimota, Kumasi..."
                      value={form.campus}
                      onChange={(e) => setForm({ ...form, campus: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("level")}</label>
                    <select
                      required
                      value={form.level}
                      onChange={(e) => setForm({ ...form, level: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:border-green-400 transition"
                    >
                      <option value="">Select your level</option>
                      {levels.map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {authMode === "signin" && (
                <div className="text-right">
                  <button type="button" className="text-xs text-green-600 hover:underline">
                    {t("forgotPassword")}
                  </button>
                </div>
              )}

              {notice && (
                  <p className="px-3 py-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-[12px] font-medium text-green-700 dark:text-green-400 mb-4">
                    {notice}
                  </p>
                )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full text-sm transition shadow-lg shadow-green-200 dark:shadow-green-900/40 disabled:opacity-50"
              >
                {loading ? "Please wait..." : authMode === "signin" ? t("signIn") : t("signUp")}
              </button>
            </form>

            {authMode === "signup" && (
              <p className="text-xs text-center text-gray-400 mt-3">{t("termsAgree")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
