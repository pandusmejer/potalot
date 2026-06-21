import type { CSSProperties } from 'react'
import type { LucideIcon } from 'lucide-react'
import { CloudRain, Sprout, Sun, Thermometer } from 'lucide-react'

import { cn } from '@/lib/utils'

type WeatherPoolTone = 'rain' | 'soil' | 'temperature' | 'sun'

type WeatherPoolItem = {
  id: string
  icon: LucideIcon
  primary: string
  secondary?: string
  tone: WeatherPoolTone
}

type WeatherPoolVariation = {
  radius: string
  shape: string
  rotate: string
  width: string
  height: string
  compactWidth: string
  compactHeight: string
  shadow: string
  offset?: string
}

const weatherPools: WeatherPoolItem[] = [
  {
    id: 'rain',
    icon: CloudRain,
    primary: '8 mm',
    secondary: 'i nat',
    tone: 'rain',
  },
  {
    id: 'soil',
    icon: Sprout,
    primary: 'Jord',
    secondary: '12°',
    tone: 'soil',
  },
  {
    id: 'temperature',
    icon: Thermometer,
    primary: '14°',
    secondary: '',
    tone: 'temperature',
  },
  {
    id: 'sun',
    icon: Sun,
    primary: 'Sol',
    secondary: '05.15',
    tone: 'sun',
  },
]

const toneVars: Record<WeatherPoolTone, CSSProperties> = {
  rain: {
    '--pool-bg-start': 'rgba(225, 236, 234, 0.34)',
    '--pool-bg-mid': 'rgba(174, 198, 201, 0.22)',
    '--pool-bg-end': 'rgba(118, 150, 156, 0.14)',
    '--pool-ink': '#4a5a4f',
    '--pool-edge': 'rgba(82, 103, 105, 0.15)',
    '--pool-rim': 'rgba(246, 255, 252, 0.72)',
    '--pool-glow': 'rgba(255, 255, 250, 0.78)',
    '--pool-silt': 'rgba(73, 97, 94, 0.055)',
  } as CSSProperties,
  soil: {
    '--pool-bg-start': 'rgba(238, 224, 195, 0.32)',
    '--pool-bg-mid': 'rgba(196, 170, 125, 0.20)',
    '--pool-bg-end': 'rgba(145, 118, 76, 0.13)',
    '--pool-ink': '#5b5638',
    '--pool-edge': 'rgba(119, 94, 58, 0.13)',
    '--pool-rim': 'rgba(255, 247, 226, 0.70)',
    '--pool-glow': 'rgba(255, 252, 235, 0.76)',
    '--pool-silt': 'rgba(118, 88, 46, 0.055)',
  } as CSSProperties,
  temperature: {
    '--pool-bg-start': 'rgba(252, 215, 196, 0.32)',
    '--pool-bg-mid': 'rgba(226, 158, 121, 0.20)',
    '--pool-bg-end': 'rgba(175, 96, 61, 0.13)',
    '--pool-ink': '#945c3e',
    '--pool-edge': 'rgba(151, 82, 51, 0.12)',
    '--pool-rim': 'rgba(255, 236, 223, 0.70)',
    '--pool-glow': 'rgba(255, 244, 235, 0.74)',
    '--pool-silt': 'rgba(141, 70, 42, 0.05)',
  } as CSSProperties,
  sun: {
    '--pool-bg-start': 'rgba(252, 231, 166, 0.32)',
    '--pool-bg-mid': 'rgba(226, 180, 86, 0.20)',
    '--pool-bg-end': 'rgba(170, 124, 36, 0.13)',
    '--pool-ink': '#7d642e',
    '--pool-edge': 'rgba(145, 104, 38, 0.11)',
    '--pool-rim': 'rgba(255, 246, 196, 0.70)',
    '--pool-glow': 'rgba(255, 252, 220, 0.76)',
    '--pool-silt': 'rgba(132, 96, 30, 0.048)',
  } as CSSProperties,
}

