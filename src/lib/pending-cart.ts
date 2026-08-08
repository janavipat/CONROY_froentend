/**
 * A single add-to-cart the visitor attempted while signed out.
 *
 * `AddToCartForm` parks the intent here and sends them to the login page;
 * `EmailAuthForm` reads it after a successful sign-in to send them back to the
 * right product, and `AddToCartForm` then completes the add and clears it.
 *
 * sessionStorage (not localStorage) so an abandoned intent dies with the tab —
 * an add resumed days later would surprise the visitor.
 */

const KEY = "conroy.pendingCart";

export interface PendingCartItem {
  handle: string;
  size: string;
  quantity: number;
}

export function setPendingCartItem(item: PendingCartItem): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(item));
  } catch {
    /* private mode / storage disabled — the visitor just adds again after login */
  }
}

export function readPendingCartItem(): PendingCartItem | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingCartItem>;
    if (!parsed.handle || !parsed.size) return null;
    return {
      handle: parsed.handle,
      size: parsed.size,
      quantity: Math.max(1, Number(parsed.quantity) || 1),
    };
  } catch {
    return null;
  }
}

export function clearPendingCartItem(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
