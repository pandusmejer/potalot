import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { KONTAKT_EMAIL, ANSVARLIG, SIDST_OPDATERET } from '@/lib/contact'

export const metadata = { title: 'Privatliv og data — Potalot' }

/**
 * Offentlig privatlivs- og AI-side. Kort, forståelig, ærlig — ingen juridisk
 * tåge. Beskriver hvad appen FAKTISK gør med data (verificeret mod koden).
 * Kan læses uden login (ikke i (app)-gruppen, ikke beskyttet i proxy.ts).
 */
export default function PrivatlivPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-2xl px-5 py-10">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground no-underline mb-8">
          <ArrowLeft className="h-4 w-4" /> Til Potalot
        </Link>

        <h1 className="text-3xl font-serif text-foreground mb-2">Privatliv og data</h1>
        <p className="text-sm text-muted-foreground mb-8">Sidst opdateret {SIDST_OPDATERET}</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-foreground">
          <p>
            Potalot er en have-app. Vi gemmer det, du selv lægger ind, så din have
            kan huskes fra sæson til sæson — og vi holder det så enkelt og privat
            som muligt. Herunder står præcis hvilke data vi gemmer, hvad de bruges
            til, og hvordan du får dem slettet.
          </p>

          <Section title="Hvilke oplysninger gemmer vi?">
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Konto:</strong> din e-mail, dit brugernavn og et evt. profilbillede.</li>
              <li><strong>Din have:</strong> de planter, frø, opgaver, noter og observationer, du selv tilføjer.</li>
              <li><strong>Fotos:</strong> billeder du uploader — af frøposer, planter eller håndskrevne noter.</li>
              <li><strong>Stemmenoter:</strong> lydoptagelser, hvis du bruger &quot;tryk og tal&quot;.</li>
              <li><strong>Placering:</strong> hvis du vælger det, gemmer vi et postnummer eller grove koordinater — <strong>aldrig din præcise adresse</strong>. Det bruges kun til lokalt vejr og frostvarsler.</li>
            </ul>
          </Section>

          <Section title="Hvad bruger vi dem til?">
            <p>
              Udelukkende til at drive appen for dig: at huske din have, vise vejr
              og frostvarsler for dit område, og foreslå relevante opgaver og guides.
              Vi <strong>sælger ikke</strong> dine data og bruger dem ikke til reklamer.
            </p>
          </Section>

          <Section title="Kunstig intelligens (AI)">
            <p>
              Nogle funktioner bruger AI til at læse dit indhold: når du scanner en
              frøpose, tilføjer et foto af noter, skriver frit om haven eller optager
              en stemmenote, sendes det pågældende indhold til vores AI-leverandør
              (Anthropic) for at udtrække oplysninger — fx plantens navn eller sort.
            </p>
            <p className="mt-3">
              AI kan tage fejl. Derfor <strong>foreslår</strong> Potalot altid, og
              <strong> du godkender selv</strong>, før noget gemmes. Intet oprettes
              automatisk ud fra et gæt.
            </p>
          </Section>

          <Section title="Dine rettigheder">
            <p>
              Det er dine data. Du kan når som helst se og rette dem i appen, og du
              kan <strong>slette hele din konto og alle tilhørende data</strong> under
              Indstillinger → Slet konto. Sletningen er permanent og fjerner dine
              planter, frø, noter, fotos og stemmenoter.
            </p>
          </Section>

          <Section title="Hvor ligger dine data?">
            <p>
              Dine data hostes hos vores underleverandører Supabase (database og
              fillager) og Netlify (hosting). Adgang er beskyttet, og hver bruger
              kan kun se sine egne data.
            </p>
          </Section>

          <Section title="Kontakt">
            <p>
              Potalot drives af {ANSVARLIG}. Har du spørgsmål om dine data — eller
              vil du have noget rettet eller slettet — så skriv til os på{' '}
              <a href={`mailto:${KONTAKT_EMAIL}`} className="text-primary underline">{KONTAKT_EMAIL}</a>.
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-serif text-foreground mb-2">{title}</h2>
      {children}
    </section>
  )
}
