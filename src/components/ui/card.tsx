import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Kort-varianter — beholdere med forskellig form og dybde,
 * så skærme kan bygges varieret (papir / løftet fane / flad
 * note / tonet modul / markant farveblok) i stedet for ens
 * hvide bokse. hero/feature er fyldte sæson-farveflader.
 */
const cardVariants = cva('transition-shadow', {
  variants: {
    variant: {
      // Standard: roligt papir med varm, blød dybde
      default: 'rounded-2xl border border-border bg-card text-card-foreground shadow-soft',
      // Løftet: ligger ovenpå/forskudt — "fane" der inviterer
      elevated: 'rounded-[1.75rem] border border-transparent bg-card text-card-foreground shadow-lift',
      // Flad: stille, ingen skygge — hairline
      flat: 'rounded-2xl border border-border bg-card text-card-foreground',
      // Nestet/sekundært panel i lagdelt tone
      surface: 'rounded-xl border border-transparent bg-surface-2 text-card-foreground shadow-soft',
      // Tonet modul — sæsonens bløde flade
      accent: 'rounded-2xl border border-transparent bg-secondary text-secondary-foreground shadow-soft',
      // Markant farveblok — fyldt primær-flade, hvid tekst
      hero: 'rounded-2xl border border-transparent surface-band shadow-lift',
      // Varm highlight-blok — accent-flade m. overgang
      feature: 'rounded-2xl border border-transparent surface-feature shadow-lift',
      // Roligere tonet farveblok — sekundær m. dybde
      tonal: 'rounded-2xl border border-transparent surface-tonal shadow-soft',
      // Palette-pop: solgul flad blok (mørk tekst)
      sun: 'rounded-2xl border border-transparent bg-[var(--block-sun)] text-[var(--foreground)] shadow-soft',
      // Palette-pop: frisk/lime flad blok (mørk tekst)
      fresh: 'rounded-2xl border border-transparent bg-[var(--block-fresh)] text-[var(--foreground)] shadow-soft',
    },
  },
  defaultVariants: { variant: 'default' },
})

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props} />
  )
)
Card.displayName = 'Card'

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-5 pb-2', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-serif text-lg leading-tight text-foreground', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
)
CardDescription.displayName = 'CardDescription'

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5 pt-2', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-5 pt-2', className)} {...props} />
  )
)
CardFooter.displayName = 'CardFooter'

export { cardVariants }
