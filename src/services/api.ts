import axios from "axios";

/**
 * Pre-configured Axios instance. The live site is a Shopify storefront; this
 * replica ships with a stubbed service layer so forms and newsletter sign-ups
 * have a realistic integration point that can be pointed at a real backend.
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});
