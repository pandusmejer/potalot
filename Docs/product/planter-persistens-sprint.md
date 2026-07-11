# Planter — persistens-sprint (luk Planter helt)

**Status:** Planter-forsiden + detail-siden er **visuelt låst** (juni 2026).
Tap-to-check, sted-detail/filter og hele forside-kompositionen virker på UDLEDTE
data — men tre ting persisterer ikke. Denne sprint lukker Planter som appens
reference-kerne. **KUN datalag, INGEN nye visuelle redesigns.**

**Princip (Anna 17/6):** "Når Planter faktisk gemmer det, brugeren gør, har I en
rigtig kerne. Indtil da er den en smuk prototype — og prototyper smiler pænt
mens de lyver." Luk ÉN flade helt før Kalender åbnes; undgå fem "næsten færdige"
områder og nul låste.

---

## 1. Datamodel: udført udledt opgave  ← START HER
Udledte opgaver ("I haven i dag", afledt af plantestatus i `lib/afledninger`)
skal kunne markeres **udført** UDEN at blive rigtige manuelle tasks.

`PlantTaskCompletion`:
- `id`, `user_id`, `plant_id`
- `task_key` — **deterministisk**: `plant_id + task_type + dato/fase`
- `task_title`, `task_type`, `source`
- `completed_at`, `completed_date`
- `log_entry_id?` (kobling til historie)

task_key-eksempler:
```
tomat-san-marzano:vanding:2026-06-17
salat-little-gem:hoest-yderblade:2026-06-17
dahlia-cafe-au-lait:udplant-efter-frost:2026-week-25
```
Så systemet kan spørge: *er denne udledte opgave allerede udført i dag/denne fase?*
→ vis som udført / skjul den.

## 2. Markér udført → log i plantens historie
Flow: tap checkbox → markér udført → opret completion → opret log-entry i plantens
historie ("Høst yderblade markeret som udført."). V1 holdes **lille** — INGEN
bottom-sheet-roman; note/foto kan komme senere.

Erstatter den nuværende **LOKALE/session**-afkrydsning i `at-se-til-i-dag.tsx`
(den resetter ved reload i dag). Afkrydsede forlader stadig listen → "N udført".

## 3. GardenLocation-entity
I dag udledes steder af `plant.location`-streng (`lib/steder.ts`). Bruger skal
kunne oprette "Drivhus" FØR der er planter i det.

`GardenLocation`: `id`, `user_id`, `name`, `type`, `image_url?`, `notes?`,
`created_at`. `Plant` peger på `garden_location_id`.
**BEHOLD fallback** til legacy `plant.location`-tekst (smadr ikke demo-data).

## 4. Tre oprettelsesveje til dyrkningssteder
1. Fra **Dyrkningssteder** på Planter-forsiden (UI-døren findes i `mine-steder.tsx`
   — pt. kun React-state; wir til persistens).
2. **Inline** ved plante-oprettelse/redigering (placering = vælg eksisterende
   eller opret nyt).
3. Senere: **Profil / Min have / Dyrkningssteder**-admin.
V1 kan nøjes med 1+2; datamodellen skal kunne bære 3.

## 5. "Fra frø til nu" data-nær  ← sidst i sprinten
Aggreger events fra plant-logs/datoer → faktiske månedspunkter ("12 frø blev sået",
"7 planter blev flyttet ud"). Rolig fallback når data mangler. Må IKKE lyde som
statisk havepoesi forklædt som indsigt.

---

## Demo-ærlighed (hård regel)
Demo (anonym) må vise disabled/tydelig ikke-gemt tilstand — men appen må **ALDRIG
lade som om den gemmer, hvis den ikke gør** (samme princip som detail-Dagbogen).

## Når sprinten er lukket → menupunkt-rækkefølge
1. **Planter persistens** (denne sprint)
2. Kalender — design
3. Frøbank — design + billedsystem
4. Guides — design + AI-regler
5. Profil / Min have
6. Onboarding + sæsonlogik

Kalender hænger direkte sammen med opgaver / udført-status / notifikationer /
sæsonlogik — præcis det, denne sprint definerer. Derfor **Planter FØRST**.
