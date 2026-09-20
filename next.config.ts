import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s1.ticketm.net",
        pathname: "/dam/**",
      },
      {
        protocol: "https",
        hostname: "s1.ticketmaster.com",
        pathname: "/dam/**",
      },
    ],
  },
};

export default nextConfig;
