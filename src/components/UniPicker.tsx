"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { UNIVERSITIES } from "@/lib/universities";

type Props = {
  value: string;
  onChange: (abbr: string) => void;
  placeholder?: string;
  compact?: boolean;
  required?: boolean;
  className?: string;
};

export default function UniPicker({
  value,
  onChange,
  placeholder = "Type to search your university...",
  compact = false,
  required = false,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [dropUp, setDropUp] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = UNIVERSITIES.find((u) => u.abbr === value);
  const display = selected ? selected.abbr + " - " + selected.name : value;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return UNIVERSITIES;
    return UNIVERSITIES.filter(
      (u) =>
        u.abbr.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
    );
  }, [query]);

  const close = (commitQuery: boolean) => {
    if (commitQuery) {
      const q = query.trim();
      if (q && results.length > 0) onChange(results[0].abbr);
    }
    setQuery("");
    setOpen(false);
  };

  const pick = (abbr: string) => {
    onChange(abbr);
    setQuery("");
    setOpen(false);
  };

  const decideUp = () => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const need = 260;
    const above = r.top;
    const below = window.innerHeight - r.bottom;
    setDropUp(above >= need ? true : below >= need ? false : above > below);
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        close(true);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query, results]);

  const inputClass = compact
    ? "w-full pr-8 pl-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-xs font-medium text-gray-800 dark:text-gray-200 outline-none focus:border-green-500 transition"
    : "w-full pr-9 pl-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900/40 transition";

  return (
    <div ref={wrapRef} className={"relative " + className}>
      <input
        required={required}
        type="text"
        role="combobox"
        aria-expanded={open}
        autoComplete="off"
        value={open ? query : display}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          if (!open) {
            decideUp();
            setOpen(true);
          }
        }}
        onFocus={() => {
          setQuery("");
          decideUp();
          setOpen(true);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            if (!open) {
              decideUp();
              setOpen(true);
            } else setActive((a) => Math.min(a + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            if (open) {
              e.preventDefault();
              const hit = results[active];
              if (hit) pick(hit.abbr);
            }
          } else if (e.key === "Escape") {
            close(false);
          }
        }}
        className={inputClass}
      />
      <ChevronDown
        className={
          "absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition " +
          (open ? "rotate-180" : "")
        }
      />

      {open && (
        <div
          className={
            "absolute z-50 max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl " +
            (dropUp ? "bottom-full mb-1 " : "top-full mt-1 ") +
            (compact ? "right-0 w-80 max-w-[calc(100vw-1.25rem)]" : "left-0 w-full")
          }
        >
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              No match for "{query}" - try the abbreviation (e.g. KNUST)
            </div>
          ) : (
            results.map((u, i) => (
              <button
                key={u.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(u.abbr)}
                onMouseEnter={() => setActive(i)}
                className={
                  "w-full text-left px-4 py-2.5 flex items-center gap-3 transition " +
                  (i === active ? "bg-green-50 dark:bg-gray-800" : "")
                }
              >
                <span className="shrink-0 min-w-[3.75rem] text-xs font-bold text-green-600 dark:text-green-400">
                  {u.abbr}
                </span>
                <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
                  {u.name}
                </span>
                {u.abbr === value && <Check className="w-4 h-4 shrink-0 text-green-500" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
