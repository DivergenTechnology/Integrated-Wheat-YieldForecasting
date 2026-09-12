import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Pin the tracing/workspace root to the project directory itself.
  // Without this, Next infers the workspace root from ancestor lockfiles:
  // when the project is deployed under a parent that has a lockfile, the
  // standalone output gets nested (.next/standalone/<app>/server.js) and
  // the start script's .next/standalone/server.js path breaks.
  outputFileTracingRoot: process.cwd(),
  turbopack: {
    root: process.cwd(),
  },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
