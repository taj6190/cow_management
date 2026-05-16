import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GoruFarm - Farm Management',
    short_name: 'GoruFarm',
    description: 'Complete cow farm management system. Track cows, expenses, income, and generate reports.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#15803d',
    orientation: 'portrait',
    icons: [
      {
        src: '/api/icon/192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/api/icon/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/api/icon/192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
