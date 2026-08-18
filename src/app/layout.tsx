import type { Metadata, Viewport } from 'next'
import { Inter, Cormorant_Garamond, Manrope, Gabarito, IBM_Plex_Sans_Condensed, IBM_Plex_Mono, Libre_Baskerville } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

// Cormorant Garamond — hero-månedsnavn (normal 600), kursiv 600 til
// det organiske inventar-skilt på frøkort, og weight 400/500 til
// editoriale headlines som "Juni nærmer sig"-card'et (anticipations-
// lag) hvor en mere delikat serif giver magasin-følelse.
const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

// Manrope — hero-sans (kicker, undertitel, brødtekst, tags).
const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

// Gabarito — display-sans til Planter (plantekort-overskrifter): venlig, rund
// grotesk der signalerer pleje/handling (design-DNA: Planter = Gabarito + Manrope).
const gabarito = Gabarito({
  variable: '--font-gabarito',
  subsets: ['latin'],
  // Font-audit 5/8: kun 500 (plantekort-navne) og 800 (dagens fokus) bruges
  // reelt — de øvrige vægte kostede filer/preloads uden at blive renderet.
  weight: ['500', '800'],
})

// IBM Plex Sans Condensed + Mono — KUN Guides-fanen i kalenderen: giver
// guiderne et "botanisk opslagsværk / feltguide"-sprog, adskilt fra
// Frøbank/Sæsonråd. Condensed til guide-titler, Mono til små meta-labels.
const plexCondensed = IBM_Plex_Sans_Condensed({
  variable: '--font-plex-condensed',
  subsets: ['latin'],
  // 300 bruges af tynde guide-linjer (Lær af hinanden-intro); 200 blev
  // aldrig taget i brug og er fjernet igen (font-audit 5/8).
  weight: ['300', '500', '600', '700'],
})

const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['500'],
})

// Libre Baskerville — TEST-alternativ til den store månedslabel i ticket-
// headeren (mere klassisk/trykt bog-serif). Kun bold (700).
const libreBaskerville = Libre_Baskerville({
  variable: '--font-libre-baskerville',
  subsets: ['latin'],
  weight: ['700'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://potalot.app'),
  title: 'Potalot',
  description: 'Din dyrkningsapp. Hold styr på frøbank, aktive planter og havekalender.',
  manifest: '/manifest.json',
  // Brand-ikoner fra POTALOT-BRAND (logo-standard ANNA-LÅST 13/8 —
  // ét-blads-ikonet, kun tokens #24301F/#F7F8EF).
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Potalot',
    description: 'Din dyrkningsapp. Hold styr på frøbank, aktive planter og havekalender.',
    url: 'https://potalot.app',
    siteName: 'Potalot',
    locale: 'da_DK',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Potalot' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Potalot',
    description: 'Din dyrkningsapp. Hold styr på frøbank, aktive planter og havekalender.',
    images: ['/og-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Potalot',
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
      <body className={`${inter.variable} ${cormorant.variable} ${manrope.variable} ${gabarito.variable} ${plexCondensed.variable} ${plexMono.variable} ${libreBaskerville.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
