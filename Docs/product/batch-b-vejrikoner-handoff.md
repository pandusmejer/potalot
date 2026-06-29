# Batch B — Vejr-ikoner → kalender/vejrpools (HANDOFF til `feature/kalender-brain`)

**Hvorfor handoff:** vejrpool-motoren (10-12 typer m. undertekster) bygges på
`feature/kalender-brain`. Wiring af vejr-ikoner her på `claude/romantic-chatelet-9908e2`
ville kollidere/dobbeltarbejdes. Derfor: ikonerne er lavet + committet her; selve
wiringen køres på kalender-brain.

## Forudsætning (vigtig)
De 8 vejr-PNG'er ligger committet i **`claude/romantic-chatelet-9908e2` @ `9b0d5e3`**
under `public/images/glyphs/`. For at bruge dem på kalender-brain:
`git cherry-pick 9b0d5e3 -- public/images/glyphs/` **eller** vent til denne branch
merges til main og rebase kalender-brain. Wiringen kan IKKE testes før ikonerne er der.

## De 8 vejr-ikoner (transparente, ≤256px, illustrative)
`sol` · `overskyet` · `regn` · `kraftig-regn` · `storm` · `vind` · `frost` · `toerke`
→ `/images/glyphs/<navn>.png`

## Flader der bruger vejr-ikoner i dag (alle Lucide monoline)
1. **`src/components/layout/weather-chip.tsx`** — topbar, live API. `ICON_MAP` fra
   `WeatherIcon` (`src/lib/weather-codes.ts`): Sun, CloudSun, Cloud, CloudFog,
   CloudDrizzle, CloudRain, CloudSnow, CloudLightning, CloudHail (9 koder).
2. **`src/components/havekalender/weather-pills.tsx`** — kalender (live via
   `<WeatherPills>` i kalender-client). `PillType`: temp/jordtemp/rain/sun/frost/wind;
   ICON: rain→CloudRain, sun→Sun, frost→Snowflake, wind→Wind.
3. **`src/components/weather/weather-pools.tsx`** — kun QA/preview (4 dekorative).

## Foreslået mapping (BEKRÆFT MED ANNA før wiring)
| PNG | weather-pills type | weather-chip WeatherIcon |
| --- | --- | --- |
| sol | sun | Sun (+ CloudSun?) |
| overskyet | — (ny?) | Cloud |
| regn | rain | CloudRain + CloudDrizzle |
| kraftig-regn | — (afledt) | CloudHail? |
| storm | — (ny?) | CloudLightning |
| vind | wind | (chip har ingen wind-kode) |
| frost | frost | CloudSnow |
| toerke | — (afledt) | (ingen API-kode) |

Direkte 1:1-match findes kun for **sol/regn/frost/vind** (i pills). De øvrige
(overskyet/kraftig-regn/storm/toerke) kræver enten nye slots/afledninger eller
hører til den fulde vejrpool-model på kalender-brain.

## Stil-beslutning (Anna)
Fladerne bruger små **tonede monoline-ikoner** (16-18px, `iconColor`). PNG'erne er
**fuldfarve-illustrationer**. Beslut: skifter vejr til illustrativt register (som
frøbank-kategorierne) eller forbliver monoline? Roadmap siger "Potalot-vejrtilstande"
→ sandsynligvis illustrativt. Hvis illustrativt: drop `iconColor`-tinten, render som
`<img>` (contain), behold pille-/chip-geometrien.

## Accept
1. Vejr-ikoner i kalender/vejrpools bruger Potalot-PNG'erne (mindst de 4 direkte match).
2. Læsbare ved 16-18px på de eksisterende flader.
3. Ingen ændring af vejr-DATA/logik — kun ikon-rendering.
4. tsc grøn. Commit lokalt, ingen push ([[netlify_build_credits]]).

Se [[ikon_roadmap]] (Batch B) + [[ikon_system]] (PNG-pivot + komprimering).
