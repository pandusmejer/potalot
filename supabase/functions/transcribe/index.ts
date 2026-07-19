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

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
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
