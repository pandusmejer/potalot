# Launch-test backlog (Annas fund, 14/7)

Fra Annas indloggede test på deploy-preview-6. Prioriteret. Kilde: chat 14/7.

## ✅ Bekræftet virker
- Excel-import (onboarding + frøbank).
- Demo-leaks væk (Planter/Kalender/Frøbank tom-tilstande for indloggede).
- Notifikationer (guide-udkast + opgave-påmindelser).

## ✅ Rettet 14/7
- Tilbage fra scan/Excel (startet i onboarding) landede i frøbank-menuen →
  fører nu helt tilbage til /onboarding (`5ed707e`).
- Landingsside-copy strammet til Annas formuleringer (`5ed707e`).

## 🐞 BUGS — åbne
1. **Scan-frøpose fil-input pr. platform** (SKABER FORVIRRING).
   - Desktop: "Tag billede" kan kun vælge eksisterende foto (desktop kan ikke
     kamera-capture via `<input capture>` — kræver getUserMedia/webcam).
   - iPhone: "Upload billede" (bibliotek) åbner kun kameraet, ikke kamerarullen.
   - Fix: bibliotek-mode må ALDRIG have `capture`; overvej at skjule "Tag billede"
     på desktop (eller webcam-capture). Kræver cross-platform test.
2. **Fallback-ikoner på plantesiden er forældede** (VISUEL). Vises når der ikke er
   plantekort-billede. Hører til billed-/ikon-poleringen (se pkt. under UDSKUDT).

## 🔨 BUILDS — besluttet, skal bygges (egne fronter)
### F1. Onboarding V2 — fuld preference-onboarding (Anna: SKAL laves for at teste flowet)
Spec: `onboarding-v2-spec.md`. 7 trin (velkommen · havetype · lokation · områder ·
dyrkerprofil · midt-sæson=V1B-shell · klar). Datamodel (migration): profiles får
garden_type, location, growing_areas, grower_profile, season_status. Wiring:
dyrkerprofil→notifikations-mængde, lokation→vejr. Prioritet: lokation, profil,
midt-sæson først. **Landings-copy allerede opdateret** (subsumeres i V2).

### F2. Genåbnelig "Få din have ind" (Anna-låst 14/7 — NÆSTE build, FØR V2)
Brugeren skal ALTID kunne vende tilbage til import-/tilføj-universet (tilføj
planter · scan · Excel/CSV · skriv frit). Ikke kun engangs-onboarding.
**Placering:** 1) Profil/Indstillinger (label "Få din have ind"), 2) tom-state i
Planter (CTA "Tilføj planter"), 3) tom-state i Frøbank (CTA "Tilføj frø"),
4) evt. Havebog senere. **Rute:** `/onboarding/have` (auth-gated, uden for
(app)-gruppen så onboarding-vagten ikke rammer), tilgængelig for ALLEREDE
onboardede. Genbruger OnboardingShell.
**Krav:** må ikke sende bruger tilbage i signup-onboarding · ikke trigge
onboarding-vagten · virke for onboardede · samme flows · SANDE server-tal (ingen
session-tæller) · ingen bouncende "Fortsæt senere".

**Landings-copy (Anna 14/7 — favner 3 brugertyper: nul / midt-sæson / erfaren):**
- Headline: **"Sådan kommer du i gang"**
- Body: *"Uanset om du starter fra nul, er midt i sæsonen eller har dyrket i
  årevis, kan du begynde på den måde, der passer dig."*
- 4 kort: **"Tilføj det, du dyrker"** (Skriv art og sort — du bestemmer, hvor
  meget du udfylder.) · **"Scan en frøpose"** (Tag et billede — Potalot læser
  sort og så-info fra posen.) · **"Importér en liste"** (Upload Excel eller CSV
  og gennemse alt, før det gemmes.) · **"Skriv frit om haven"** (Fortæl hvad du
  dyrker — Potalot foreslår, og du godkender.)
- Status-chip: har data → "Din have indtil videre: [x] frø · [y] planter";
  ingen data → "Du kan begynde uden at tilføje noget endnu".
- Bund: ingen data → primær "Begynd uden at tilføje planter" + sekundær "Fortsæt
  senere"; har data → primær "Vis min have" + sekundær "Tilføj mere senere".
  Fjern dobbelte/forvirrende exit-links. "Fortsæt senere" må kun findes NÅR der
  er en reel vej tilbage (dvs. når F2 findes) — ellers falsk trøst.

