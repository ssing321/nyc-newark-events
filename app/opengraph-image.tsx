import { ImageResponse } from "next/og";

export const alt = "SCENE — Find your next move in NYC and North Jersey.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f3efe5",
          color: "#11100d",
          padding: "56px 64px",
          fontFamily: "sans-serif",
          border: "20px solid #11100d",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800, letterSpacing: 2 }}>NYC / NORTH JERSEY</div>
          <div style={{ display: "flex", width: 82, height: 82, background: "#ffd400", alignItems: "center", justifyContent: "center", fontSize: 54, fontWeight: 900 }}>S↗</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 182, lineHeight: 0.8, fontWeight: 900, letterSpacing: -10 }}>SCENE</div>
          <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 34 }}>
            <div style={{ display: "flex", width: 150, height: 16, background: "#ffd400" }} />
            <div style={{ display: "flex", fontSize: 46, fontWeight: 800, letterSpacing: 2 }}>FIND YOUR NEXT MOVE.</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
