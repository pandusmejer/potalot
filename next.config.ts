import type { NextConfig } from "next"
import path from "path"

// Brugerens uploadede fotos ligger i Supabase Storage. De sendes gennem
// /_next/image (på Netlify: Netlify Image CDN) som små thumbnails — se
// src/lib/images/thumb.ts. Kun dette projekts offentlige storage-sti tillades.
const supabaseHost = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname } catch { return null }
})()

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }]
      : [],
  },
  // Env-styret distDir så en isoleret preview-server kan køre parallelt med en
  // anden `next dev` uden at kæmpe om .next/dev/lock. Default = .next (upåvirket).
  distDir: process.env.POTALOT_DIST_DIR ?? ".next",
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    // Router-cache: genbesøg af en fane/side inden for vinduet rendrer fra
    // klient-cachen i stedet for en ny server-render (Next 15+ default er 0 —
    // dvs. HVERT tab-tryk kostede en fuld dynamisk render). Server actions
    // invaliderer stadig via revalidatePath, så mutationer slår igennem.
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
  },
}

export default nextConfig
