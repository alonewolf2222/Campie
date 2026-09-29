"use client";

import { useEffect, useState } from "react";
import { GraduationCap, MapPin } from "lucide-react";
import { useAuth } from "@/lib/context";
import UniPicker from "@/components/UniPicker";

const LEVELS = ["100", "200", "300", "400", "500", "600", "700"];

export default function ProfilePromptModal() {
  const { user, showProfilePrompt, setShowProfilePrompt, updateUser } = useAuth();
  const [form, setForm] = useState({ university: "", campus: "", level: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!showProfilePrompt || !user) return;
    setForm({ university: user.university || "", campus: user.campus || "", level: user.level || "" });
    setError("");
  }, [showProfilePrompt, user]);

  useEffect(() => {
    if (showProfilePrompt && user && user.university && user.campus && user.level) {
      setShowProfilePrompt(false);
    }
  }, [showProfilePrompt, user, setShowProfilePrompt]);

  if (!showProfilePrompt || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.university || !form.campus || !form.level) {
      setError("University, Campus and Level are all required.");
      return;
    }
    updateUser({ ...user, university: form.university, campus: form.campus, level: form.level });
    setShowProfilePrompt(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowProfilePrompt(false)}>
      <div
        className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Finish setting up your profile</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Welcome, {user.name.split(" ")[0]}! University, Campus and Level are required before you can post — in every category.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">University</label>
            <UniPicker
              value={form.university}
              onChange={(abbr) => setForm((f) => ({ ...f, university: abbr }))}
              placeholder="Choose your university..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Campus</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={form.campus}
                onChange={(e) => setForm((f) => ({ ...f, campus: e.target.value }))}
                placeholder="e.g. Main Campus"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-sm text-gray-900 dark:text-white outline-none focus:border-green-500 transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Level</label>
            <select
              value={form.level}
              onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-sm text-gray-900 dark:text-white outline-none focus:border-green-500 transition"
            >
              <option value="">Select your level</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>Level {l}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full text-sm transition shadow-lg shadow-green-200 dark:shadow-green-900/40"
            >
              Save profile
            </button>
            <button
              type="button"
              onClick={() => setShowProfilePrompt(false)}
              className="px-5 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold rounded-full text-sm transition hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Later
            </button>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center pt-1">
            You can't post until these are set. You can update them anytime in your Profile.
          </p>
        </form>
      </div>
    </div>
  );
}