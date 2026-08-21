import type { NextConfig } from "next";

const API_BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8085";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_BACKEND}/api/v1/:path*`,
      },
      {
        source: "/health/:path*",
        destination: `${API_BACKEND}/health/:path*`,
      },
      {
        source: "/metrics",
        destination: `${API_BACKEND}/metrics`,
      },
    ];
  },
};

export default nextConfig;
