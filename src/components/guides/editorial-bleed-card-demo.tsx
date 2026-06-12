import { EditorialBleedCard } from './editorial-bleed-card'

export function EditorialBleedCardDemo() {
  return (
    <div className="space-y-8 overflow-x-clip py-8" style={{ background: '#EAE6D8' }}>
      <EditorialBleedCard
        eyebrow="Guidetype"
        title="Planteguide"
        description="Primært tekst med makrodetaljer, der bryder layoutet."
        ctaLabel="Vidensdybde"
        imageSrc="/images/plantekort/tomat-san-marzano.jpg"
        imageAlt="San Marzano tomater på planten"
        variant="left"
        objectPosition="34% 48%"
        imageScale={1.08}
      />

      <EditorialBleedCard
        eyebrow="Sortsvalg"
        title="Tættere på sorten"
        description="Makrofotoet ligger som materiale bag teksten, ikke som et separat billede."
        ctaLabel="Se sorten"
        imageSrc="/images/makro/agurk/blad.jpg"
        imageAlt="Makro af agurkblad"
        variant="right"
        objectPosition="58% 50%"
        imageScale={1.16}
      />

      <EditorialBleedCard
        eyebrow="Sanselig note"
        title="Når billedet bliver overgang"
        description="Teksten lander i fade-zonen, så billedet og næste afsnit opleves som samme rytme."
        imageSrc="/images/plantekort/dahlia-cafe-au-lait.jpg"
        imageAlt="Dahlia Café au Lait kronblade"
        variant="band"
        objectPosition="50% 45%"
        imageScale={1.1}
      />
    </div>
  )
}
