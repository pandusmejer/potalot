import { getProfile } from '@/actions/profil'
import { ProfilForm } from '@/components/profil/profil-form'
import { ChangePasswordForm } from '@/components/profil/change-password-form'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Notebook, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ProfilPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-3xl font-serif text-foreground">Min profil</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hvem er du, og hvordan vil du bruge PotAlot.
        </p>
      </div>

      <ProfilForm initialProfile={profile} />

      {/* Lille henvisning til Havebogen — det grønne, ikke det tekniske */}
      <Link
        href="/havebog"
        className="block rounded-xl border border-border bg-gradient-to-br from-secondary/30 to-card p-4 hover:bg-accent/30 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <Notebook className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-foreground">Min havebog</p>
            <p className="text-xs text-muted-foreground italic mt-0.5">
              Din rolle, dine badges, din havehistorie.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </Link>

      <ChangePasswordForm />
    </div>
  )
}
