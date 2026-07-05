# Guide-moduler — billede + farveblok + tekst (Potalot-stil)

**Formål:** en mere komponeret, mindre lineær guideoplevelse, hvor billeder,
tekst og farvefelter arbejder sammen som ét modulært system. Editorialt, roligt,
botanisk, mobil-først — IKKE moodboard eller fashion-grid.

**Låst præmis:**
- Eksisterende tekstskabeloner og guideflow bevares. Vi ændrer VISNING og
  modulopbygning, ikke indholdsstruktur.
- Farver udledes af planten/fotoet.
- Ingen heavy fades, hårde gradients eller overdesign.

Fire modultyper + farvesystem + typografisk rollefordeling. Prioritet nederst.

---

## 1. Overlay Hero

**Formål:** toppen af guiden mere clean og samlet — hero-billedet bærer både
sanselighed og hurtig forståelse.

**Struktur**
- Over foto: badge-linje · titel · art · latin
- På foto, nederst: 1 kort sort-/arts-dom + 2–3 kompakte chips

**Stil:** foto tydeligt/sanseligt/botanisk, ingen fade. Overlay = blød lys
bundflade (varm creme/ivory, høj transparens), ikke en hård indre kortboks.

**Mobil:** hero ~300–340px; overlay nederst; chips i 1–2 linjer, max 3.

**Designregel:** *Titel identificerer. Foto sanseliggør. Overlay forklarer.*

> ⚠️ **ÅBEN BESLUTNING (Potalot-test 5/7):** vi implementerede bund-overlayet og
> forkastede det — selv en blød creme-bundflade sløvede makroens tekstur. Den
> nuværende hero er den KALME fortolkning: **rent foto → tonet summary-strip
> UNDER fotoet** (leverer "foto sanseliggør, tonet felt forklarer" uden fade på
> makroen). Indtil andet besluttes er dét Potalots Overlay-Hero. Overlay-grebet
> gemmes til steder UDEN fin makro-tekstur (fx featured-kort på forsiden).

---

## 2. Editorial Split

**Formål:** tekst og makrobilleder forklarer planten SAMMEN — ikke store
separate billedsektioner.

**Bruges til:** Om sorten · Sortsspecifikke detaljer · Smag og anvendelse · Det
skal du være opmærksom på.

**Struktur:** tekstblok + billede i samme modul. Mobil = én kolonne, billedet
tæt på det relevante afsnit. Større skærm = lokal side-om-side (ALDRIG to-kolonne
sidearkitektur).

**Varianter**
- A. Text + image — tekst først, lille/mellem makro under/ved siden af
- B. Image + side-note — makro på den ene side, kort note på den anden
- C. Mini evidence strip — 2 små billeder i række, kun hvis det sparer scroll

**Stil:** rene billeder (ingen fade), blød radius, diskret border, små/tætte,
skal forklare noget konkret.

**Designregel:** *Fotoet er bevis, ikke pause.*

Status: delvist bygget — `GuideEvidenceImage` (inline-bevis) + `GuideNote`
(note med billede) er variant A/B. C mangler.

---

## 3. Tinted Note Block

**Formål:** samle note-familien i ét roligt system, hvor tekst og evt. billede
lever sammen.

**Bruges til:** Vidste du? · Potalot-tip · små faktanoter · evt. featured erfaring.

**Struktur:** label/eyebrow · kort tekst · evt. lille makro integreret.

**Stil:** baggrund i blød, plante-udledt tone (tomat = støvet terracotta/fersken;
blad = salvie/oliven; blomst = blød creme/koral). Tekst på lys bund, høj
læsbarhed. Ingen tunge effekter, ingen mange underkomponenter.

**Note-familie — én familie, to niveauer:**
- Vidste du? — rolig faktuel note
- Potalot-tip — praktisk råd
- Potalot-note — lidt mere autoritet, men samme familie-logik

**Designregel:** *Én familie, to niveauer. Ikke tre fremmede bokse.*

Status: delvist — `GuideNote` (Vidste du?/Potalot-tip) samlet; hero-summary-strip
bruger allerede plante-tone (#F3E6DD). Potalot-note skal afstemmes ind i familien.

---

## 4. Experience Strip ("Lær af hinanden")

**Formål:** rolige dyrker-erfaringer som erfaringslag — ikke socialt feed.

**Struktur:** eyebrow "LÆR AF HINANDEN" · titel · kort intro · horisontal
kort-strip · diskret BETA-badge · bundnote om variation.

**Kortindhold:** type-label (DYRKNINGSLOG/OBSERVATION/ERFARING) · periode/sæson ·
titel · forhold-header ("Drivhus · Jord: Muldjord") · kort uddrag · Sprout + "N
havde gavn" · CTA "Gem i min log".

**Typografi:** HELE modulet i Manrope (aldrig Cormorant) — praktiske feltnoter.

**Mobil:** vis 1 hovedkort, antyd næste, horisontal scroll, "Se flere (N)".

**Stil:** rolige creme-kort, diskret border, ingen feed-følelse, ingen avatar/
social-støj, BETA lille og rolig.

**Designregel:** *Erfaring, ikke autoritet. Samling, ikke feed.*

Status: ✅ bygget (`LaerAfHinanden`, b2fe1e6).

---

## Farvesystem

Tonede baggrunde/farveblokke UDLEDES af planten/fotoet — vælges aldrig vilkårligt.

**Princip:** tag motivets midtones → gør dem lysere og mindre mættede → brug som
modulbaggrund eller accent. De mættede kilde-hex (fra reference-paletten) er
ACCENT, ikke bg; bg er en ultra-lys udledning ("anes mere end ses").

| Motiv | Accent (kilde) | Lys blok-bg | Border |
|---|---|---|---|
| Tomat/frugt-varme | Coral #FBAD86 | #F3E6DD | #DCCABD |
| Blade/stængel | True Green #076C44 | ~#E7ECE0 | ~#CFD8C4 |
| Blomst | Apricot #F7D0A5 | ~#F5ECDC | ~#E2D3BC |
| Løg/rodfrugt | sand/hør | ~#EFE9DC | ~#DBD0BC |

**Ikke tilladt:** neon · skarpe modefarver · høj-kontrast brandingblokke · sorte
hårde paneler.

---

## Typografisk rollefordeling (låst)

- **Cormorant** = guidekapitler, titel, redaktionel autoritet
- **Plex Condensed** = guidekort, navigation, labels
- **Manrope** = brugerindhold, metadata, erfaringer, praktiske UI-tekster

---

## Hårde regler

**Ja til:** tekst+billede som samme modul · farvefelter udledt af planten · bløde
overlays · kompakte billedbeviser · lokale split-layouts · mobil-først · færre
komponenttyper.

**Nej til:** heavy fades over makrobilleder · store separate billedpauser · mange
små frie chips/tekstblokke før hero · direkte kopi af moodboard/fashion-look ·
feed/social-stemning · to-kolonne sidearkitektur som primær løsning.

---

## Implementeringsprioritet

1. Overlay Hero *(se åben beslutning — reelt allerede løst via rent foto + tonet strip)*
2. Editorial Split
3. Tinted Note Block
4. Experience Strip *(✅ bygget)*
