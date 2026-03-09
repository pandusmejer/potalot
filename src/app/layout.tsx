import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'PotAlot — Din dyrkningslog',
  description: 'Hold styr på frø, planter og dyrkning. Kalender, noter, guides og AI-assistent.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PotAlot',
  },
}

export const viewport: Viewport = {
  themeColor: '#2d5016',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}

import { ServiceWorkerRegister } from '@/components/layout/sw-register'
