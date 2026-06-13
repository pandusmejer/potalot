import { GuideHeroEditorial } from './guide-hero-editorial'

export function GuideHeroEditorialDemo() {
  return (
    <div className="space-y-12 overflow-x-clip" style={{ background: '#EAE6D8' }}>
      <GuideHeroEditorial
        badge="Potalot-guide"
        category="Frø"
        title="Tomat"
        subtitle="San Marzano"
        latinName="Solanum lycopersicum"
        tag="Ranketomat"
        imageSrc="/images/plantekort/tomat-san-marzano.jpg"
        imageAlt="San Marzano tomater på planten"
        imageShape="tall-left"
        imageObjectPosition="42% 48%"
        imageScale={1.05}
        description="Klassisk italiensk pastatomat med fast frugtkød og lavt vandindhold. Perfekt til sauce, konservering og lagring."
      />

      <GuideHeroEditorial
        badge="Potalot-guide"
        category="Knold"
        title="Dahlia"
        subtitle="Café au Lait"
        latinName="Dahlia 'Café au Lait'"
        tag="Skærehave"
        imageSrc="/images/plantekort/dahlia-cafe-au-lait.jpg"
        imageAlt="Dahlia Café au Lait blomst"
        imageShape="organic-center"
        imageObjectPosition="50% 48%"
        imageScale={1.08}
        description="Storblomstret dahlia i bløde creme, rosa og ferskenfarvede toner. God som rolig hovedblomst i buketter."
      />

      <GuideHeroEditorial
        badge="Potalot-guide"
        category="Løg"
        title="Hvidløg"
        latinName="Allium sativum"
        tag="Efterårsplantning"
        imageSrc="/images/placeholder/hvidloeg-wide-bottom.jpg"
        imageAlt="Placeholder for hvidløgsbed"
        imageShape="wide-bottom"
        imageObjectPosition="50% 58%"
        description="Hvidløg plantes, når jorden bliver kølig, og bruger vinteren på at sætte stærke rødder før forårets vækst."
      />

      <GuideHeroEditorial
        badge="Potalot-guide"
        category="Frø"
        title="Agurk"
        subtitle="Marketmore"
        latinName="Cucumis sativus"
        tag="Friland"
        imageSrc="/images/plantekort/agurk-marketmore.png"
        imageAlt="Agurk Marketmore plante"
        imageShape="organic-left"
        imageObjectPosition="44% 50%"
        imageScale={1.03}
        description="Robust frilandsagurk med frisk smag. Trives bedst med lun jord, læ og jævn fugt gennem sommeren."
      />
    </div>
  )
}
