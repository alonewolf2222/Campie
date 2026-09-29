"use client";

import { useState, useRef } from "react";
import { UNIVERSITIES } from "@/lib/universities";
import { GraduationCap, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useUniversity } from "@/lib/context";

export default function UniversityBar() {
  const [local, setLocal] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const { selectedUniversity, setSelectedUniversity } = useUniversity();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const selected = selectedUniversity ?? local;

  const handleSelect = (value: string) => {
    if (value === "all") {
      setLocal(null);
      setSelectedUniversity(null);
    } else {
      setLocal(value);
      setSelectedUniversity(value);
    }
  };

  const onAllSchoolsClick = () => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      setShowPicker(true);
    } else {
      handleSelect("all");
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <GraduationCap className="w-4 h-4" />
            <span className="hidden sm:block">Filter:</span>
          </div>

          <button
            onClick={onAllSchoolsClick}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              selected === null
                ? "bg-green-500 text-white"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600"
            }`}
          >
            All Schools
          </button>

          <button
            onClick={() => scroll("left")}
            className="shrink-0 p-1 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 border border-gray-200 dark:border-gray-700"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={scrollContainerRef}
            className="flex items-center gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
          >
            {UNIVERSITIES.map((uni) => (
              <button
                key={uni.id}
                onClick={() => handleSelect(selected === uni.abbr ? "all" : uni.abbr)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  selected === uni.abbr
                    ? "bg-green-500 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600"
                }`}
                title={uni.name}
              >
                {uni.abbr}
              </button>
            ))}
          </div>

          <button
            onClick={() => scroll("right")}
            className="shrink-0 p-1 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 border border-gray-200 dark:border-gray-700"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile full-name university picker */}
      {showPicker && (
        <div
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setShowPicker(false)}
        >
          <div
            className="w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85dvh] flex flex-col animate-in slide-in-from-bottom-4 duration-300 safe-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Select University</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">All schools, full names</p>
              </div>
              <button
                onClick={() => setShowPicker(false)}
                className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              <button
                onClick={() => {
                  handleSelect("all");
                  setShowPicker(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-semibold transition ${
                  selected === null
                    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                All Schools
                <GraduationCap className="w-4 h-4" />
              </button>
              {UNIVERSITIES.map((uni) => (
                <button
                  key={uni.id}
                  onClick={() => {
                    handleSelect(uni.abbr);
                    setShowPicker(false);
                  }}
                  className={`w-full px-4 py-3 rounded-xl text-left text-sm transition ${
                    selected === uni.abbr
                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 font-semibold"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {uni.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
