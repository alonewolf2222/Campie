"use client";

import { ShoppingBag, Heart, Share2, MessageSquare, Globe, Play } from "lucide-react";
import { useState } from "react";
import { useLang } from "@/lib/context";

export default function Footer() {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);

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
      return true;
    } catch {
      return false;
    }
  };

  const shareCampie = () => {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const text = "Campie - Ghana's campus marketplace. Buy, sell, rent and connect!\n\n" + url;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        navigator.share({ title: "Campie", text, url }).catch(() => {});
        return;
      }
    } catch {}
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => showCopied(), () => { if (fallbackCopy(text)) showCopied(); });
      } else if (fallbackCopy(text)) {
        showCopied();
      }
    } catch {
      if (fallbackCopy(text)) showCopied();
    }
  };

  const showCopied = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollTo = (href: string) => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(href.slice(1));
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const socialActions: { Icon: typeof Share2; title: string; onClick: () => void }[] = [
    { Icon: Share2, title: "Share Campie", onClick: shareCampie },
    { Icon: MessageSquare, title: "Give feedback", onClick: () => { const m = window.confirm("We'd love your feedback! This will open your email app."); if (m) window.location.href = "mailto:support@campie.com?subject=Campie%20Feedback"; } },
    { Icon: Globe, title: "Visit website", onClick: () => scrollTo("#buy") },
    { Icon: Play, title: "Campus stories", onClick: () => scrollTo("#stories") },
  ];

  return (
    <footer className="bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 pt-12 pb-6 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <span className="font-bold text-gray-900 text-xl mb-2">Camp<span className="text-green-500">ie</span></span>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Ghana's #1 campus marketplace for students to buy, sell, rent, and connect.
            </p>
            <div className="flex gap-3">
              {socialActions.map(({ Icon, title, onClick }, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={onClick}
                  title={title}
                  aria-label={title}
                  className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-green-500 flex items-center justify-center transition text-gray-600 hover:text-white"
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
            {copied && <p className="text-xs text-green-500 mt-2 font-semibold">Link copied!</p>}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[{ label: "Buy Items", href: "#buy" }, { label: "Sell Items", href: "#buy" }, { label: "Rent Gear", href: "#buy" }, { label: "Events & Tickets", href: "#events" }, { label: "Food Corner", href: "#food" }, { label: "Campus Stories", href: "#stories" }].map((link) => (
                <li key={link.label}>
                  <button type="button" onClick={() => scrollTo(link.href)} className="hover:text-green-400 transition">{link.label}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Universities */}
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-4">Top Universities</h4>
            <ul className="space-y-2 text-sm">
              {["UG", "KNUST", "UCC", "Ashesi", "UPSA", "UDS", "UEW"].map((uni) => (
                <li key={uni}>
                  <button type="button" onClick={() => scrollTo("#buy")} className="hover:text-green-400 transition">{uni}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              {[{ label: "Safety Guide", href: "#buy" }, { label: "Help Center", href: "#buy" }, { label: "Report a Listing", href: "#buy" }, { label: "Privacy Policy", href: "#stories" }, { label: "Terms of Service", href: "#stories" }, { label: "Contact Us", href: "#buy" }].map((link) => (
                <li key={link.label}>
                  <button type="button" onClick={() => scrollTo(link.href)} className="hover:text-green-400 transition">{link.label}</button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">
            &copy; 2025 CampusMart GH. Made with <Heart className="w-3 h-3 inline text-red-400" /> for Ghanaian students.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-600">12,847 students online</span>
            </div>
            <span>&#127757; Made in Ghana</span>
          </div>
        </div>
      </div>
    </footer>
  );
}