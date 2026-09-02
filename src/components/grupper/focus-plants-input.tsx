'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Plus } from 'lucide-react'
import { suggestFocusPlants } from '@/actions/groups'

interface Props {
  value: string[]
  onChange: (next: string[]) => void
  maxItems?: number
  placeholder?: string
}

export function FocusPlantsInput({ value, onChange, maxItems = 5, placeholder = 'Fx Chili' }: Props) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const atMax = value.length >= maxItems

  // Debounced lookup
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([])
      return
    }
    const handle = setTimeout(async () => {
      const res = await suggestFocusPlants(query)
      setSuggestions(res.filter(s => !value.includes(s)).slice(0, 8))
    }, 200)
    return () => clearTimeout(handle)
  }, [query, value])

  // Luk suggestions ved klik udenfor
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function add(name: string) {
    const trimmed = name.trim()
    if (!trimmed || value.includes(trimmed) || atMax) return
    onChange([...value, trimmed])
    setQuery('')
    setSuggestions([])
  }

  function remove(name: string) {
    onChange(value.filter(v => v !== name))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions.length > 0) add(suggestions[0])
      else if (query.trim()) add(query)
    }
  }

  return (
    <div ref={containerRef} className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(p => (
            <span key={p} className="inline-flex items-center gap-1 text-xs bg-secondary/60 px-2.5 py-1 rounded-full">
              {p}
              <button
                type="button"
                onClick={() => remove(p)}
                aria-label={`Fjern ${p}`}
                className="hover:bg-background/40 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {!atMax && (
        <div className="relative">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={e => { setQuery(e.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              autoComplete="off"
              spellCheck={false}
            />
            <Button
              type="button" variant="outline" size="icon"
              onClick={() => query.trim() && add(query)}
              disabled={!query.trim()}
              aria-label="Tilføj"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-card border border-border rounded-lg shadow-md overflow-hidden">
              {suggestions.map(s => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => { add(s); setShowSuggestions(false) }}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent/30"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        {value.length}/{maxItems} plante{value.length === 1 ? '' : 'r'}.
        Skriv et plantenavn — vi foreslår fra dyrkningsguides. Tryk Enter eller + for at tilføje.
      </p>
    </div>
  )
}
