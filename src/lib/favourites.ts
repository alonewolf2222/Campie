const KEY = "campieFavs";

export function getFavs(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeFavs(next: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  window.dispatchEvent(new Event("favs-updated"));
}

export function toggleFav(id: string): string[] {
  const cur = getFavs();
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  writeFavs(next);
  return next;
}

export function isFav(id: string): boolean {
  return getFavs().includes(id);
}