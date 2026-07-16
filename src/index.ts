import dns from "node:dns";
import { createApp } from "./app.js";
import { env } from "./config/env.js";

// Prefer IPv4 when resolving outbound hosts. graph.facebook.com advertises an
// AAAA record, and on networks without a working IPv6 route Node tries it first
// and the TLS handshake is reset (ECONNRESET) before it falls back — which shows
// up as "fetch failed" when sending WhatsApp OTPs. IPv4 addresses are only
// re-ordered ahead of IPv6, never removed, so IPv6-only hosts still resolve.
dns.setDefaultResultOrder("ipv4first");

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`\n🚀 CONROY backend running on http://localhost:${env.PORT}`);
  console.log(`   Health:  http://localhost:${env.PORT}/health`);
  console.log(`   API:     http://localhost:${env.PORT}/api/products\n`);
});
