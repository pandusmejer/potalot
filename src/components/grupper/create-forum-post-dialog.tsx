'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MultiImageUpload } from '@/components/ui/multi-image-upload'
import { Plus } from 'lucide-react'
import { createForumPost } from '@/actions/group-forum'
import { FORUM_POST_TYPES, FORUM_CATEGORIES, type ForumPostType, type ForumCategoryId } from '@/lib/constants'

interface Props {
  groupId: string
  /** Hvis sat: nye opslag tagges automatisk med denne sort. */
  initialVarietyId?: string
}

export function CreateForumPostDialog({ groupId, initialVarietyId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [postType, setPostType] = useState<ForumPostType>('question')
  const [category, setCategory] = useState<ForumCategoryId>('generelt')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [images, setImages] = useState<string[]>([])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await createForumPost({
        groupId,
        postType,
        category,
        title: title.trim(),
        body: body.trim() || undefined,
        imageUrls: images.length > 0 ? images : undefined,
        varietyId: initialVarietyId,
      })
      if ('error' in res) { setError(res.error); return }
      setOpen(false)
      setTitle(''); setBody(''); setImages([]); setPostType('question'); setCategory('generelt')
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Nyt opslag
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogTitle>Nyt opslag</DialogTitle>
        <DialogDescription>
          Vælg type og kategori. Andre medlemmer kan svare og markere bedste svar.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <select
                value={postType}
                onChange={e => setPostType(e.target.value as ForumPostType)}
                className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
              >
                {FORUM_POST_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Kategori</Label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ForumCategoryId)}
                className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
              >
                {FORUM_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Titel *</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Fx. Mine chili spirer ikke"
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Beskrivelse</Label>
            <Textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={5}
              placeholder="Beskriv din situation, hvad du har prøvet, etc."
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Billeder (valgfrit)</Label>
            <div className="mt-1.5">
              <MultiImageUpload
                value={images}
                primary={images[0] ?? null}
                onChange={(urls) => setImages(urls)}
                folder="chat"
                maxImages={4}
                label="Tilføj billede"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annullér</Button>
            <Button type="submit" disabled={pending || !title.trim()}>
              {pending ? 'Opretter…' : 'Opret opslag'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
