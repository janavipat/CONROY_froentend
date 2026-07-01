import axios from "axios";

/**
 * Pre-configured Axios instance for the backend API. A request interceptor
 * attaches the admin key (from localStorage) to any /admin/* request so the
 * protected admin endpoints authenticate automatically.
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (
    typeof window !== "undefined" &&
    (config.url ?? "").includes("/admin") &&
    !config.headers.get("x-admin-key")
  ) {
    try {
      const key = localStorage.getItem("conroy.adminKey");
      if (key) config.headers.set("x-admin-key", key);
    } catch {
      /* ignore */
    }
  }
  return config;
});
