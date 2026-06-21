import { WeatherPools, WeatherPoolsDemo } from '@/components/weather/weather-pools'

export default function WeatherPoolsPreviewPage() {
  return (
    <main className="min-h-screen bg-[#f6f0df]">
      <WeatherPoolsDemo />

      <section className="px-5 pb-16 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-[#6f7355]">
              Hero compact
            </p>
            <h2 className="mt-2 font-serif text-3xl font-medium leading-none text-[#2c3322]">
              Kompakt placering
            </h2>
          </div>

          <div className="relative overflow-hidden rounded-[48%_52%_0_0/18%_16%_0_0] bg-[#f8f1df] px-4 pb-8 pt-10 shadow-[inset_0_18px_30px_rgba(255,255,255,0.5)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(ellipse_at_68%_0%,rgba(255,255,246,0.85),transparent_60%)]" />
            <WeatherPools compact className="relative z-10 mx-auto max-w-[340px] sm:max-w-none" />
          </div>
        </div>
      </section>
    </main>
  )
}
