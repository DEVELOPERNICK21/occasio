import type { NextConfig } from "next";
import path from "path";

/**
 * This app lives in a React Native repo. Next infers the workspace root as the
 * parent folder (the RN lockfile), which breaks Turbopack's Google-font loader
 * on Vercel: `Can't resolve '@vercel/turbopack-next/internal/font/google/font'`.
 * Pin both roots to this package so they stay in sync.
 */
const appDir = path.join(__dirname);

const nextConfig: NextConfig = {
  outputFileTracingRoot: appDir,
  turbopack: {
    root: appDir,
  },
};

export default nextConfig;
