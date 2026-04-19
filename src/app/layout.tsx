import type { Metadata, Viewport } from 'next'
import { Inter, Cormorant_Garamond, Geist_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'PotAlot — Din dyrkningslog',
  description: 'Hold styr på frø, planter og dyrkning. Rolig motor der følger dine planter gennem hele livscyklussen.',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body className={`${inter.variable} ${cormorant.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}

import { ServiceWorkerRegister } from '@/components/layout/sw-register'