### F3. Slet konto (LAUNCH/GDPR-krav) — NÆSTE build, byg OMHYGGELIGT
Profil/Indstillinger → Konto → Slet konto. Tydelig bekræftelse ("Dette sletter din
konto og dine data. Kan ikke fortrydes."), aktiv bekræftelse (skriv "SLET"). Ikke
gemt bag "kontakt support".
**Teknisk (verificeret 14/7):** service-role-nøgle findes (`SUPABASE_SERVICE_ROLE_KEY`).
**39 tabeller** har `user_id` — men KUN `notes` + `notifications` cascader ved
sletning af auth.users. Resten (plants_v2, inventory_items, calendar_tasks,
plant_logs_v2, voice_notes, garden_locations, guides, seeds, plants, tasks,
placeringer, community_*, forum_*, group_*, ideas, seed_swap_listings, m.fl.)
ville blive FORÆLDRELØSE. → Slet EKSPLICIT fra alle brugerens tabeller (i FK-rigtig
rækkefølge, admin-klient) FØR `auth.admin.deleteUser`. Uigenkaldelig → test på
engangskonto, aldrig på rigtige konti. Byg som dedikeret sletnings-funktion, ikke
ad-hoc. Deletion-delay-tekst hvis teknisk nødvendigt.

### F5. Note-foto i "Skriv frit om haven" (Anna 14/7 — efter F3)
IKKE en ny OCR-motor: genbruger den EKSISTERENDE Claude-vision (extractSeedPacketFields-
mønster) på et billede af håndskrevne noter. Hører INDE i "Skriv frit", ikke som
separat spor. Flow: skriv tekst OG/ELLER tilføj foto af noter → Claude læser begge
→ forslag (arter/sorter/antal/steder/status, usikre markeret) → godkend/redigér →
gem. Foto = råinput, ALDRIG facit: intet auto-oprettes uden review; copy må være
usikker ("Jeg tror, der står…", "Tjek om dette ser rigtigt ud"). Landings-kort:
"Skriv løst eller tilføj et foto af dine noter — Potalot foreslår, og du godkender."
Inde i flow: tekstfelt + sekundær "Tilføj foto af noter" + hjælpetekst "Du kan
skrive frit, tilføje et foto af håndskrevne noter — eller begge dele." Undgå:
dokumentscanner-look, løfte om perfekt håndskrift-aflæsning, separat stort spor.

### F4. Havebog-mosaik ALTID synlig — "DET KAN HAVEN BLIVE TIL" (Anna-låst regel)
Mosaikken (Forvandlinger-preview) må ALDRIG gates væk fra Havebog — den er sidens
"extra"/payoff. Skift kun DATATILSTAND, aldrig synlighed. Ligger fast tidligt
(efter Hero · Dagens historie · Diktafon). 2-kolonne, bland foto/typografi/
farvefelter, ingen tal uden data, ingen grå tom-states, ingen admin-copy.
**Fire tilstande (må ALDRIG lyve/opfinde høst, ALDRIG demo-data for indloggede):**
- **Strong** (høstlogs/relevante planter/frøbank-match): konkrete forvandlinger,
  copy må sige "din have". Klik → `/havebog/forvandlinger/[id]`.
- **Medium** (planter/frø, ingen høst): fremadskuende, copy "kan blive" ikke "er
  blevet" ("Når tomaterne modner…").
- **Low/ny** (tynd data): generiske kategorier (Spis · Gem · Tør · Bryg · Duft ·
  Plej · Pynt · Så igen). Copy "Når du dyrker, begynder haven at åbne flere veje."
  Klik → `/havebog/forvandlinger`.
- **Tom**: stille invitation ("Dyrk noget først. Så begynder Potalot at foreslå
  små forvandlinger.") + 3-4 faste kategori-tiles m. farvefelter/glyphs. Må IKKE
  føles tom.

## ⏸ UDSKUDT (efter ovenstående / foto-roadmap)
- Plantekort-/artsfoto-produktion (roadmap 13-16) → løser billed-visning + fallback-ikoner.
- Cross-role billed-fallback (plante→frøkort) = eksplicit designbeslutning, ikke rørt.

## Rækkefølge (Anna-LÅST 14/7 — F2 FØR V2)
Begrundelse: F2 gør eksisterende onboarding brugbar efter 1. session
(launch-nødvendigt); V2 ændrer strukturen (forbedring). Byg ikke V2 oven på et
"senere" der ikke findes endnu.
1. ✅ onboarding-fixes + copy ("Start hvor du er") + ✅ **F2** (skal push/testes).
2. **F3 Slet konto** — GDPR/launch-krav (byg OMHYGGELIGT, uigenkaldelig).
3. **F5 Note-foto i "Skriv frit"** — genbruger vision (afgrænset).
4. **F1 Onboarding V2** — fuld preference-onboarding (stor front, egen fase).
5. **F4 Havebog-mosaik** — egen Havebog-front.
6. Scan fil-input-bug (cross-platform) + billed-/ikon-polering (foto-roadmap).
