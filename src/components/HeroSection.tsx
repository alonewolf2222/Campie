"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Tag, RotateCcw } from "lucide-react";
import { useLang, useAuth, useModal } from "@/lib/context";

const HERO_IMAGES = [
  "https://miro.medium.com/1*mbc5bJsA3hpDXmHHnTgU6g.jpeg",
  "https://thumbs.dreamstime.com/b/group-five-african-college-students-spending-time-together-campus-university-yard-black-afro-friends-studying-education-219663757.jpg"
];

export default function HeroSection() {
  const { t } = useLang();
  const { user, setShowAuthModal, setAuthMode, setShowProfileModal } = useAuth();
  const { setShowPostModal } = useModal();
  const [currentImage, setCurrentImage] = useState(0);

  const openPost = () => {
    if (user) {
      if (!user.university || !user.campus || !user.level) {
        setShowProfileModal(true);
        return;
      }
      setShowPostModal(true);
    } else {
      setAuthMode("signin");
      setShowAuthModal(true);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-[520px] md:h-[600px] overflow-hidden bg-white">
      {/* Background Images */}
      {HERO_IMAGES.map((src, index) => (
        <img
          key={src}
          src={src}
          alt="Campus students"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            index === currentImage ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/60 to-transparent" />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 border border-green-300 rounded-full text-green-700 text-xs font-semibold mb-4">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Ghana's #1 Campus Marketplace
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4">
              {t("heroTitle").split("\n").map((line, i) => (
                <span key={i} className={i === 0 ? "block" : "block text-green-400"}>
                  {line}
                </span>
              ))}
            </h1>

            {/* Subtitle */}
            <p className="text-gray-200 text-base md:text-lg mb-8 leading-relaxed">
              {t("heroSub")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3">
              <a
                href="#buy"
                className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-full transition shadow-lg shadow-green-500/30"
              >
                <ShoppingBag className="w-4 h-4" />
                {t("buyItems")}
              </a>
              <button
                type="button"
                onClick={openPost}
                className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-full border border-gray-300 transition"
              >
                <Tag className="w-4 h-4" />
                {t("sellItems")}
              </button>
              <button
                type="button"
                onClick={openPost}
                className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-full border border-gray-300 transition"
              >
                <RotateCcw className="w-4 h-4" />
                {t("rentGear")}
              </button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mt-10">
              {[
                { label: "Active Students", value: "12K+" },
                { label: "Universities", value: "57+" },
                { label: "Items Listed", value: "8K+" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-green-400">{stat.value}</div>
                  <div className="text-gray-300 text-xs mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Wave bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" className="w-full">
          <path d="M0 60L1440 60L1440 20C1440 20 1080 60 720 40C360 20 0 50 0 50V60Z" className="fill-white" />
        </svg>
      </div>
    </section>
  );
}