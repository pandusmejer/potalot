import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CloneMasterButton } from '@/components/guides/clone-master-button'
import { UserGuideEditDialog } from '@/components/guides/user-guide-edit-dialog'
import { DeleteGuideButton } from '@/components/guides/delete-guide-button'
import { FlagBanner } from '@/components/guides/flag-banner'
import { FlagGuideDialog } from '@/components/admin/flag-guide-dialog'
import { PromoteToMasterButton } from '@/components/admin/promote-to-master-button'
import { getGuide } from '@/actions/guides'
import { getCurrentUser, isCurrentUserAdmin } from '@/lib/auth'
import { ArrowLeft, Eye, Lock, Link2 } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

/**
 * 🔧 ADMIN — guide-handlinger.
 *
 * Alle CMS-/admin-handlinger samles HER, fysisk adskilt fra den rene
 * læser-oplevelse på /guides/[id]. Det betyder:
 *
 *   - /guides/[id]         = ren læser-side, ingen admin
 *   - /admin/guides/[id]   = alle admin-handlinger
 *
 * Adgang: ejere ser handlinger til egne guides; admins ser handlinger
 * til alle guides. Almindelige brugere uden ejerskab returneres til
 * den offentlige guide-side.
 */
export default async function AdminGuideDetailPage({ params }: Props) {
  const { id } = await params

  const original = await getGuide(id)
  if (!original) notFound()

  const currentUser = await getCurrentUser()
  if (!currentUser) {
    // Ingen logget bruger → ingen admin-adgang
    notFound()
  }

  const isAdmin = await isCurrentUserAdmin()
  const isOwner = original.visibility === 'private'

  // Hvis hverken ejer eller admin → ingen adgang
  if (!isOwner && !isAdmin) {
    notFound()
  }

  const isMaster = original.visibility === 'public'

  return (
    <article className="space-y-5 max-w-2xl pb-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/guides/${original.id}`}>
            <ArrowLeft className="h-4 w-4" />
            Tilbage til guiden
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/guides/${original.id}`}>
            <Eye className="h-4 w-4" />
            Se læser-visning
          </Link>
        </Button>
      </header>

      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground font-semibold">
          Admin · redigér guide
        </p>
        <h1 className="font-serif text-3xl text-foreground">
          {original.plantName}
          {original.variety && (
            <span className="ml-2 text-xl italic text-muted-foreground">
              {original.variety}
            </span>
          )}
        </h1>
      </div>

      {original.flaggedAt && (
        <FlagBanner
          flaggedAt={original.flaggedAt}
          reason={original.flaggedReason ?? null}
          deleteAt={original.deleteAt ?? null}
          asAdmin={isAdmin && !isMaster}
        />
      )}

      {/* ── Ejer-handlinger på private guides ── */}
      {!isMaster && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rediger indhold</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 flex-wrap">
            <UserGuideEditDialog guide={original} />
            <DeleteGuideButton
              guideId={original.id}
              guideTitle={original.plantName}
              isMaster={false}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Admin-handlinger på private guides ── */}
      {!isMaster && isAdmin && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              Moderation
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 flex-wrap">
            <PromoteToMasterButton
              guideId={original.id}
              guideTitle={original.plantName}
            />
            {!original.flaggedAt && (
              <FlagGuideDialog
                guideId={original.id}
                guideTitle={original.plantName}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Admin-handlinger på public master-guides ── */}
      {isMaster && isAdmin && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              Potalot-guide — administration
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 flex-wrap">
            <DeleteGuideButton
              guideId={original.id}
              guideTitle={original.plantName}
              isMaster={true}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Clone for læsere af master-guides — vises kun for almindelige brugere via læser-siden ── */}
      {isMaster && !isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lav din egen tilpasning</CardTitle>
          </CardHeader>
          <CardContent>
            <CloneMasterButton guideId={original.id} />
          </CardContent>
        </Card>
      )}

      {/* ── Kilder (intern reference for moderation) ── */}
      {isAdmin && original.sourceLinks && original.sourceLinks.length > 0 && (
        <Card className="bg-muted/40 border-dashed">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
              Kilder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {original.sourceLinks.map((url, i) => (
                <li key={i} className="text-sm">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </article>
  )
}
