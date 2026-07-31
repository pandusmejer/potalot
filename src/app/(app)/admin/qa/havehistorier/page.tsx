import { HavehistorieKort } from '@/components/havebog/havehistorie-kort'
import { HavehistorieArtikel } from '@/components/havebog/havehistorie-artikel'
import { HAVEHISTORIER } from '@/data/havehistorier'

export const dynamic = 'force-dynamic'

/**
 * STILPRØVE — Havehistorier (det redaktionelle "Fra haven"-lag).
 *
 * Gated QA-rute (ikke i navigation), låst til mobil af (app)-layoutets 390px-
 * ramme. Viser hvordan ÉN historie ("Skal alle lupiner dø?") ser ud både som
 * venteværelse-kort på Havebogen og som fuld artikel — før kontrakten godkendes
 * og laget wires ind i havebog-kuratoren.
 *
 * Kontrakt: Docs/product/havehistorier.md. Data: src/data/havehistorier.ts.
 */
export default function HavehistorierStilproevePage() {
  const historie = HAVEHISTORIER[0]

  return (
    <div style={{ padding: '20px 0 40px' }}>
      {/* QA-note — ærligheds-reglen: fakta ikke menneske-kontrolleret endnu */}
      {historie.reviewRequired && (
        <div
          style={{
            margin: '0 -11px 26px',
            padding: '10px 14px',
            background: '#2D2A24',
            color: '#F4F0E5',
            borderRadius: 10,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 11,
            lineHeight: 1.5,
          }}
        >
          ▶ STILPRØVE · Havehistorier · reviewRequired: true — fakta ikke fagligt
          kontrolleret endnu. Ikke live i produktflade.
        </div>
      )}

      {/* Sådan ser den ud i Havebogens venteværelse */}
      <HavehistorieKort historie={historie} href="#artikel" />

      {/* Skillelinje ned til den fulde artikel */}
      <div
        aria-hidden
        style={{ margin: '40px -11px', borderTop: '1px solid rgba(36,48,31,0.12)' }}
      />

      {/* Den fulde artikel */}
      <div id="artikel">
        <HavehistorieArtikel historie={historie} />
      </div>
    </div>
  )
}
