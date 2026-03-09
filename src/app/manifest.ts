import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PotAlot — Din dyrkningslog',
    short_name: 'PotAlot',
    description: 'Hold styr på frø, planter og dyrkning. Kalender, noter, guides og AI-assistent.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8faf5',
    theme_color: '#2d5016',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
