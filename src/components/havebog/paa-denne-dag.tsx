import type { OnThisDayEntry } from '@/data/havebog-demo'
import { laantErfaring } from '@/lib/havevisdom'
import { aktuelMaaned } from '@/lib/datetime'

const sans = 'var(--font-manrope)'
const serif = 'var(--font-cormorant), Georgia, serif'

interface Props {
  entries: OnThisDayEntry[]
}

/**
 * Kapitel 2: "På denne dag" — sæsonhukommelsen (V7, havebog.md V3).
 *
 * Kapitel-tempo: FOTO DOMINERER. Ét billede. Én historie.
 * Ikke et galleri, ikke tre billeder, ikke et grid, ikke en kortliste.
 *
 * V7 annullerer polaroid-æstetikken (kitsch-forbuddet): fotoet står
 * rent og fuldbredde som i et magasin — ingen papirramme, ingen
 * rotation, ingen tape. Historien ligger som overlay på fotoets
 * nederste kant på en mørk gradient.
 *
 * Vi vælger ÉN historie: den nyeste med billede; ellers den nyeste
 * tekst alene (fotoreglen: luft er bedre end ligegyldige billeder).
 * Tom tilstand låner fællesskabets erfaring (V6 niveau 0) over ét
 * stærkt sæsonfoto.
 */
export function PaaDenneDag({ entries }: Props) {
  const entry = entries.find(e => e.imageUrl) ?? entries[0] ?? null

  return (
    <section className="space-y-4">
      <h2
        style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: 'rgba(36,48,31,0.50)',
          margin: 0,
        }}
      >
        På denne dag
      </h2>

      {entry === null ? (
        <FotoMedHistorie
          src="/images/makro/dahlia-cafe-au-lait/hoved.jpg"
          kicker="Fra fællesskabet"
          historie={laantErfaring(aktuelMaaned()).paaDenneDag}
          sekundaer="Dine egne minder samles her, efterhånden som sæsonen skrider frem."
        />
      ) : entry.imageUrl ? (
        <FotoMedHistorie
          src={entry.imageUrl}
          kicker={entry.yearsAgo === 1 ? 'Sidste år' : `${entry.yearsAgo} år siden`}
          historie={historieTekst(entry)}
        />
      ) : (
        // Historie uden billede: stor stille tekst — fotoreglen siger
        // at vi IKKE henter et tilfældigt foto bare for at fylde.
        <blockquote style={{ margin: 0, paddingBlock: '8px 4px' }}>
          <p
            style={{
              fontFamily: sans,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(36,48,31,0.50)',
              margin: 0,
              marginBottom: 12,
            }}
          >
            {entry.yearsAgo === 1 ? 'Sidste år' : `${entry.yearsAgo} år siden`}
          </p>
          <p
            style={{
              fontFamily: serif,
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(21px, 4.4vw, 28px)',
              lineHeight: 1.3,
              color: 'rgba(36,48,31,0.80)',
              margin: 0,
              maxWidth: '26ch',
            }}
          >
            {historieTekst(entry)}
          </p>
        </blockquote>
      )}
    </section>
  )
}

function historieTekst(entry: OnThisDayEntry): string {
  if (entry.text) return entry.text
  return entry.variety ? `${entry.plantName} ${entry.variety}` : entry.plantName
}

/**
 * Det ene billede med den ene historie. Fuldbredde, ren kant,
 * tekst-overlay nederst på en mørk gradient — magasin, ikke scrapbog.
 */
function FotoMedHistorie({
  src,
  kicker,
  historie,
  sekundaer,
}: {
  src: string
  kicker: string
  historie: string
  sekundaer?: string
}) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        marginInline: -16,
        aspectRatio: '5 / 6',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'saturate(0.94)',
        }}
      />
      {/* Læsbarheds-gradient — kun nederst hvor historien ligger */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(12,18,8,0) 38%, rgba(12,18,8,0.18) 62%, rgba(12,18,8,0.62) 100%)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 z-10"
        style={{ padding: '0 24px 24px' }}
      >
        <p
          style={{
            fontFamily: sans,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(244,239,220,0.78)',
            margin: 0,
            marginBottom: 8,
          }}
        >
          {kicker}
        </p>
        <p
          style={{
            fontFamily: serif,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(19px, 3.9vw, 26px)',
            lineHeight: 1.3,
            color: 'rgba(244,239,220,0.96)',
            textShadow: '0 1px 14px rgba(12,18,8,0.45)',
            margin: 0,
            maxWidth: '28ch',
          }}
        >
          {historie}
        </p>
        {sekundaer && (
          <p
            style={{
              fontFamily: serif,
              fontWeight: 400,
              fontSize: 'clamp(14px, 2.7vw, 16px)',
              lineHeight: 1.45,
              color: 'rgba(244,239,220,0.72)',
              textShadow: '0 1px 12px rgba(12,18,8,0.45)',
              margin: 0,
              marginTop: 10,
              maxWidth: '34ch',
            }}
          >
            {sekundaer}
          </p>
        )}
      </div>
    </div>
  )
}
