import { api } from "./api";

/** Toggles a like for a product. Returns the new liked state + total count. */
export async function toggleLike(
  productHandle: string,
  userKey: string,
): Promise<{ liked: boolean; count: number }> {
  try {
    const { data } = await api.post<{ ok: boolean; liked: boolean; count: number }>(
      "/wishlist/toggle",
      { productHandle, userKey },
    );
    return { liked: data.liked, count: data.count };
  } catch {
    return { liked: false, count: 0 };
  }
}

/** Fetches the product handles a user has liked. */
export async function fetchLikes(userKey: string): Promise<string[]> {
  try {
    const { data } = await api.get<{ ok: boolean; data: string[] }>("/wishlist", {
      params: { userKey },
    });
    return data.data ?? [];
  } catch {
    return [];
  }
}
