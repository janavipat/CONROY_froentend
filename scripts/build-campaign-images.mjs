// Builds the responsive variants of the homepage campaign photographs.
//
//   node scripts/build-campaign-images.mjs
//
// Reads the originals in public/brand/ (2000 × 1091, JPEG ~q90 — the largest
// versions that exist) and writes WebP copies at the widths PhotoBanner lists
// into public/brand/campaign/. Never enlarges: the widest variant is the
// original's own width. Re-run after replacing an original.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

// Keep WIDTHS in step with CAMPAIGN_WIDTHS in src/sections/PhotoBanner.tsx.
const CAMPAIGN_IMAGES = ["hero-comfort", "banner-outdoors", "banner-linen"];
const WIDTHS = [828, 1080, 1440, 2000];

mkdirSync("public/brand/campaign", { recursive: true });

for (const name of CAMPAIGN_IMAGES) {
  const src = `public/brand/${name}.jpg`;
  const { width } = await sharp(src).metadata();
  for (const w of WIDTHS) {
    if (w > width) throw new Error(`${src} is ${width}px wide; refusing to upscale to ${w}`);
    const out = `public/brand/campaign/${name}-${w}.webp`;
    const info = await sharp(src)
      .resize({ width: w, kernel: "lanczos3" })
      // q90 with full-resolution colour: the artwork has fine coloured
      // lettering ("STYLED FOR YOU.") that 4:2:0 chroma would soften.
      .webp({ quality: 90, smartSubsample: true, effort: 6 })
      .toFile(out);
    console.log(`${out}  ${info.width}×${info.height}  ${Math.round(info.size / 1024)} KB`);
  }
}
