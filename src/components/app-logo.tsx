import { cn } from '@/lib/utils'

type AppLogoProps = {
  dark?: boolean
  compact?: boolean
  className?: string
}

export function AppLogo({ dark = false, compact = false, className }: AppLogoProps) {
  const src = dark ? '/whitelogo.png' : '/blacklogowithname.png'

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <img
        src={src}
        alt="Blorbmart"
        className={cn(compact ? 'h-10 w-auto' : 'h-12 w-auto', 'object-contain')}
      />
      {!compact ? (
        <div>
          <p className={cn('text-sm font-semibold tracking-wide', dark ? 'text-white' : 'text-foreground')}>
            Admin Dashboard
          </p>
          <p className={cn('text-xs', dark ? 'text-slate-300' : 'text-muted-foreground')}>Platform control center</p>
        </div>
      ) : null}
    </div>
  )
}
