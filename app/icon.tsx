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
          borderRadius: 16,
          background: "#102a2c",
          color: "#dfff64",
          fontFamily: "sans-serif",
          fontSize: 26,
          fontWeight: 900,
          letterSpacing: -2,
        }}
      >
        N+
      </div>
    ),
    size,
  );
}
