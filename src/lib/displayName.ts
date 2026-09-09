const STORAGE_KEY = "fast-chat:displayName";

export function getDisplayName(): string | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(STORAGE_KEY);
  return value?.trim() || null;
}

export function setDisplayName(name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  localStorage.setItem(STORAGE_KEY, trimmed);
}
