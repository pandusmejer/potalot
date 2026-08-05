import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Proxy (tidligere middleware): refresher Supabase-session-cookies på hver
 * request og redirecter anonyme brugere væk fra beskyttede ruter.
 * Offentlige ruter (overblik, frøbank, mine-planter, kalender, guides) lader
 * vi passere — anonyme brugere ser tom data + demo-banner.
 */
/** UUID = DB-guide (redaktionelle guides har kebab-slugs). Holdes i sync
 * med src/lib/guides/guide-href.ts (proxy kan ikke importere app-kode frit). */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function proxy(request: NextRequest) {
  // Eksponér stien til server-komponenter (layouts får ikke pathname direkte).
  // (app)-layoutet bruger den til at undtage frøbank-tilføj fra onboarding-gaten.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)
  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const { pathname, searchParams } = request.nextUrl

  // Gamle private guide-links (gemte notifikationer, historik) peger på
  // /guides/<uuid> — den rute er nu KUN redaktionelle slugs. Redirect til
  // den adgangskontrollerede /guides/mine/<uuid>.
  const legacyGuide = pathname.match(/^\/guides\/([^/]+)$/)
  if (legacyGuide && UUID_RE.test(legacyGuide[1])) {
    const url = request.nextUrl.clone()
    url.pathname = `/guides/mine/${legacyGuide[1]}`
    return NextResponse.redirect(url, 308)
  }

  // Session-refresh (auth.getUser) er et NETVÆRKSKALD mod Supabase Auth.
  // Uden auth-cookies er der ingen session at refreshe — spring helt over,
  // så anonyme requests (og CDN-misses på statiske sider) ikke betaler det.
  const harAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'))

  let user: { id: string } | null = null
  if (harAuthCookie) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request: { headers: requestHeaders } })
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          },
        },
      },
    )
    const { data } = await supabase.auth.getUser()
    user = data.user
  }

  // Safety-net: hvis magic-link rammer / eller /login med ?code= (Supabase Site URL fallback)
  // forward til /auth/callback så code-exchange sker korrekt.
  const code = searchParams.get('code')
  if (code && (pathname === '/' || pathname === '/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    return NextResponse.redirect(url)
  }
  // Beskyttede ruter (kun for logged-in brugere): profil, indstillinger, onboarding,
  // grupper, idétavle, og alle administrations-ruter.
  // Resten (overblik, frøbank, mine-planter, kalender, guides) er offentligt
  // tilgængelige som demo-visning — skrive-handlinger gates separat i actions.
  const isProtectedAuth =
    pathname === '/profil' ||
    pathname.startsWith('/profil/') ||
    pathname === '/indstillinger' ||
    pathname.startsWith('/indstillinger/') ||
    pathname === '/onboarding' ||
    pathname.startsWith('/onboarding/') ||
    pathname === '/grupper' ||
    pathname.startsWith('/grupper/') ||
    pathname === '/idetavle' ||
    pathname.startsWith('/idetavle/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/guides/mine/')

  if (!user && isProtectedAuth) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Logged-in users på /login eller /opret → home
  if (user && (pathname === '/login' || pathname === '/opret')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|woff2?)$).*)'],
}
