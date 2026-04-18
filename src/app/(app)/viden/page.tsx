export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Users, Sparkles, ArrowRight } from 'lucide-react'

export default async function VidenPage() {
  const supabase = await createClient()
  const { count: guidesCount } = await supabase
    .from('plant_guides')
    .select('*', { count: 'exact', head: true })

  const sections = [
    {
      href: '/guides',
      title: 'Dyrkningsguides',
      description: 'Dybe guides per sort med kalender, pasning og typiske fejl.',
      icon: BookOpen,
      count: guidesCount ?? 0,
      countLabel: 'guides',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      href: '/community',
      title: 'Community',
      description: 'Tips og spørgsmål mellem ligesindede dyrkere.',
      icon: Users,
      count: null,
      countLabel: null,
      color: 'text-blue-700 bg-blue-50 border-blue-200',
    },
    {
      href: '/ai',
      title: 'AI-rådgiver',
      description: 'Stil spørgsmål om dine planter — eller bare om havelivet.',
      icon: Sparkles,
      count: null,
      countLabel: null,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Viden</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Guides, fællesskab og AI — alt det der hjælper dig med at lære mere.
        </p>
      </div>

      <div className="grid gap-3">
        {sections.map(section => {
          const Icon = section.icon
          return (
            <Link
              key={section.href}
              href={section.href}
              className={`flex items-center gap-4 p-4 rounded-xl border ${section.color} transition-colors hover:opacity-90`}
            >
              <Icon className="h-6 w-6 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{section.title}</h2>
                  {section.count != null && (
                    <span className="text-xs opacity-70">
                      ({section.count} {section.countLabel})
                    </span>
                  )}
                </div>
                <p className="text-sm opacity-80 mt-0.5">{section.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 opacity-60" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