const poolVars: Record<WeatherPoolTone, WeatherPoolVariation> = {
  rain: {
    radius: '58% 42% 52% 48% / 44% 53% 47% 56%',
    shape:
      'polygon(3% 48%, 5% 39%, 8% 30%, 15% 21%, 25% 15%, 36% 11%, 49% 9%, 62% 10%, 74% 14%, 84% 21%, 92% 31%, 97% 43%, 98% 54%, 95% 65%, 88% 75%, 77% 84%, 64% 90%, 50% 93%, 36% 91%, 24% 86%, 14% 77%, 7% 66%, 4% 57%)',
    rotate: '-2.5deg',
    width: '320px',
    height: '154px',
    compactWidth: '154px',
    compactHeight: '88px',
    shadow: 'rgba(58, 50, 37, 0.22)',
    offset: '-6px',
  },
  soil: {
    radius: '48% 52% 44% 56% / 52% 44% 56% 48%',
    shape:
      'polygon(5% 43%, 8% 33%, 14% 24%, 23% 17%, 35% 11%, 48% 8%, 61% 9%, 73% 14%, 84% 22%, 92% 33%, 96% 45%, 96% 57%, 91% 69%, 82% 79%, 70% 87%, 56% 92%, 42% 91%, 29% 86%, 18% 78%, 10% 68%, 5% 56%)',
    rotate: '3deg',
    width: '270px',
    height: '148px',
    compactWidth: '142px',
    compactHeight: '90px',
    shadow: 'rgba(73, 57, 36, 0.20)',
    offset: '10px',
  },
  temperature: {
    radius: '54% 46% 49% 51% / 48% 55% 45% 52%',
    shape:
      'polygon(4% 40%, 9% 30%, 17% 22%, 29% 15%, 42% 10%, 55% 9%, 68% 13%, 80% 21%, 90% 32%, 96% 44%, 96% 55%, 92% 66%, 84% 77%, 72% 85%, 58% 90%, 44% 91%, 31% 87%, 20% 79%, 11% 69%, 5% 57%)',
    rotate: '-3.5deg',
    width: '270px',
    height: '135px',
    compactWidth: '144px',
    compactHeight: '82px',
    shadow: 'rgba(91, 54, 37, 0.19)',
    offset: '6px',
  },
  sun: {
    radius: '50% 50% 57% 43% / 50% 45% 55% 50%',
    shape:
      'polygon(4% 45%, 9% 33%, 17% 24%, 29% 17%, 42% 12%, 55% 10%, 68% 12%, 80% 19%, 90% 30%, 96% 42%, 97% 53%, 93% 64%, 85% 75%, 73% 84%, 59% 89%, 45% 90%, 32% 86%, 20% 78%, 11% 68%, 5% 56%)',
    rotate: '2deg',
    width: '285px',
    height: '130px',
    compactWidth: '146px',
    compactHeight: '80px',
    shadow: 'rgba(102, 74, 29, 0.18)',
    offset: '-2px',
  },
}

function poolStyle(tone: WeatherPoolTone, compact: boolean): CSSProperties {
  const variation = poolVars[tone]

  return {
    ...toneVars[tone],
    '--pool-radius': variation.radius,
    '--pool-shape': variation.shape,
    '--pool-rotate': variation.rotate,
    '--pool-w': compact ? variation.compactWidth : variation.width,
    '--pool-h': compact ? variation.compactHeight : variation.height,
    '--pool-shadow': variation.shadow,
    '--pool-offset': compact ? '0px' : variation.offset,
  } as CSSProperties
}

