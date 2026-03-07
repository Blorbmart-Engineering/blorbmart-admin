import { type ReactNode, useState } from 'react'
import { Bell, Menu, Search, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { AppLogo } from '@/components/app-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminNavItems } from '@/data/admin'
import { cn } from '@/lib/utils'

type AdminShellProps = {
  title: string
  subtitle: string
  children: ReactNode
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <AppLogo />
        <div className="shrink-0 lg:hidden">
          <ThemeToggle />
        </div>
      </div>
      <nav className="mt-8 space-y-2">
        {adminNavItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}

export function AdminShell({ title, subtitle, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-border/60 bg-background p-6 lg:block">
          <SidebarContent />
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative z-10 h-full w-[84%] max-w-xs overflow-hidden border-r border-border/60 bg-background/95 shadow-xl backdrop-blur">
              <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={() => setMobileOpen(false)}>
                <X className="size-4" />
              </Button>
              <div className="h-full overflow-y-auto px-6 py-6 pr-4">
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
              </div>
            </aside>
          </div>
        ) : null}

        <section className="min-w-0 p-4 sm:p-6 lg:p-8">
          <header className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-background p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <Button variant="outline" size="icon" className="shrink-0 lg:hidden" onClick={() => setMobileOpen(true)}>
                  <Menu className="size-4" />
                </Button>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Admin control center</p>
                  <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="w-full pl-9 sm:w-72" placeholder="Search..." />
                </div>
                <div className="hidden lg:block">
                  <ThemeToggle />
                </div>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Bell className="size-4" />
                </Button>
                <div className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2">
                  <Avatar className="size-9">
                    <AvatarFallback>BM</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium">Blorbmart Ops</p>
                    <p className="text-muted-foreground">Super Admin</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="mt-6">{children}</div>
        </section>
      </div>
    </main>
  )
}
