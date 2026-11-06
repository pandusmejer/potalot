/**
 * Usabilityrunden efter MVP-accepttesten (6/11 2026): thumbnails, bundnavigation,
 * Opgaver (hierarki + dyrkningssted), scan med "Tag foto"/"Vælg fra fotos" og
 * serverkald. Kør: npx tsx scripts/test-usability-runde.ts
 *
 * Komponenterne er React/klient og kan ikke køres her; de statiske tjek låser
 * de kontrakter, der ellers let rulles tilbage ved et uheld.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { erSupabaseFoto, THUMB_BREDDER, thumbSrc, thumbSrcSet, thumbUrl } from '../src/lib/images/thumb'
import { fjernDubletter } from '../src/lib/opgaver-mvp'
import type { CalendarTask } from '../src/lib/types'

let bestaaet = 0
let fejlet = 0
function tjek(navn: string, ok: boolean, detalje = '') {
  if (ok) { bestaaet++; console.log(`  ✓ ${navn}`) }
  else { fejlet++; console.error(`  ✗ ${navn}${detalje ? `\n      ${detalje}` : ''}`) }
}
const laes = (sti: string) => readFileSync(join(__dirname, '..', sti), 'utf8')

const SB = 'https://abcdefgh.supabase.co'
const FOTO = `${SB}/storage/v1/object/public/media/uid/froebank/x.jpg`

console.log('\n[Thumbnails — hvad omskrives]')
tjek('brugerens Supabase-foto omskrives', erSupabaseFoto(FOTO, SB))
tjek('kuraterede /images/* røres ikke', !erSupabaseFoto('/images/groentsager/tomat.jpg', SB))
tjek('andet projekts host røres ikke', !erSupabaseFoto('https://andet.supabase.co/storage/v1/object/public/media/x.jpg', SB))
tjek('eksterne billeder røres ikke', !erSupabaseFoto('https://example.com/storage/v1/object/public/x.jpg', SB))
tjek('http (ikke https) røres ikke', !erSupabaseFoto(FOTO.replace('https:', 'http:'), SB))
tjek('ikke-offentlig storage-sti røres ikke', !erSupabaseFoto(`${SB}/storage/v1/object/sign/media/x.jpg`, SB))
tjek('uden Supabase-URL i miljøet røres intet', !erSupabaseFoto(FOTO, undefined) && !erSupabaseFoto(FOTO, ''))
tjek('tom/null src giver intet', thumbSrcSet(null, SB) === null && thumbSrc('', SB) === null)
tjek('ugyldig URL kaster ikke', !erSupabaseFoto('ikke en url', SB) && !erSupabaseFoto(FOTO, 'ikke en url'))

console.log('\n[Thumbnails — størrelser og adresse]')
tjek('breddevalg er tilladte Next-størrelser', THUMB_BREDDER.every((b) => [32, 48, 64, 96, 128, 256, 384].includes(b)))
tjek('3x-udgaven dækker 60 px højde på en 3x-skærm (≥ 180 px)', THUMB_BREDDER[2] >= 180)
const set = thumbSrcSet(FOTO, SB) ?? ''
tjek('srcset har 1x, 2x og 3x', /\s1x,.*\s2x,.*\s3x$/.test(set), set)
tjek('adressen går gennem /_next/image med url-parameter', thumbUrl(FOTO, 64).startsWith('/_next/image?url=') && thumbUrl(FOTO, 64).includes(encodeURIComponent(FOTO)))
tjek('originalen ligger ikke i srcset uden /_next/image', set.split(',').every((d) => d.trim().startsWith('/_next/image?')))
tjek('ikke-Supabase giver null (så originalen bruges uændret)', thumbSrcSet('/images/a.jpg', SB) === null)

console.log('\n[Thumbnails — brugt i listerne, originalen i detaljer]')
const cfg = laes('next.config.ts')
tjek('next.config tillader kun dette projekts offentlige storage-sti', /pathname: '\/storage\/v1\/object\/public\/\*\*'/.test(cfg) && /hostname: supabaseHost/.test(cfg))
const fk = laes('src/components/froebank/froebank-kompakt.tsx')
const pk = laes('src/components/mine-planter/planter-kompakt.tsx')
tjek('Frøbank-listen bruger ThumbImg', /<ThumbImg/.test(fk) && !/<img/.test(fk))
tjek('Mine planter-listen bruger ThumbImg', /<ThumbImg/.test(pk) && !/<img/.test(pk))
const ti = laes('src/components/ui/thumb-img.tsx')
tjek('fallback til originalen ved fejl', /onError=\{\(\) => \{ if \(srcSet\) setFejlet\(true\) \}\}/.test(ti) && /lille \?\? src/.test(ti))
tjek('fallback-ikon bevares for manglende foto', /harBillede \?/.test(fk) && /<Sprout/.test(fk) && /harBillede \?/.test(pk) && /<Sprout/.test(pk))
tjek('detaljesiderne bruger stadig originalen (ingen ThumbImg)', !/ThumbImg/.test(laes('src/app/(app)/froebank/[id]/page.tsx')) && !/ThumbImg/.test(laes('src/components/mine-planter/plant-foto-manager.tsx')))

console.log('\n[Bundnavigation]')
const nav = laes('src/components/layout/bottom-nav.tsx')
const navMvp = nav.slice(nav.indexOf('const STIL = MVP_MODE'), nav.indexOf('  : {'))
const navOrig = nav.slice(nav.indexOf('  : {'), nav.indexOf('/**\n * Mobile bottom-nav.'))
tjek('MVP: lige brede felter (flex-1 basis-0)', /flex-1 basis-0/.test(navMvp))
tjek('MVP: trykflade mindst 56 px', /min-h-\[(5[6-9]|[6-9]\d)px\]/.test(navMvp))
tjek('MVP: tekst mindst 12 px, ikon 24 px', /text-\[12px\]/.test(navMvp) && /ikon: 24/.test(navMvp))
tjek('MVP slået fra: de oprindelige mål (10 px tekst, 21 px ikon, py-1)', /text-\[10px\]/.test(navOrig) && /ikon: 21/.test(navOrig) && /justify-around px-1\.5 py-1/.test(navOrig) && !/min-h-/.test(navOrig))
tjek('aktiv fane markeres (aria-current + fyldt felt + fed)', /aria-current=\{active \? 'page' : undefined\}/.test(nav) && /NAV\.activeBg/.test(nav) && /active \? STIL\.vaegt\.aktiv/.test(nav) && /aktiv: 700/.test(nav))
tjek('safe area på nav-baren', /safe-area-pb/.test(nav))
tjek("MVP: viewport-fit=cover (ellers er safe-area-inset altid 0); uden MVP uændret", /viewportFit: MVP_MODE \? 'cover' : undefined/.test(laes('src/app/layout.tsx')))
tjek('de fire MVP-punkter er uændrede', /froebank/.test(laes('src/lib/mvp-config.ts')) && (laes('src/lib/mvp-config.ts').match(/\{ id: '/g) ?? []).length === 4)
tjek('uden MVP vises de oprindelige fem (BASE_ITEMS)', /MVP_MODE\s*\n?\s*\?[\s\S]{0,120}:\s*BASE_ITEMS/.test(nav))

console.log('\n[Opgaver — hierarki]')
const op = laes('src/components/havekalender/opgaver-mvp.tsx')
tjek('sektionstitler: Kræver handling og Planlagt', /titel="Kræver handling"/.test(op) && /titel="Planlagt"/.test(op))
tjek('forsinkede og øvrige adskilles med gruppelabels', /<Underoverskrift>Forsinket<\/Underoverskrift>/.test(op) && /<Underoverskrift>Nu<\/Underoverskrift>/.test(op))
tjek('mere luft mellem sektioner (space-y-9)', (op.match(/space-y-9/g) ?? []).length === 2)
tjek('månedens forslag adskilles med streg og lettere typografi', /border-t border-border\/60 pt-7/.test(op) && /divide-y divide-border\/50/.test(op) && !/border-dashed border-border bg-card\/60/.test(op))
tjek('Havebog-hero, bølge og dato er uændrede på siden', /<HavebogHero narrative=\{heroNarrative\} \/>/.test(laes('src/app/(app)/kalender/page.tsx')) && /<HavebogDateline \/>/.test(laes('src/app/(app)/kalender/page.tsx')))

console.log('\n[Opgaver — dyrkningssted]')
tjek('Nu og Kommende (OpgaveRaekke) viser stedet', /sted\?: string \| null/.test(op) && /task\.linkedPlantId && sted \? ` · \$\{sted\}`/.test(op))
tjek('Udført (UdfoertRaekke) viser stedet', /function UdfoertRaekke\(\{ task, sted = null \}/.test(op))
tjek('afledte råd (AfledtRaekke) viser stedet', /Fra dine planter\{sted \? ` · \$\{sted\}` : ''\}/.test(op))
tjek('stedet slås op via plante-id (ikke via titel/sort)', /stedFor\.get\(/.test(op) && !/stedFor\.get\([^)]*(title|variety|name)/.test(op))
const hk = laes('src/actions/havekalender.ts')
tjek('stedet hentes med den eksisterende plants_v2-select (ingen ny forespørgsel)', (hk.match(/\.select\('id, name, variety, location'\)/g) ?? []).length === 2 && (hk.match(/\.from\('plants_v2'\)/g) ?? []).length === 2)

const mk = (id: string, plant: string | null, o: Partial<CalendarTask> = {}): CalendarTask => ({
  id, userId: 'u', title: 'Sår Spinat Engelsk', date: '2026-11-06', taskType: 'sow', priority: 'medium',
  status: 'open', source: 'plant', isRecurring: false, linkedPlantId: plant,
  createdAt: `2026-11-0${id.length}T08:00:00Z`, updatedAt: '2026-11-06T08:00:00Z', ...o,
} as CalendarTask)
const to = fjernDubletter([mk('a', 'p-drivhus'), mk('bb', 'p-friland')])
tjek('to dyrkninger med samme titel, dato og sort giver to opgaver', to.length === 2)
tjek('hver opgave beholder sin egen plante', to.map((t) => t.linkedPlantId).sort().join() === 'p-drivhus,p-friland')
tjek('samme plante med samme opgave dubleres stadig væk', fjernDubletter([mk('a', 'p1'), mk('bb', 'p1')]).length === 1)

console.log('\n[Scan frøpose]')
const mi = laes('src/components/ui/multi-image-upload.tsx')
const tf = laes('src/components/froebank/tilfoej-flow.tsx')
tjek('"Tag foto" åbner bagkameraet (capture=environment)', /ref=\{kameraRef\}[\s\S]{0,160}capture="environment"/.test(mi))
tjek('"Vælg fra fotos" åbner fotobiblioteket med flere billeder (multiple, uden capture)', /ref=\{inputRef\}\s*\n\s*type="file"\s*\n\s*accept="image\/\*"\s*\n\s*multiple\s*\n/.test(mi))
tjek('begge knapper bruger samme upload (handleFiles)', (mi.match(/onChange=\{handleFiles\}/g) ?? []).length >= 3)
tjek('knappernes tekster', />\s*Tag foto\s*</.test(mi) || /Tag foto\s*\n/.test(mi))
tjek('"Vælg fra fotos" findes', /Vælg fra fotos/.test(mi))
tjek('scanningsforløbet bruger begge knapper (MVP), højst fire billeder', /kameraOgFotos: true/.test(tf) && /maxImages=\{4\}/.test(tf))
tjek('forkerte billeder kan fjernes med en altid synlig knap', /aria-label="Fjern billede"/.test(mi))
tjek('startskærmen hedder "Tag foto" og "Vælg fra fotos" i MVP', /MVP_MODE \? 'Tag foto'/.test(tf) && /MVP_MODE \? 'Vælg fra fotos'/.test(tf))
tjek('uden MVP er scanskærmen som før (Tag billede / Upload billede / capture / label)', /'Tag billede'/.test(tf) && /'Upload billede'/.test(tf) && /'Fra kamerarulle'/.test(tf) && /capture: mode === 'camera'/.test(tf) && /label: mode === 'camera' \? 'Tag billede' : 'Vælg billede\(r\)'/.test(tf))
tjek('ingen ny scanner: samme læsning som før', /extractSeedPacketFields\(imgs\)/.test(tf))

console.log('\n[Serverkald]')
const hb = laes('src/actions/havebog.ts')
tjek('getHavebogData slår ikke profiles op selv (bruger den cachede getProfile)', !/\.from\('profiles'\)/.test(hb) && /getProfile\(\)/.test(hb))
const pr = laes('src/actions/profil.ts')
tjek('profilen bærer display_name uden ekstra forespørgsel', /displayName: row\.display_name \?\? null/.test(pr))
tjek('getUser er uændret (ingen getClaims)', !/getClaims/.test(laes('src/lib/auth.ts')))

console.log(`\n${bestaaet} bestået, ${fejlet} fejlet`)
process.exit(fejlet > 0 ? 1 : 0)
