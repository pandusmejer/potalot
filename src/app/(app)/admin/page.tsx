import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { isCurrentUserAdmin } from '@/lib/auth'
import { getGeneralGardenTasks } from '@/actions/aarshjul'
import { ShieldCheck, ArrowRight, ListChecks } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) redirect('/')

  const tasks = await getGeneralGardenTasks({ includeInactive: true })
  const aktive = tasks.filter(t => t.isActive).length
  const inaktive = tasks.length - aktive

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start gap-3">
        <ShieldCheck className="h-7 w-7 text-primary mt-1" />
        <div>
          <h1 className="text-3xl font-serif text-foreground">Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Master-profil med adgang til at redigere globale data, der gælder for alle brugere.
          </p>
        </div>
      </div>

      <Card>
        <Link
          href="/admin/aarshjul"
          className="flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors rounded-2xl"
        >
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <ListChecks className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground">Årshjul — generelle gøremål</p>
            <p className="text-sm text-muted-foreground">
              Redigér de 12 månedlige gøremål alle brugere ser i deres kalender.
            </p>
            <div className="flex gap-2 mt-2">
              <Badge variant="success" className="text-[10px]">{aktive} aktive</Badge>
              {inaktive > 0 && <Badge variant="muted" className="text-[10px]">{inaktive} inaktive</Badge>}
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </Card>

      <Card>
        <CardContent className="py-6">
          <p className="text-sm font-medium text-foreground mb-1">Kommer snart</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Brugere — se og forvalt registrerede konti</li>
            <li>Globale guides — tilføj system-guides synlige for alle</li>
            <li>Statistik — antal brugere, frø, planter</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
