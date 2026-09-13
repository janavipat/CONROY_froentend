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

/**
 * The handles this visitor has liked.
 *
 * Throws when the request fails, so an unreachable wishlist is not mistaken for
 * an empty one. The optimistic toggle is unaffected: it works from local state
 * and reconciles against its own response.
 */
export async function fetchLikes(userKey: string): Promise<string[]> {
  const { data } = await api.get<{ ok: boolean; data: string[] }>("/wishlist", {
    params: { userKey },
  });
  return data.data ?? [];
}
