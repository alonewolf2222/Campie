"use client";

import { useState, useEffect, useRef } from "react";
import {
  Phone,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useLang, useUniversity } from "@/lib/context";
import type { Event } from "@/lib/mockData";
import ItemDetailModal from "./ItemDetailModal";
import LikeButton from "./LikeButton";
import { bumpStat, apiGet } from "@/lib/stats";

export default function EventsSection() {
  const { t } = useLang();
  const { selectedUniversity } = useUniversity();
  const [events, setEvents] = useState<Event[]>([]);
  const [showContact, setShowContact] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollMarquee = (dir: number) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector(".marquee-track > div");
    const step = card ? card.clientWidth + 24 : 200;
    track.scrollBy({ left: dir * step * 2, behavior: "smooth" });
  };

  useEffect(() => {
    const load = () => {
      apiGet("/api/events")
        .then((r) => (r ? r.json() : { data: [] }))
        .then((j) => setEvents(j.data || []))
        .catch(() => setEvents([]));
    };
    load();
    window.addEventListener("listings-updated", load);
    return () => window.removeEventListener("listings-updated", load);
  }, []);

  const filtered = selectedUniversity
    ? events.filter(
        (e) =>
          e.university === selectedUniversity ||
          e.university.toLowerCase().includes(selectedUniversity.toLowerCase())
      )
    : events;

  return (
    <section id="events" className="py-14 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400 text-sm font-semibold mb-3">
            <Ticket className="w-4 h-4" />
            {t("eventsSection")}
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
            {t("eventsSection")}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-4">{t("eventsSub")}</p>
        </div>

        {/* Warning */}
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-700 dark:text-red-400 font-medium">
            Confirm Program Before Purchasing Ticket.
          </p>
        </div>

        {/* Events Row */}
        <div className="relative">
          <button
            onClick={() => scrollMarquee(-1)}
            className="hidden md:block absolute left-1 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Scroll events left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scrollMarquee(1)}
            className="hidden md:block absolute right-1 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Scroll events right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        <div className="overflow-hidden">
          <div ref={trackRef} className="flex overflow-x-auto no-scrollbar">
            <div className="marquee-track flex w-max gap-6 will-change-transform pb-2">
            {[...filtered, ...filtered].map((event, i) => (
              <div
                key={`${event.id}-${i}`}
                className="flex-none w-72 cursor-pointer"
                onClick={() => { setSelectedEvent(event); setShowContact(null); }}
              >
              {/* Fixed-size image panel: every card gets the same image area.
                  object-contain always shows the whole image — small images get
                  white edges, large images are scaled down to fit. */}
              <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl border border-purple-100 dark:border-gray-800 bg-white dark:bg-white p-2">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-contain transition-transform duration-500"
                />
                {/* Price Chip */}
                <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-purple-900/40 backdrop-blur-sm rounded-xl px-3 py-1.5">
                  <span className="text-base font-extrabold text-purple-600 dark:text-purple-400">
                      {event.price === 0 ? "FREE" : "GH₵ " + event.price.toLocaleString()}
                    </span>
                </div>
                {/* Tickets Left Badge */}
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                    {event.ticketsLeft} {t("ticketsLeft")}
                  </span>
                </div>
                <LikeButton itemType="event" itemId={event.id} initialCount={event.likeCount} liked={event.liked} />
              </div>

              {/* Details directly on the app background */}
              <div className="p-2.5 flex flex-col gap-1.5">
                <h3 className="font-semibold text-gray-900 dark:text-white text-xs leading-snug line-clamp-2">
                  {event.title}
                </h3>

                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                  <MapPin className="w-3 h-3 text-purple-400" />
                  {event.venue} • {event.university}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3 h-3 text-purple-400" />
                  {event.date}
                  <span>•</span>
                  <Clock className="w-3 h-3 text-purple-400" />
                  {event.time}
                </div>

                {showContact === event.id ? (
                  <div className="flex gap-2">
                    <a
                      href={`tel:${event.callNumber}`}
                      onClick={() => bumpStat("event", event.id, "click")}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {t("callSeller")}
                    </a>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowContact(event.id); bumpStat("event", event.id, "click"); }}
                    className="mt-auto w-full py-2.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white text-sm font-bold rounded-full transition"
                  >
                    {t("buyTicket")}
                  </button>
                )}
              </div>
            </div>
          ))}
            </div>
            </div>
        </div>
        </div>
      </div>

      <ItemDetailModal selectedItem={selectedEvent} setSelectedItem={setSelectedEvent} />
    </section>
  );
}
