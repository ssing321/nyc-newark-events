import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffd400",
          color: "#11100d",
          fontFamily: "sans-serif",
          fontSize: 40,
          fontWeight: 900,
          letterSpacing: -4,
          position: "relative",
        }}
      >
        S
        <span style={{ position: "absolute", right: 5, top: 1, fontSize: 18, letterSpacing: 0 }}>↗</span>
      </div>
    ),
    size,
  );
}
