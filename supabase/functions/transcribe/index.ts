import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

/**
 * transcribe — server-side tale-til-tekst for diktafonen (STT-halvdel, Vej A).
 *
 * Modtager en lydfil (multipart/form-data, felt `file`) fra klienten
 * (MediaRecorder) og returnerer dansk transskription som { text }.
 *
 * LÅST (Docs/product/diktafon-v1-implementering.md 2.4):
 *  - Model: gpt-4o-transcribe (OpenAI /v1/audio/transcriptions).
 *  - language: "da" som HÅRD parameter — ikke autodetektion (korte klip med
 *    latinske sortsnavne "San Marzano"/"Café au Lait" gætter ellers forkert).
 *  - Valgfri `prompt` (domæneordliste = brugerens egne arts-/sortsnavne) biaser
 *    genkendelsen mod havesprog.
 *  - 30 s timeout; nøgle læses fra Supabase secret OPENAI_API_KEY (aldrig klient).
 *
 * BESKYTTELSE (så en fejl/misbrug ikke tømmer OpenAI-kontoen):
 *  1. Kun INDLOGGEDE brugere (JWT-role = authenticated). Anon/demo afvises på
 *     API-niveau — matcher at diktafonen er login-gated.
 *  2. Daglig grænse pr. bruger: højst DAILY_CAP optagelser/24t (tælles via
 *     voice_notes). Fejler tællingen (DB-hik), fejler vi ÅBENT (blokerer ikke
 *     brugeren), men logger — auth-tjekket fejler LUKKET.
 *
 * Fortolkningen (tekst → forslag) sker separat på Claude Haiku (Server Action)
 * — denne funktion transskriberer KUN, så de to fejlisoleres.
 */

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const OPENAI_URL = 'https://api.openai.com/v1/audio/transcriptions'
const MODEL = 'gpt-4o-transcribe' // fallback: whisper-1 (samme endpoint/format)
const MAX_BYTES = 25 * 1024 * 1024 // OpenAI-grænse; klienten capper reelt på 120 s
const TIMEOUT_MS = 30_000
const DAILY_CAP = 50 // optagelser/24t pr. bruger — langt over normal brug (~5/uge),
//                      rammer kun runaway-fejl eller misbrug.

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

/** Dekodér JWT-payload uden verifikation (gateway har allerede verificeret). */
function decodeJwtPayload(jwt: string): { sub?: string; role?: string } | null {
  try {
    const part = jwt.split('.')[1]
    if (!part) return null
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

/**
 * Gate: kræver indlogget bruger + daglig grænse. Returnerer en Response ved
 * afvisning, ellers null (fortsæt). Tællingen fejler ÅBENT.
 */
async function tjekAdgang(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.replace(/^Bearer\s+/i, '')
  const payload = jwt ? decodeJwtPayload(jwt) : null

  // 1) Kun indloggede brugere (fejler LUKKET).
  if (!payload || payload.role !== 'authenticated' || !payload.sub) {
    return json(
      { error: { code: 'STT_AUTH', message: 'Log ind for at bruge diktafonen.' } },
      401,
    )
  }

  // 2) Daglig grænse pr. bruger (fejler ÅBENT ved DB-hik).
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) return null // ingen DB-adgang → spring grænse over

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const url =
      `${supabaseUrl}/rest/v1/voice_notes` +
      `?user_id=eq.${payload.sub}` +
      `&recorded_at=gte.${encodeURIComponent(since)}` +
      `&select=id`
    const res = await fetch(url, {
      method: 'HEAD',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: 'count=exact',
      },
    })
    // content-range: "0-49/123" eller "*/123"
    const total = parseInt(res.headers.get('content-range')?.split('/')[1] ?? '0', 10)
    if (Number.isFinite(total) && total >= DAILY_CAP) {
      return json(
        {
          error: {
            code: 'STT_RATE_LIMIT',
            message: 'Du har nået dagens grænse for taleoptagelser. Prøv igen i morgen.',
          },
        },
        429,
      )
    }
  } catch (e) {
    console.error('Rate-limit-tælling fejlede (fejler åbent):', e)
  }
  return null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') {
    return json({ error: { code: 'STT_METHOD', message: 'Kun POST.' } }, 405)
  }

  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) {
    return json({ error: { code: 'STT_CONFIG', message: 'Transskription er ikke konfigureret.' } }, 500)
  }

  // Adgang + grænse FØR vi bruger OpenAI-kreditter (fail fast).
  const afvist = await tjekAdgang(req)
  if (afvist) return afvist

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return json({ error: { code: 'STT_BAD_REQUEST', message: 'Forventede multipart/form-data.' } }, 400)
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return json({ error: { code: 'STT_BAD_REQUEST', message: 'Manglende lydfil.' } }, 400)
  }
  if (file.size === 0) {
    return json({ error: { code: 'STT_EMPTY', message: 'Tom optagelse.' } }, 400)
  }
  if (file.size > MAX_BYTES) {
    return json({ error: { code: 'STT_TOO_LARGE', message: 'Optagelsen er for stor.' } }, 413)
  }

  const promptRaw = form.get('prompt')
  const prompt = typeof promptRaw === 'string' ? promptRaw.slice(0, 900) : ''

  const oa = new FormData()
  oa.append('file', file, file.name || 'optagelse.webm')
  oa.append('model', MODEL)
  oa.append('language', 'da') // HÅRD dansk, ikke autodetektion
  oa.append('response_format', 'json')
  if (prompt) oa.append('prompt', prompt)

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: oa,
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    if (!res.ok) {
      const detail = await res.text()
      console.error('OpenAI STT-fejl', res.status, detail.slice(0, 300))
      return json({ error: { code: 'STT_UPSTREAM', message: 'Transskription mislykkedes.' } }, 502)
    }
    const data = (await res.json()) as { text?: string }
    return json({ text: (data.text ?? '').trim() }, 200)
  } catch (e) {
    clearTimeout(timer)
    const aborted = e instanceof DOMException && e.name === 'AbortError'
    return json(
      {
        error: {
          code: aborted ? 'STT_TIMEOUT' : 'STT_UPSTREAM',
          message: aborted ? 'Transskriptionen tog for lang tid.' : 'Transskription mislykkedes.',
        },
      },
      aborted ? 504 : 502,
    )
  }
})
