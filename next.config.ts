import type { NextConfig } from "next"
import path from "path"

const nextConfig: NextConfig = {
  // Env-styret distDir så en isoleret preview-server kan køre parallelt med en
  // anden `next dev` uden at kæmpe om .next/dev/lock. Default = .next (upåvirket).
  distDir: process.env.POTALOT_DIST_DIR ?? ".next",
  turbopack: {
    root: path.resolve(__dirname),
  },
}

export default nextConfig
