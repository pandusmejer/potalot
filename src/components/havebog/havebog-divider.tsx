import { Sprout } from 'lucide-react'

/**
 * Havebog-ornament — en enkel havebogs-vignet mellem opslag (fx efter
 * Dagens historie, før Tal til din have). Tynd streg med et lille
 * spire-ikon i midten, hvor cremen bryder linjen rent.
 *
 * IKKE en card-separator og IKKE vintage-invitation — bare et roligt
 * lille ornament, som en vignet i en bog.
 */
export function HavebogDivider() {
  return (
    <div
      aria-hidden
      style={{
        marginTop: 'clamp(56px, 15vw, 72px)',
        marginBottom: 'clamp(56px, 15vw, 72px)',
        // Samme side-akse som teksten (main px-4 = 16 + samme paddingInline).
        paddingInline: 'clamp(12px, 3.5vw, 16px)',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Hårfin linje på tværs */}
        <span
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            height: 1,
            background: '#D7D1B8',
          }}
        />
        {/* Spire-ikon — cremen bag bryder linjen rent */}
        <span
          style={{
            position: 'relative',
            display: 'inline-flex',
            padding: '0 12px',
            background: 'var(--background)',
            color: '#7C8560',
          }}
        >
          <Sprout style={{ width: 22, height: 22 }} strokeWidth={1.5} />
        </span>
      </div>
    </div>
  )
}
