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

## 1. Hero Summary Strip (IKKE overlay hero)

**Formål:** toppen af guiden clean og samlet — rent hero-foto bærer
sanseligheden, en kompakt tonet strip UNDER fotoet bærer den hurtige forståelse.

**AFVIST:** overlay hero med tekst/chips PÅ fotoet. Testet 5/7 og forkastet —
selv en blød creme-bundflade sløvede makroens tekstur. Hero-foto skal være rent.

**Struktur**
- Over foto: badge-linje · titel · art · latin (Cormorant i ro på beige)
- Rent foto: ingen tekst, chips, fade, frosted panel eller blur
- UNDER foto: kompakt summary-strip — plante-tonet bg, diskret border, lav højde,
  grupperet tæt (~8px) med fotoet så den læses som caption

**Mobil:** hero ~clamp(260px, 72vw, 330px); strip lige under.

**Designregel:** *Titel identificerer. Foto sanseliggør. Strip forklarer — under, ikke ovenpå.*

Status: ✅ bygget (rent foto + terracotta-strip, 10233d4 + 2513671).

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

**Princip:** tag motivets midtones → gør dem lysere og **15–25% mindre mættede**
→ brug som modulbaggrund eller accent. Farverne skal føles som en atmosfærisk
forlængelse af billedet, ikke som brandingblokke. De mættede kilde-hex (fra
reference-paletten) er ACCENT, ikke bg; bg er en ultra-lys udledning ("anes mere
end ses").

**Tone-retning pr. motiv:**
- Tomat/frugt: støvet terracotta · fersken · varm creme
- Blade/grønne planter: salvie · oliven · botanisk grøn
- Blomster: creme · lys abrikos · dæmpet rosa/koral
- Rod/løg/jord: sand · hør · støvet jordtone

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

## Hvor systemet må bruges

**Bruges gerne på:** Vidste du? · Potalot-tip · små editorial noter · Lær af
hinanden · lokale tekst+billede-moduler · udvalgte guideforside-kort (senere).

**Bruges forsigtigt eller ikke på:** Hurtigt overblik · relation til artsguide ·
kalenderforløb · nøgterne datafelter · systembeskeder. Disse skal forblive
nøgterne og læsbare — ellers taber siden troværdighed og scanbarhed.

---

## Hårde regler

**Ja til:** tekst+billede som samme modul · farvefelter udledt af planten · bløde
overlays · kompakte billedbeviser · lokale split-layouts · mobil-først · færre
komponenttyper.

**Nej til:** heavy fades over makrobilleder · store separate billedpauser · mange
små frie chips/tekstblokke før hero · direkte kopi af moodboard/fashion-look ·
feed/social-stemning · to-kolonne sidearkitektur som primær løsning.

---

## Implementeringsrækkefølge (efter spec)

Skriv spec først (dette dok), lav derefter kun ÉN anvendelse ad gangen, så
retningen valideres uden at systemet spredes ukontrolleret.

- **A. Lær af hinanden-strippen** — første anvendelse/validering
- **B. Note/tip-moduler** (Vidste du? · Potalot-tip · Potalot-note)
- **C. Detaljemoduler forsigtigt** (Smag og anvendelse · Sortsspecifikke detaljer)
- **D. Guides-forsiden** — VENT; fortjener sin egen separate runde (ellers halv
  ny designretning midt i en detaljeside-oprydning)
