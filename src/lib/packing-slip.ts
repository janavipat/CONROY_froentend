import type { AdminOrder } from "@/services/admin";
import { SITE } from "@/lib/site";

function esc(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function orderRef(o: AdminOrder): string {
  return `#${o.id.slice(0, 8).toUpperCase()}`;
}

/** Builds one order's packing slip, matching the reference Shopify layout. */
function slip(o: AdminOrder): string {
  const address = esc(o.shippingAddress) || "—";
  const name = esc(o.customerName || o.email);
  const phone = o.phone ? `<br/>${esc(o.phone)}` : "";

  const rows = o.items
    .map(
      (it) => `
      <tr>
        <td class="item">
          <span class="title">${esc(it.title)}</span>
          <span class="variant">${esc(it.size)} / ${esc(it.fit)}</span>
        </td>
        <td class="qty">${it.quantity} of ${it.quantity}</td>
      </tr>`,
    )
    .join("");

  return `
  <section class="slip">
    <div class="brand">${esc(SITE.name)}</div>

    <div class="cols">
      <div class="col">
        <h4>SHIP TO</h4>
        <p>${name}<br/>${address}${phone}</p>
      </div>
      <div class="col">
        <p class="order"><strong>Order ${orderRef(o)}</strong><br/>${formatDate(o.createdAt)}</p>
        <h4>BILL TO</h4>
        <p>${name}<br/>${address}</p>
      </div>
    </div>

    <h4 class="items-h">ITEMS</h4>
    <table>
      <thead><tr><th>ITEM</th><th class="qty">QUANTITY</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="foot">
      <p>Thank you for shopping with us!</p>
      <p>${esc(SITE.name)} · ${esc(SITE.contact.email)} · ${esc(SITE.url.replace(/^https?:\/\//, ""))}</p>
    </div>
  </section>`;
}

const STYLES = `
  * { box-sizing: border-box; }
  body { font-family: Helvetica, Arial, sans-serif; color: #1a1a1a; margin: 0; }
  .slip { padding: 44px 40px; page-break-after: always; }
  .slip:last-child { page-break-after: auto; }
  .brand { font-size: 24px; font-weight: 700; letter-spacing: 0.14em; margin-bottom: 28px; }
  .cols { display: flex; justify-content: space-between; gap: 40px; margin-bottom: 26px; }
  .col { width: 48%; }
  h4 { font-size: 11px; letter-spacing: 0.08em; color: #6b6b6b; margin: 0 0 6px; }
  p { font-size: 12.5px; line-height: 1.5; margin: 0 0 14px; }
  .order { margin-bottom: 18px; }
  .items-h { margin-top: 8px; border-top: 1px solid #e5e5e5; padding-top: 16px; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th { text-align: left; font-size: 11px; letter-spacing: 0.06em; color: #6b6b6b; border-bottom: 1px solid #e5e5e5; padding: 8px 0; }
  td { padding: 10px 0; border-bottom: 1px solid #f0f0f0; vertical-align: top; font-size: 12.5px; }
  .item .title { display: block; font-weight: 600; }
  .item .variant { display: block; color: #6b6b6b; font-size: 11.5px; }
  .qty { text-align: right; white-space: nowrap; }
  .foot { margin-top: 40px; border-top: 1px solid #e5e5e5; padding-top: 16px; font-size: 11.5px; color: #6b6b6b; }
  .foot p { margin: 0 0 4px; }
  @media print { .slip { padding: 32px; } }
`;

/**
 * Renders packing slips for the given orders and opens the print dialog, where
 * the user chooses "Save as PDF" (or prints). Mirrors Shopify's flow. Uses a
 * hidden iframe so it's never blocked by pop-up blockers.
 */
export function printPackingSlips(orders: AdminOrder[]): void {
  if (orders.length === 0) return;

  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Packing slips</title><style>${STYLES}</style></head><body>${orders
    .map(slip)
    .join("")}</body></html>`;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  const win = iframe.contentWindow!;
  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  win.onafterprint = cleanup;
  // Give images/fonts a beat to lay out, then print.
  setTimeout(() => {
    win.focus();
    win.print();
    cleanup();
  }, 250);
}
