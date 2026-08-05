import { Sparkles } from 'lucide-react'

/**
 * Vises øverst når brugeren ikke er logget ind. Topbar har egne login-knapper,
 * så banneret er kun en tekst-CTA.
 *
 * Statiske sider bager banneret ind (build kender ingen cookies). Det inline
 * script skjuler det synkront under HTML-parse for logget ind-brugere — før
 * første paint, så der ikke er banner-blink eller layout-hop.
 */
export function DemoBanner() {
  return (
    <div id="demo-banner" suppressHydrationWarning>
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){try{if(document.cookie.split('; ').some(function(c){return c.indexOf('sb-')===0&&c.indexOf('-auth-token')>-1})){var e=document.getElementById('demo-banner');if(e)e.style.display='none'}}catch(_){}})()",
        }}
      />
      <div className="bg-secondary/50 border-b border-secondary text-foreground">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <p className="text-xs sm:text-sm">
            Du ser PotAlot i demo-tilstand. Opret bruger for at gemme dine egne frø, planter og opgaver.
          </p>
        </div>
      </div>
    </div>
  )
}
