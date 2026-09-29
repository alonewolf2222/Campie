"use client";

import { useState, useEffect } from "react";
import { Plus, X, Play } from "lucide-react";
import { useLang, useAuth, useModal } from "@/lib/context";
import type { Story } from "@/lib/mockData";

export default function StoriesSection() {
  const { t } = useLang();
  const { user, setShowAuthModal, setAuthMode } = useAuth();
  const { setShowStoryModal } = useModal();
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStory, setActiveStory] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stories")
      .then((r) => r.json())
      .then((j) => setStories(j.data || []))
      .catch(() => setStories([]));
  }, []);

  const handleAddStory = () => {
    if (!user) { setAuthMode("signin"); setShowAuthModal(true); return; }
    setShowStoryModal(true);
  };

  return (
    <section id="stories" className="py-4 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t("storiesSection")}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-200">{t("storiesSub")}</p>
          </div>
        </div>

        {/* Stories Row */}
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
          {/* Add Story */}
          <button
            onClick={handleAddStory}
            className="shrink-0 flex flex-col items-center gap-1.5"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-dashed border-green-400 flex items-center justify-center hover:border-green-500 transition">
              <Plus className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium max-w-[72px] text-center leading-tight">
              {t("addStory")}
            </span>
          </button>

          {/* Story Items */}
          {stories.map((story) => (
            <button
              key={story.id}
              onClick={() => setActiveStory(story.id)}
              className="shrink-0 flex flex-col items-center gap-1.5"
            >
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden relative border-2 transition ${story.viewed ? "border-gray-300 dark:border-gray-600 opacity-70" : "border-green-400 ring-2 ring-green-300 dark:ring-green-700"}`}>
                <img
                  src={story.thumbnail}
                  alt={story.user}
                  className="w-full h-full object-cover"
                />
                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
                {/* Avatar */}
                <div className="absolute top-1 left-1 w-6 h-6 rounded-full border-2 border-white overflow-hidden">
                  <img src={story.avatar} alt={story.user} className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 max-w-[72px] truncate">{story.user}</p>
                <p className="text-[10px] text-gray-400">{story.university}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setActiveStory(null)}>
          <button
            className="absolute top-4 right-4 text-white p-2 bg-white/20 rounded-full hover:bg-white/30 z-50"
            onClick={() => setActiveStory(null)}
          >
            <X className="w-6 h-6" />
          </button>
          {(() => {
            const story = stories.find((s) => s.id === activeStory);
            if (!story) return null;
            return (
              <div className="relative w-full max-w-sm mx-4 max-h-[calc(100dvh-4rem)]" onClick={(e) => e.stopPropagation()}>
                {/* Progress bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 rounded-full z-10 mx-3 mt-3">
                  <div className="h-full bg-white rounded-full" style={{ width: "60%", transition: "width 30s linear" }} />
                </div>

                {/* Story Content */}
                <div className="rounded-full overflow-hidden aspect-[9/16] relative">
                  <img src={story.thumbnail} alt={story.user} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />

                  {/* User info */}
                  <div className="absolute top-6 left-0 right-0 flex items-center gap-2 px-4">
                    <img src={story.avatar} alt={story.user} className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                    <div>
                      <p className="text-white font-semibold text-sm">{story.user}</p>
                      <p className="text-white/70 text-xs">{story.university} · {story.timeAgo}</p>
                    </div>
                  </div>

                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40">
                      <Play className="w-8 h-8 text-white fill-white ml-1" />
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className="text-white/80 text-xs">30 sec story · Tap to view</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </section>
  );
}