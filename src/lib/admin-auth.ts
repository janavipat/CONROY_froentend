const KEY = "conroy.adminKey";

export function getAdminKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function setAdminKey(value: string): void {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* ignore */
  }
}

export function clearAdminKey(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
