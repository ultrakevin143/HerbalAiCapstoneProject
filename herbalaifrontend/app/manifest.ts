import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Herbal-Ai — Philippine Medicinal Plant Repository',
    short_name: 'Herbal-Ai',
    description: 'Educational, source-grounded information about Philippine medicinal plants.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f7f3e8',
    theme_color: '#1b4332',
    orientation: 'portrait-primary',
    categories: ['education', 'health', 'reference'],
    icons: [
      {
        src: '/pwa-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
