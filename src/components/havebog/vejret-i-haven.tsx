import type { VejrData } from '@/data/havebog-demo'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  vejr: VejrData
}

/**
 * RUM 12 (V1.0-prototype) · Vejret i haven.
 *
 * Kontekst — det vejr haven står i lige nu, oversat til hvad det
 * betyder for dyrkeren ("Perfekt vejr til udplantning"), ikke en
 * meteorologisk tabel.
 *
 * ⚠️ KRÆVER VEJR-KILDE. Temperatur/forhold er demo. Må ikke vise
 * opfundne tal til rigtige brugere — lever indtil videre kun som
 * prototype i demo, til en vejr-integration (lokation + API) lander.
 */
export function VejretIHaven({ vejr }: Props) {
  return (
    <section>
      <p
        className="uppercase"
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.26em',
          color: 'rgba(36,48,31,0.5)',
          margin: 0,
          marginBottom: 14,
        }}
      >
        Vejret i haven
      </p>

      <p
        style={{
          fontFamily: sans,
          fontWeight: 700,
          fontSize: 'clamp(48px, 14vw, 76px)',
          lineHeight: 0.95,
          letterSpacing: '-0.02em',
          color: '#24301F',
          margin: 0,
        }}
      >
        {vejr.grader}
      </p>
      <p
        style={{
          fontFamily: sans,
          fontSize: 14,
          fontWeight: 600,
          color: 'rgba(36,48,31,0.55)',
          margin: 0,
          marginTop: 8,
        }}
      >
        {vejr.forhold}
      </p>
      <p
        style={{
          fontFamily: serif,
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 'clamp(19px, 4.4vw, 25px)',
          lineHeight: 1.3,
          color: 'rgba(36,48,31,0.72)',
          margin: 0,
          marginTop: 16,
          maxWidth: '22ch',
        }}
      >
        {vejr.note}
      </p>
    </section>
  )
}
