import { isIosSafari, isInstalled } from "./install-state.ts";

/**
 * Which device sees which install UI.
 *
 * Getting this wrong is visible to customers in both directions: an iPhone
 * shown an Install button that cannot work, or an Android shown instructions
 * for a Share sheet it does not have. Run with: node --experimental-strip-types
 */

let passed = 0;
let failed = 0;

function check(name, actual, expected) {
  if (actual === expected) {
    passed++;
    console.log(`  PASS  ${name} → ${actual}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name} → expected ${expected}, got ${actual}`);
  }
}

/** Stands in for the browser globals the helpers read. */
function as(ua, { platform = "", maxTouchPoints = 0, standalone, displayMode = "browser" } = {}) {
  // navigator is a getter-only global in Node, so it is redefined rather than assigned.
  Object.defineProperty(globalThis, "navigator", {
    value: { userAgent: ua, platform, maxTouchPoints, standalone },
    configurable: true,
  });
  globalThis.window = {
    navigator: globalThis.navigator,
    matchMedia: (q) => ({ matches: q.includes(displayMode) }),
  };
}

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const IPAD_SAFARI =
  "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const IPADOS_AS_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
const IOS_CHROME =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/125.0 Mobile/15E148 Safari/604.1";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36";
const DESKTOP_CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
const DESKTOP_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";

console.log("iOS guide shows on iPhone and iPad Safari");
as(IPHONE_SAFARI);
check("iPhone Safari", isIosSafari(), true);
as(IPAD_SAFARI);
check("iPad Safari", isIosSafari(), true);
as(IPADOS_AS_MAC, { platform: "MacIntel", maxTouchPoints: 5 });
check("iPadOS reporting as Mac", isIosSafari(), true);

console.log("\nand nowhere else");
as(IOS_CHROME);
check("Chrome on iOS (no Share sheet)", isIosSafari(), false);
as(ANDROID_CHROME);
check("Android Chrome", isIosSafari(), false);
as(DESKTOP_CHROME);
check("desktop Chrome", isIosSafari(), false);
as(DESKTOP_SAFARI, { platform: "MacIntel", maxTouchPoints: 0 });
check("desktop Safari (no touch)", isIosSafari(), false);

console.log("\nAlready-installed detection");
as(IPHONE_SAFARI, { standalone: true });
check("iOS home-screen app", isInstalled(), true);
as(ANDROID_CHROME, { displayMode: "standalone" });
check("Android installed", isInstalled(), true);
as(DESKTOP_CHROME, { displayMode: "browser" });
check("plain browser tab", isInstalled(), false);
as(IPHONE_SAFARI);
check("iOS Safari tab", isInstalled(), false);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
