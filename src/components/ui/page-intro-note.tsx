'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  /** Stabilt id pr. intro (fx "froebank"). Bruges som localStorage-nøgle. */
  id: string
  title: string
  body: string
  icon?: React.ReactNode
  /** Skjul efter så mange visninger. Default 7. */
  maxViews?: number
  /**
   * Skjul når brugeren har forstået siden gennem HANDLING (fx ≥5 frø). Har
   * forrang over visnings-tælleren — så introen forsvinder, når den er overflødig.
   */
  hideWhen?: boolean
}

/**
 * PageIntroNote (F6) — en blød, forklarende intro-note øverst på en hovedside.
 * Forklarer VÆRDIEN af siden, instruerer ikke. Ikke modal, blokerer ikke.
 * Vises for nye/tidlige brugere; forsvinder efter maxViews visninger, ved
 * manuel lukning, eller når hideWhen bliver sand.
 *
 * V1: state i localStorage pr. bruger-enhed (ingen DB). Renderer altid null på
 * server → beslutning tages klient-side (ingen hydration-mismatch).
 */
export function PageIntroNote({ id, title, body, icon, maxViews = 7, hideWhen = false }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (hideWhen) return
    try {
      const key = `potalot:intro:${id}`
      const raw = localStorage.getItem(key)
      const state = raw ? JSON.parse(raw) as { views: number; dismissed: boolean } : { views: 0, dismissed: false }
      if (state.dismissed || state.views >= maxViews) return
      localStorage.setItem(key, JSON.stringify({ views: state.views + 1, dismissed: false }))
      setVisible(true)
    } catch {
      // localStorage utilgængelig (privat browsing o.l.) → vis blot ikke.
    }
  }, [id, maxViews, hideWhen])

  function dismiss() {
    try {
      localStorage.setItem(`potalot:intro:${id}`, JSON.stringify({ views: maxViews, dismissed: true }))
    } catch { /* ignorér */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="relative flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/[0.06] px-4 py-3 pr-9">
      {icon && (
        <div className="shrink-0 mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{body}</p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Skjul"
        className="absolute right-2.5 top-2.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
