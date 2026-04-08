import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  poweredByHeader: false,
  swcMinify: true,
  compress: true,
  productionBrowserSourceMaps: false,
  webpack: (config) => {
    config.cache = {
      type: 'filesystem',
      compression: 'gzip',
    };
    return config;
  },
  async headers() {
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://recipeai-backend.onrender.com' 
      : 'http://localhost:8000';

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value:
              `default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https: ${backendUrl}; font-src 'self' data:; frame-ancestors 'none';`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;