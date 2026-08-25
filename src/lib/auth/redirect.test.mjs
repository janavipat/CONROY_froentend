import { safeRedirect, withRedirect } from "./redirect.ts";

/**
 * The redirect destination arrives from the query string, so these cases are
 * the boundary between "return the shopper to checkout" and "hand them to
 * whoever crafted the link". Run with: node --experimental-strip-types
 */

let passed = 0;
let failed = 0;

function check(name, actual, expected) {
  if (actual === expected) {
    passed++;
    console.log(`  PASS  ${name} → ${JSON.stringify(actual)}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name} → expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

console.log("Internal paths are honoured");
check("checkout", safeRedirect("/checkout/payment"), "/checkout/payment");
check("cart", safeRedirect("/cart"), "/cart");
check("with query", safeRedirect("/checkout/payment?step=2"), "/checkout/payment?step=2");
check("with hyphen", safeRedirect("/products/dark-blue-straight-fit"), "/products/dark-blue-straight-fit");
check("encoded once", safeRedirect(encodeURIComponent("/checkout/payment")), "/checkout/payment");

console.log("\nAnything that could name another host is refused");
check("absolute http", safeRedirect("https://evil.test/steal"), null);
check("scheme-relative", safeRedirect("//evil.test"), null);
check("backslash pair", safeRedirect("/\\evil.test"), null);
check("javascript:", safeRedirect("javascript:alert(1)"), null);
check("data:", safeRedirect("data:text/html,<script>"), null);
check("encoded absolute", safeRedirect(encodeURIComponent("https://evil.test")), null);
check("double-encoded scheme-relative", safeRedirect(encodeURIComponent(encodeURIComponent("//evil.test"))), null);
check("tab-hidden scheme", safeRedirect("/\tjavascript:alert(1)"), null);
check("newline-hidden scheme", safeRedirect("/\njavascript:alert(1)"), null);
check("relative, not rooted", safeRedirect("checkout"), null);
check("empty", safeRedirect(""), null);
check("whitespace only", safeRedirect("   "), null);
check("null", safeRedirect(null), null);
check("undefined", safeRedirect(undefined), null);
check("malformed encoding", safeRedirect("%E0%A4%A"), null);

console.log("\nLink building degrades safely");
check(
  "safe destination is carried",
  withRedirect("/account/login", "/checkout/payment"),
  "/account/login?redirect=%2Fcheckout%2Fpayment",
);
check("unsafe destination is dropped", withRedirect("/account/login", "https://evil.test"), "/account/login");
check("empty destination is dropped", withRedirect("/account/login", ""), "/account/login");

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
