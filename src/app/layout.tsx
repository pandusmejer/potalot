import type { Metadata, Viewport } from 'next'
import { Inter, DM_Serif_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const dmSerif = DM_Serif_Display({
  variable: '--font-dm-serif',
  subsets: ['latin'],
  weight: '400',
})

export const metadata: Metadata = {
  title: 'PotAlot',
  description: 'Din dyrkningsapp. Hold styr på frøbank, aktive planter og havekalender.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PotAlot',
  },
}

export const viewport: Viewport = {
  themeColor: '#2C4A3A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

/**
 * Sæson-slug ud fra aktuel måned. Bruges som data-attribut på <html>
 * så hele UI'ets tone skifter subtilt gennem året (se globals.css).
 */
function aktuelSaesonSlug(): 'vinter' | 'foraar' | 'sommer' | 'efteraar' {
  const m = new Date().getMonth() + 1
  if (m === 12 || m <= 2) return 'vinter'
  if (m <= 5) return 'foraar'
  if (m <= 8) return 'sommer'
  return 'efteraar'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da" data-season={aktuelSaesonSlug()}>
      <body className={`${inter.variable} ${dmSerif.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
