"use client";

import { useState, useEffect } from "react";

export default function ClientErrorCatcher() {
  const [fatal, setFatal] = useState<string | null>(null);

  useEffect(() => {
    const send = (data: unknown) => {
      try {
        navigator.sendBeacon(
          "/api/client-log",
          new Blob([JSON.stringify(data)], { type: "application/json" })
        );
      } catch {}
    };

    const onErr = (e: ErrorEvent) =>
      send({ type: "error", msg: e.message, src: e.filename, line: e.lineno });
    const onRej = (e: PromiseRejectionEvent) =>
      send({ type: "rejection", msg: String(e.reason) });
    const onFatal = (e: ErrorEvent) => {
      setFatal(e.message || "Unknown fatal JS error");
    };

    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    window.addEventListener("error", onFatal);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
      window.removeEventListener("error", onFatal);
    };
  }, []);

  if (fatal) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-white dark:bg-gray-950 p-8">
        <div className="w-full max-w-sm rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
          <p className="text-red-600 dark:text-red-400 font-bold mb-2">
            App failed to start
          </p>
          <p className="text-sm text-red-700 dark:text-red-300 break-words">
            {fatal}
          </p>
          <button
            onClick={() => location.reload()}
            className="mt-4 w-full py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-bold"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return null;
}