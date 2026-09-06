import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  cacheLife: {
    blog: { stale: 30, revalidate: 300, expire: 3600 },
  },
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
};
export default nextConfig;
