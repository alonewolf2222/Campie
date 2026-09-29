"use client";

import { useState } from "react";
import { MapPin, ImageOff } from "lucide-react";
import FavButton from "./FavButton";

export interface ListingCardItem {
  id: string;
  title: string;
  price: number;
  image?: string;
  initialPrice?: number;
  type?: string;
  university?: string;
  rentPeriod?: string;
}

function TypeBadge({ type }: { type?: string }) {
  const base = "absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full z-10";
  if (type === "sale")
    return <span className={`${base} bg-orange-500 text-white`}>SALE</span>;
  if (type === "rent")
    return <span className={`${base} bg-emerald-500 text-white`}>RENT</span>;
  if (type === "event")
    return <span className={`${base} bg-purple-500 text-white`}>EVENT</span>;
  if (type === "food")
    return <span className={`${base} bg-red-500 text-white`}>FOOD</span>;
  return null;
}

export default function ListingCard({
  item,
  onClick,
}: {
  item: ListingCardItem;
  onClick?: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const imageOk = Boolean(item.image) && !imgError;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className="group w-full transition-all cursor-pointer"
    >
      {/* Image area: keeps the image's actual size / natural proportions so nothing is cropped. */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800">
        {imageOk ? (
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full aspect-[4/3] flex items-center justify-center">
            <div className="flex flex-col items-center gap-1.5 text-gray-300 dark:text-gray-600">
              <ImageOff className="w-8 h-8" />
              <span className="text-[11px] font-medium">No image</span>
            </div>
          </div>
        )}
        <TypeBadge type={item.type} />
        <FavButton id={item.id} />
      </div>

      <div className="p-2.5 flex flex-col gap-1.5">
        <h3 className="font-semibold text-gray-900 dark:text-white text-xs leading-snug break-words">
          {item.title}
        </h3>
        <div className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="font-bold text-gray-900 dark:text-white text-sm">
            {item.type === "event" && item.price === 0
              ? "FREE"
              : "GH₵ " + item.price.toLocaleString()}
          </span>
          {item.initialPrice != null && item.initialPrice > 0 && (
            <span className="text-[11px] text-gray-400 line-through">
              GH₵ {item.initialPrice.toLocaleString()}
            </span>
          )}
          {item.type === "rent" && item.rentPeriod && (
            <span className="text-[11px] text-gray-400">/ {item.rentPeriod}</span>
          )}
        </div>
        <p className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
          <MapPin className="w-3 h-3 text-gray-400 dark:text-gray-500" />
          {item.university}
        </p>
      </div>
    </div>
  );
}