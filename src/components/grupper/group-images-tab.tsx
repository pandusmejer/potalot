import Link from 'next/link'
import { ImageIcon } from 'lucide-react'
import type { GroupImage } from '@/actions/group-content'

interface Props {
  groupId: string
  images: GroupImage[]
}

function venligTid(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function GroupImagesTab({ groupId, images }: Props) {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-8 gap-2">
        <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Ingen billeder endnu. Når medlemmer vedhæfter fotos i forum-opslag eller -svar, dukker de op her.
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">
        {images.length} billede{images.length === 1 ? '' : 'r'} · klik et billede for at åbne forum-opslaget
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {images.map((img, idx) => (
          <Link
            key={`${img.url}-${idx}`}
            href={`/grupper/${groupId}/opslag/${img.postId}`}
            className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-muted block"
            title={`${img.postTitle} — ${img.authorLabel}, ${venligTid(img.createdAt)}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.postTitle}
              loading="lazy"
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors" />
            <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[10px] text-white line-clamp-1 font-medium">{img.postTitle}</p>
              <p className="text-[9px] text-white/80 line-clamp-1">{img.authorLabel}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
