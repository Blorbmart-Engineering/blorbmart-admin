import { ArrowUpRight, TrendingUp } from 'lucide-react'

import { cn } from '@/lib/utils'

type Stat = {
  label: string
  value: string
  change: string
}

const PALETTES = [
  {
    gradient: 'from-indigo-500 to-violet-600',
    glow: 'bg-indigo-400/25 dark:bg-indigo-500/30',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-100/70 dark:border-indigo-500/15',
    badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  },
  {
    gradient: 'from-violet-500 to-purple-600',
    glow: 'bg-violet-400/25 dark:bg-violet-500/30',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-100/70 dark:border-violet-500/15',
    badge: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  },
  {
    gradient: 'from-sky-500 to-blue-600',
    glow: 'bg-sky-400/25 dark:bg-sky-500/30',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-100/70 dark:border-sky-500/15',
    badge: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  },
  {
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'bg-emerald-400/25 dark:bg-emerald-500/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-100/70 dark:border-emerald-500/15',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  {
    gradient: 'from-amber-500 to-orange-500',
    glow: 'bg-amber-400/25 dark:bg-amber-500/30',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-100/70 dark:border-amber-500/15',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
  {
    gradient: 'from-rose-500 to-pink-600',
    glow: 'bg-rose-400/25 dark:bg-rose-500/30',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-100/70 dark:border-rose-500/15',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  },
] as const

export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((item, index) => {
        const p = PALETTES[index % PALETTES.length]
        return (
          <div
            key={item.label}
            className={cn(
              'group relative overflow-hidden rounded-2xl border bg-white/65 p-5 shadow-sm backdrop-blur-xl transition-all duration-200 hover:shadow-md dark:bg-white/[0.04]',
              p.border,
            )}
          >
            {/* Glow blob */}
            <div className={cn('pointer-events-none absolute -right-6 -top-6 size-32 rounded-full blur-2xl', p.glow)} />

            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{item.value}</p>
              </div>
              <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg', p.gradient)}>
                <TrendingUp className="size-5 text-white" />
              </div>
            </div>

            <div className={cn('mt-4 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold', p.badge)}>
              <ArrowUpRight className="size-3" />
              {item.change}
            </div>
          </div>
        )
      })}
    </div>
  )
}
