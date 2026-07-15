'use client'

import { useEffect } from 'react'

/**
 * Sidste sikkerhedsnet — fanger fejl i selve rod-layoutet, hvor app-CSS ikke
 * nødvendigvis er indlæst. Derfor rene inline-styles og eget <html>/<body>.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[potalot] kritisk fejl (rod-layout):', error)
  }, [error])

  return (
    <html lang="da">
      <body style={{ margin: 0, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F1DF', fontFamily: 'system-ui, sans-serif', color: '#24301F' }}>
        <div style={{ maxWidth: 360, padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 10px' }}>Noget gik galt</h1>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: '#5F6658', margin: '0 0 18px' }}>
            Der opstod en uventet fejl. Prøv at genindlæse siden.
          </p>
          <button
            onClick={reset}
            style={{ background: '#4F6F35', color: '#fff', border: 'none', borderRadius: 12, padding: '11px 20px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
          >
            Prøv igen
          </button>
        </div>
      </body>
    </html>
  )
}
