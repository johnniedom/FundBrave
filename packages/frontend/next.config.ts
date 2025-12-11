import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../../"),
  outputFileTracingIncludes: {
    "/": ["./packages/frontend/**/*"],
  },
  experimental: {},
};

export default nextConfig;
