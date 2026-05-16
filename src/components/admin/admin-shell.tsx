import { type ReactNode, useState } from 'react'
import { Bell, Menu, Search, X } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'

import { AppLogo } from '@/components/app-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminNavItems } from '@/data/admin'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'

type AdminShellProps = {
  title: string
  subtitle: string
  children: ReactNode
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-indigo-100/70 pb-5 dark:border-white/[0.06]">
        <AppLogo />
        <div className="shrink-0 lg:hidden">
          <ThemeToggle />
        </div>
      </div>
      <nav className="mt-5 space-y-0.5">
        {adminNavItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-muted-foreground hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-white/[0.06] dark:hover:text-foreground',
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}

export function AdminShell({ title, subtitle, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logOut()
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/60 to-slate-100 dark:from-[#07091a] dark:via-[#0b0e28] dark:to-[#07091a]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">

        {/* Desktop sidebar */}
        <aside className="relative hidden overflow-hidden border-r border-indigo-100/80 bg-white/75 backdrop-blur-2xl dark:border-white/[0.06] dark:bg-white/[0.025] lg:block">
          <div className="pointer-events-none absolute -left-16 -top-24 size-64 rounded-full bg-indigo-400/25 blur-3xl dark:bg-indigo-600/25" />
          <div className="pointer-events-none absolute bottom-10 right-0 size-48 rounded-full bg-violet-500/15 blur-3xl dark:bg-violet-700/20" />
          <div className="relative h-full overflow-y-auto p-6">
            <SidebarContent />
          </div>
        </aside>

        {/* Mobile drawer */}
        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative z-10 h-full w-[84%] max-w-xs overflow-hidden border-r border-white/[0.08] bg-white/92 shadow-2xl backdrop-blur-2xl dark:bg-[#0b0e28]/95">
              <div className="pointer-events-none absolute -left-12 -top-16 size-48 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-600/20" />
              <Button variant="ghost" size="icon" className="absolute right-4 top-4 z-10" onClick={() => setMobileOpen(false)}>
                <X className="size-4" />
              </Button>
              <div className="relative h-full overflow-y-auto px-6 py-6 pr-4">
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
              </div>
            </aside>
          </div>
        ) : null}

        {/* Main content */}
        <section className="min-w-0 p-4 sm:p-6 lg:p-8">
          <header className="flex flex-col gap-4 rounded-2xl border border-indigo-100/70 bg-white/70 p-4 shadow-lg shadow-indigo-500/[0.04] backdrop-blur-xl dark:border-white/[0.07] dark:bg-white/[0.035] dark:shadow-none sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <Button variant="outline" size="icon" className="shrink-0 border-indigo-100 dark:border-white/[0.08] lg:hidden" onClick={() => setMobileOpen(true)}>
                  <Menu className="size-4" />
                </Button>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-widest text-indigo-500 dark:text-indigo-400">Admin control center</p>
                  <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
                  <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="w-full border-indigo-100/80 bg-white/60 pl-9 backdrop-blur-sm focus-visible:ring-indigo-400/50 dark:border-white/[0.08] dark:bg-white/[0.04] sm:w-64"
                    placeholder="Search..."
                  />
                </div>
                <div className="hidden lg:block">
                  <ThemeToggle />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 border-indigo-100 bg-white/60 backdrop-blur-sm dark:border-white/[0.08] dark:bg-white/[0.04]"
                >
                  <Bell className="size-4" />
                </Button>
                <div className="flex items-center gap-3 rounded-xl border border-indigo-100/70 bg-white/60 px-3 py-2 backdrop-blur-sm dark:border-white/[0.07] dark:bg-white/[0.04]">
                  <Avatar className="size-9 ring-2 ring-indigo-400/30">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white">
                      {user?.email?.slice(0, 2)?.toUpperCase() || 'BM'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium">{user?.email || 'Admin User'}</p>
                    <p className="text-xs text-muted-foreground">Administrator</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-indigo-100 bg-white/60 backdrop-blur-sm hover:border-indigo-300 hover:bg-indigo-50 dark:border-white/[0.08] dark:bg-white/[0.04]"
                  onClick={handleLogout}
                >
                  Sign out
                </Button>
              </div>
            </div>
          </header>

          <div className="mt-6">{children}</div>
        </section>
      </div>
    </main>
  )
}
