import { Lightbulb } from 'lucide-react'

export default function IdetavlePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Idétavle</h1>
        <p className="text-sm text-muted-foreground">Saml inspiration og idéer til haven</p>
      </div>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Lightbulb className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h2 className="text-lg font-semibold text-foreground">Kommer snart</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Her kan du gemme screenshots, billeder, idéer og noter til inspiration for dine haveprojekter.
        </p>
      </div>
    </div>
  )
}
