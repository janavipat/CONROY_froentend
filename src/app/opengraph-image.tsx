import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Dynamically generated Open Graph / social-share image. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f1ea",
          color: "#1a1917",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ fontSize: 120, letterSpacing: 24, fontWeight: 600 }}>{SITE.name}</div>
        <div
          style={{
            marginTop: 16,
            fontSize: 40,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#6b6358",
          }}
        >
          {SITE.tagline}
        </div>
        <div style={{ marginTop: 40, width: 120, height: 2, background: "#1a1917" }} />
      </div>
    ),
    size,
  );
}
