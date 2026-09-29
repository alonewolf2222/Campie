"use client";

import { useCallback, useEffect, useState } from "react";
import {
  X, Users as UsersIcon, Package, Flag, RefreshCw,
  Ban, CheckCircle2, Trash2, Eye, EyeOff, ShieldCheck, Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  university?: string;
  campus?: string;
  role?: string;
  status: string;
  created_at?: string;
};

type AdminItem = {
  type: string;
  id: string;
  title: string;
  price: number | null;
  seller: string;
  university: string;
  hidden: boolean;
  image: string | null;
  created_at?: string;
};

type AdminReport = {
  id: string;
  item_type?: string;
  item_id?: string;
  reason?: string;
  details?: string;
  reported_by?: string;
  status?: string;
  created_at?: string;
};

const TYPE_LABELS: Record<string, string> = {
  listings: "Listing",
  food_items: "Food",
  events: "Event",
  stories: "Story",
};

async function adminFetch(path: string, init?: RequestInit) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error("You need to sign in as an admin");
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

export default function AdminPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<"users" | "items" | "reports">("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [items, setItems] = useState<AdminItem[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [itemType, setItemType] = useState("all");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [u, i, r] = await Promise.all([
        adminFetch("/api/admin/users"),
        adminFetch("/api/admin/items"),
        adminFetch("/api/admin/reports"),
      ]);
      setUsers(u.data || []);
      setItems(i.data || []);
      setReports(r.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadAll();
  }, [open, loadAll]);

  if (!open) return null;

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const setStatus = (id: string, status: string) =>
    run(`user-${id}-${status}`, async () => {
      await adminFetch(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await loadAll();
    });

  const deleteUser = (u: AdminUser) =>
    window.confirm(`Delete ${u.name}'s account and all their posts? This cannot be undone.`) &&
    run(`user-del-${u.id}`, async () => {
      await adminFetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
      await loadAll();
    });

  const setHidden = (it: AdminItem, hidden: boolean) =>
    run(`item-${it.id}-${hidden}`, async () => {
      await adminFetch("/api/admin/items", { method: "PATCH", body: JSON.stringify({ type: it.type, id: it.id, action: hidden ? "hide" : "show" }) });
      await loadAll();
    });

  const deleteItem = (it: AdminItem) =>
    window.confirm(`Delete this ${TYPE_LABELS[it.type] || "item"}? This cannot be undone.`) &&
    run(`item-del-${it.id}`, async () => {
      await adminFetch("/api/admin/items", { method: "PATCH", body: JSON.stringify({ type: it.type, id: it.id, action: "delete" }) });
      await loadAll();
    });

  const resolveReport = (id: string) =>
    run(`rep-res-${id}`, async () => {
      await adminFetch("/api/admin/reports", { method: "PATCH", body: JSON.stringify({ id, action: "resolve" }) });
      await loadAll();
    });

  const deleteReport = (id: string) =>
    run(`rep-del-${id}`, async () => {
      await adminFetch("/api/admin/reports", { method: "PATCH", body: JSON.stringify({ id, action: "delete" }) });
      await loadAll();
    });

  const filteredItems = itemType === "all" ? items : items.filter((i) => i.type === itemType);

  return (
    <div className="fixed inset-0 z-[70] bg-white dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">Admin Panel</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Users, content moderation and reports</p>
          </div>
          <button
            onClick={() => { run("refresh", async () => loadAll()); }}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {([
            ["users", "Users", UsersIcon, users.length],
            ["items", "Items", Package, items.length],
            ["reports", "Reports", Flag, reports.length],
          ] as const).map(([key, label, Icon, count]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition shrink-0 ${
                tab === key
                  ? "bg-green-500 text-white shadow-md shadow-green-200 dark:shadow-green-900/40"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === key ? "bg-white/20" : "bg-gray-200 dark:bg-gray-700"}`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="max-w-5xl mx-auto w-full px-4 pt-3">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError("")} className="p-0.5"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-4 space-y-3">
          {/* Users */}
          {tab === "users" && (
            <>
              {users.length === 0 && !loading && <EmptyState text="No users yet." />}
              {users.map((u) => (
                <div key={u.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold shrink-0">
                    {(u.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{u.name}</p>
                      {u.role === "admin" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300">ADMIN</span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.status === "suspended" ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300" : "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300"}`}>
                        {u.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{[u.university, u.campus].filter(Boolean).join(" · ") || "No university set"}</p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {u.role !== "admin" && (
                      <>
                        <button
                          onClick={() => setStatus(u.id, u.status === "suspended" ? "active" : "suspended")}
                          disabled={busy !== null}
                          className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full transition disabled:opacity-50 ${
                            u.status === "suspended"
                              ? "bg-green-500 text-white hover:bg-green-600"
                              : "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60"
                          }`}
                        >
                          {busy === `user-${u.id}-${u.status === "suspended" ? "active" : "suspended"}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : u.status === "suspended" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                          {u.status === "suspended" ? "Activate" : "Suspend"}
                        </button>
                        <button
                          onClick={() => deleteUser(u)}
                          disabled={busy !== null}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition disabled:opacity-50"
                        >
                          {busy === `user-del-${u.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          Delete
                        </button>
                      </>
                    )}
                    {u.role === "admin" && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 italic">Protected</span>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Items */}
          {tab === "items" && (
            <>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[["all", "All"], ["listings", "Listings"], ["food_items", "Food"], ["events", "Events"], ["stories", "Stories"]].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setItemType(key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition shrink-0 ${itemType === key ? "bg-green-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {filteredItems.length === 0 && !loading && <EmptyState text="No items in this category." />}
              {filteredItems.map((it) => (
                <div key={`${it.type}-${it.id}`} className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
                  {it.image ? (
                    <img src={it.image} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{it.title}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">{TYPE_LABELS[it.type] || it.type}</span>
                      {it.hidden && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300">HIDDEN</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {it.seller}{it.university ? ` · ${it.university}` : ""}
                      {typeof it.price === "number" ? ` · ${it.price} DA` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setHidden(it, !it.hidden)}
                      disabled={busy !== null}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50"
                    >
                      {busy === `item-${it.id}-${!it.hidden}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : it.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {it.hidden ? "Show" : "Hide"}
                    </button>
                    <button
                      onClick={() => deleteItem(it)}
                      disabled={busy !== null}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition disabled:opacity-50"
                    >
                      {busy === `item-del-${it.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Reports */}
          {tab === "reports" && (
            <>
              {reports.length === 0 && !loading && <EmptyState text="No reports yet." />}
              {reports.map((r) => (
                <div key={r.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{r.reason || "Report"}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">{r.item_type || "item"}</span>
                      {r.status && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status === "resolved" ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300" : "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300"}`}>
                          {r.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                    {r.details && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{r.details}</p>}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {r.reported_by ? `By ${r.reported_by} · ` : ""}Item {r.item_id ? r.item_id.slice(0, 8) : "n/a"}{r.created_at ? ` · ${new Date(r.created_at).toLocaleDateString()}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {r.status !== "resolved" && (
                      <button
                        onClick={() => resolveReport(r.id)}
                        disabled={busy !== null}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full bg-green-500 text-white hover:bg-green-600 transition disabled:opacity-50"
                      >
                        {busy === `rep-res-${r.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Resolve
                      </button>
                    )}
                    <button
                      onClick={() => deleteReport(r.id)}
                      disabled={busy !== null}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition disabled:opacity-50"
                    >
                      {busy === `rep-del-${r.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Package className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
      <p className="text-sm text-gray-400 dark:text-gray-500">{text}</p>
    </div>
  );
}