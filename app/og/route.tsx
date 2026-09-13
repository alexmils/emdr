import { ImageResponse } from "next/og";
import { BRAND_SPOKEN } from "@/lib/brand";

export const runtime = "edge";

const WIDTH = 1200;
const HEIGHT = 630;

/** Dynamic 1200×630 social card — title + optional kicker. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") || BRAND_SPOKEN).slice(0, 120);
  const kicker = (searchParams.get("kicker") || "").slice(0, 48);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          background: "linear-gradient(145deg, #EDF9ED 0%, #A4EDA5 45%, #84B067 100%)",
          color: "#2A3020",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {kicker ? (
            <div
              style={{
                fontSize: 28,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#3D4129",
                opacity: 0.85,
              }}
            >
              {kicker}
            </div>
          ) : null}
          <div
            style={{
              fontSize: title.length > 60 ? 52 : 64,
              lineHeight: 1.15,
              fontWeight: 600,
              maxWidth: 980,
            }}
          >
            {title}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 32,
            fontWeight: 600,
            color: "#2A3020",
          }}
        >
          <span>{BRAND_SPOKEN}</span>
          <span style={{ fontSize: 24, fontWeight: 400, opacity: 0.8 }}>
            nurahelp.com
          </span>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT }
  );
}
