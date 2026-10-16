import type { NextConfig } from "next";

const useConstrainedBuild = process.env.NEXT_CONSTRAINED_BUILD === "1";

const isDevelopment = process.env.NODE_ENV === 'development';
const connectionSources = new Set(["'self'"]);
for (const endpoint of [process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api', process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000']) {
  if (endpoint.startsWith('/')) continue;
  const url = new URL(endpoint);
  const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.username || url.password || !['http:', 'https:'].includes(url.protocol) || (!isDevelopment && url.protocol === 'http:' && !isLoopback)) {
    throw new Error('API and socket endpoints must use HTTPS outside local development.');
  }
  connectionSources.add(url.origin);
  connectionSources.add(`${url.protocol === 'https:' ? 'wss:' : 'ws:'}//${url.host}`);
}
if (isDevelopment) {
  connectionSources.add('ws://localhost:*');
  connectionSources.add('ws://127.0.0.1:*');
}

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  `connect-src ${Array.from(connectionSources).join(' ')}`,
  "worker-src 'self' blob:",
  "frame-src 'none'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

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
        { key: 'Content-Security-Policy', value: contentSecurityPolicy },
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
