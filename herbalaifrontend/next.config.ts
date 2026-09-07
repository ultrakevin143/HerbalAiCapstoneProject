import type { NextConfig } from "next";

const useConstrainedBuild = process.env.NEXT_CONSTRAINED_BUILD === "1";

const nextConfig: NextConfig = {
  experimental: useConstrainedBuild
    ? { cpus: 1, workerThreads: true }
    : undefined,
  // Constrained builds run `tsc --noEmit` separately before Next.js so the
  // framework does not need to spawn a second TypeScript process.
  typescript: {
    ignoreBuildErrors: useConstrainedBuild,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