export function WeatherPool({
  item,
  compact = false,
  className,
}: {
  item: WeatherPoolItem
  compact?: boolean
  className?: string
}) {
  const Icon = item.icon

  return (
    <div
      className={cn('weather-pool relative isolate grid place-items-center', compact && 'weather-pool--compact', className)}
      style={poolStyle(item.tone, compact)}
    >
      <div className="relative z-10 flex flex-col items-center justify-center text-center leading-none text-[color:var(--pool-ink)]">
        <Icon
          aria-hidden="true"
          className={cn('mb-1.5 h-6 w-6 stroke-[1.55] opacity-75', compact && 'mb-1 h-[17px] w-[17px]')}
        />
        <span
          className={cn(
            'font-serif text-[34px] font-medium leading-[0.84] tracking-normal',
            compact && 'text-[21px] leading-[0.9]'
          )}
        >
          {item.primary}
        </span>
        {item.secondary ? (
          <span
            className={cn(
              'mt-1 font-serif text-[29px] font-medium leading-[0.86] tracking-normal',
              compact && 'mt-0.5 text-[15px]'
            )}
          >
            {item.secondary}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export function WeatherPools({
  items = weatherPools,
  compact = false,
  className,
}: {
  items?: WeatherPoolItem[]
  compact?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'weather-pools grid grid-cols-2 place-items-center gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-5',
        compact && 'weather-pools--compact gap-2.5 sm:gap-3',
        className
      )}
    >
      {items.map((item) => (
        <WeatherPool key={item.id} item={item} compact={compact} />
      ))}
      <WeatherPoolsStyles />
    </div>
  )
}

export function WeatherPoolsDemo() {
  return (
    <section className="overflow-hidden bg-[#f5eedf] px-5 py-12 text-[#2f382a] sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-xl">
          <h2 className="font-serif text-4xl font-medium leading-none tracking-normal sm:text-5xl">
            Organiske vejr-pools
          </h2>
          <p className="mt-4 max-w-md text-base leading-7 text-[#4f5845] sm:text-lg">
            Små overfladiske pools, der føles som elementer i haven - ikke UI-komponenter.
          </p>
        </div>

        <div className="mt-10 rounded-[42%_58%_44%_56%/58%_45%_55%_42%] bg-[radial-gradient(circle_at_74%_12%,rgba(255,255,245,0.72),transparent_34%),radial-gradient(circle_at_16%_90%,rgba(198,176,126,0.16),transparent_42%)] px-2 py-4 sm:mt-14 sm:px-8 sm:py-10">
          <WeatherPools />
        </div>
      </div>
    </section>
  )
}

function WeatherPoolsStyles() {
  return (
    <style>{`
      .weather-pool {
        width: var(--pool-w);
        height: var(--pool-h);
        margin-top: var(--pool-offset);
        color: var(--pool-ink);
        border-radius: var(--pool-radius);
        transform: rotate(var(--pool-rotate)) translateZ(0);
        background:
          radial-gradient(ellipse at 20% 20%, rgba(255, 255, 255, 0.72), transparent 18%),
          radial-gradient(ellipse at 78% 14%, var(--pool-glow), transparent 27%),
          radial-gradient(ellipse at 42% 38%, rgba(255, 255, 255, 0.18), transparent 45%),
          radial-gradient(ellipse at 45% 84%, var(--pool-silt), transparent 54%),
          linear-gradient(145deg, var(--pool-bg-start) 0%, var(--pool-bg-mid) 48%, var(--pool-bg-end) 100%);
        box-shadow:
          0 22px 24px -18px var(--pool-shadow),
          0 8px 8px -7px rgba(55, 43, 28, 0.24),
          inset 16px 18px 20px rgba(255, 255, 255, 0.38),
          inset -16px -18px 24px var(--pool-edge),
          inset 0 -7px 12px rgba(61, 48, 32, 0.10);
        overflow: hidden;
        backdrop-filter: blur(3px) saturate(1.04);
        -webkit-backdrop-filter: blur(3px) saturate(1.04);
      }

      .weather-pool::before,
      .weather-pool::after {
        position: absolute;
        content: '';
        pointer-events: none;
        border-radius: inherit;
      }

      .weather-pool::before {
        width: 74%;
        height: 54%;
        top: 4%;
        left: 5%;
        border-radius: 62% 38% 58% 42% / 42% 56% 44% 58%;
        background:
          radial-gradient(ellipse at 18% 24%, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.36) 24%, rgba(255, 255, 255, 0) 52%),
          radial-gradient(ellipse at 90% 18%, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0) 42%);
        filter: blur(2px);
        opacity: 0.86;
        transform: rotate(-8deg);
        mix-blend-mode: screen;
      }

      .weather-pool::after {
        inset: 0;
        border-radius: inherit;
        background:
          radial-gradient(circle at 28% 26%, rgba(255, 255, 255, 0.45) 0 1px, transparent 2px),
          radial-gradient(circle at 38% 62%, rgba(255, 255, 255, 0.22) 0 1px, transparent 2px),
          radial-gradient(circle at 58% 30%, rgba(80, 67, 45, 0.08) 0 1px, transparent 2px),
          radial-gradient(circle at 72% 70%, rgba(80, 67, 45, 0.07) 0 1px, transparent 2px),
          radial-gradient(ellipse at 13% 68%, rgba(255, 255, 255, 0.46), transparent 16%),
          radial-gradient(ellipse at 91% 54%, rgba(255, 255, 255, 0.38), transparent 18%);
        box-shadow:
          inset 10px 9px 9px var(--pool-rim),
          inset -10px -12px 16px rgba(70, 55, 34, 0.13),
          inset 0 0 0 1px rgba(255, 255, 255, 0.18);
        opacity: 0.92;
      }

      .weather-pool--compact {
        box-shadow:
          0 14px 18px -14px var(--pool-shadow),
          0 6px 7px -7px rgba(55, 43, 28, 0.22),
          inset 12px 13px 16px rgba(255, 255, 255, 0.34),
          inset -12px -13px 18px var(--pool-edge),
          inset 0 -5px 9px rgba(61, 48, 32, 0.09);
      }

      @media (max-width: 420px) {
        .weather-pools {
          gap: 12px;
        }

        .weather-pool {
          width: min(var(--pool-w), 42vw);
        }
      }

      @media (min-width: 640px) {
        .weather-pool:nth-child(1) {
          transform: rotate(var(--pool-rotate)) translateY(8px);
        }

        .weather-pool:nth-child(2) {
          transform: rotate(var(--pool-rotate)) translateY(-8px);
        }

        .weather-pool:nth-child(3) {
          transform: rotate(var(--pool-rotate)) translateY(18px);
        }

        .weather-pool:nth-child(4) {
          transform: rotate(var(--pool-rotate)) translateY(4px);
        }
      }
    `}</style>
  )
}

export { weatherPools }
