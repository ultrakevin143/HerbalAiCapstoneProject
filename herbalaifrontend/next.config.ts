import type { NextConfig } from "next";

const useConstrainedBuild = process.env.NEXT_CONSTRAINED_BUILD === "1";

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }];
  },
  async rewrites() {
    const backendApi = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
    return [{ source: '/api/:path*', destination: `${backendApi}/:path*` }];
  },
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
