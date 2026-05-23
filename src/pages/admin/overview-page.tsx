import { useEffect, useMemo, useState } from 'react'
import { BarChart3, CircleDollarSign, Package, Zap } from 'lucide-react'

import { AdminShell } from '@/components/admin/admin-shell'
import { StatGrid } from '@/components/admin/stat-grid'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { chartData, orderStatuses, paymentMethods, recentTransactions, teamMembers } from '@/data/admin'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const TEAM_GRADIENTS = [
  'from-indigo-500 to-violet-600',
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-teal-600',
]

function MiniChart({ gradient, values, label }: { gradient: string; values: number[]; label: string }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const max = Math.max(...values)
  return (
    <div className="space-y-2">
      <div className="flex h-24 items-end gap-1.5">
        {values.map((value, index) => (
          <div key={`${label}-${index}`} className="relative flex flex-1 flex-col">
            <div className="absolute inset-x-0 bottom-0 rounded-t-md bg-muted/50" style={{ height: '100%' }} />
            <div
              className={cn('absolute inset-x-0 bottom-0 rounded-t-md bg-gradient-to-t opacity-90 transition-all', gradient)}
              style={{ height: `${(value / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        {days.map((day, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
    </div>
  )
}

function TransactionBadge({ status }: { status: string }) {
  if (status === 'Completed' || status === 'Paid') {
    return (
      <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
        {status}
      </span>
    )
  }
  if (status === 'Dispute') {
    return (
      <span className="inline-flex items-center rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-400">
        {status}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
      {status}
    </span>
  )
}

const glassCard = 'border-indigo-100/60 bg-white/60 backdrop-blur-xl dark:border-white/[0.06] dark:bg-white/[0.03]'

export function OverviewPage() {
  const { apiFetchAuth } = useAuth()
  const [metrics, setMetrics] = useState<{ counts: Record<string, number>; last24h: Record<string, number>; approximate: boolean } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const response = await apiFetchAuth('/api/admin/metrics')
        if (!response.ok) throw new Error('Failed to load metrics')
        const payload = await response.json()
        if (!active) return
        setMetrics(payload?.data || null)
      } catch {
        if (!active) return
        setMetrics(null)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [apiFetchAuth])

  const overviewStats = useMemo(() => {
    const counts = metrics?.counts || {}
    const last24h = metrics?.last24h || {}
    return [
      { label: 'Total Users', value: counts.users?.toLocaleString?.() || '—', change: `+${last24h.activity || 0} activity` },
      { label: 'Total Sellers', value: counts.vendors?.toLocaleString?.() || '—', change: 'Tracked in vendors list' },
      { label: 'Total Orders', value: counts.orders?.toLocaleString?.() || '—', change: `+${last24h.orders || 0} in 24h` },
      { label: 'Products Listed', value: counts.products?.toLocaleString?.() || '—', change: 'Catalog health' },
      { label: 'Activity Logs', value: counts.activity?.toLocaleString?.() || '—', change: 'Audit trail' },
      { label: 'Sync Status', value: loading ? 'Syncing' : 'Live', change: metrics?.approximate ? 'Approximate counts' : 'Real-time' },
    ]
  }, [metrics, loading])

  const quickStats = useMemo(() => {
    const counts = metrics?.counts || {}
    return [
      { label: 'Users', value: counts.users?.toLocaleString?.() || '—' },
      { label: 'Vendors', value: counts.vendors?.toLocaleString?.() || '—' },
      { label: 'Orders', value: counts.orders?.toLocaleString?.() || '—' },
      { label: 'Products', value: counts.products?.toLocaleString?.() || '—' },
    ]
  }, [metrics])

  return (
    <AdminShell title="Blorbmart marketplace dashboard" subtitle="Live metrics, analytics, and platform health at a glance.">
      <StatGrid stats={overviewStats} />

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Analytics */}
        <Card className={glassCard}>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/30">
                <BarChart3 className="size-4 text-white" />
              </div>
              <div>
                <CardTitle>Analytics snapshot</CardTitle>
                <CardDescription>Sales, orders & revenue — this week.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-indigo-100/60 bg-gradient-to-br from-white/80 to-indigo-50/40 p-4 dark:border-white/[0.06] dark:from-white/[0.04] dark:to-indigo-500/5">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <BarChart3 className="size-4 text-indigo-500" />
                Sales
              </div>
              <MiniChart label="sales" gradient="from-indigo-400 to-violet-500" values={chartData.map((item) => item.sales)} />
            </div>
            <div className="rounded-2xl border border-violet-100/60 bg-gradient-to-br from-white/80 to-violet-50/40 p-4 dark:border-white/[0.06] dark:from-white/[0.04] dark:to-violet-500/5">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Package className="size-4 text-violet-500" />
                Orders
              </div>
              <MiniChart label="orders" gradient="from-violet-400 to-purple-500" values={chartData.map((item) => item.orders)} />
            </div>
            <div className="rounded-2xl border border-emerald-100/60 bg-gradient-to-br from-white/80 to-emerald-50/40 p-4 dark:border-white/[0.06] dark:from-white/[0.04] dark:to-emerald-500/5">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <CircleDollarSign className="size-4 text-emerald-500" />
                Revenue
              </div>
              <MiniChart label="revenue" gradient="from-emerald-400 to-teal-500" values={chartData.map((item) => item.revenue)} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Quick metrics */}
          <Card className={glassCard}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 shadow-md shadow-sky-500/30">
                  <Zap className="size-4 text-white" />
                </div>
                <div>
                  <CardTitle>Quick metrics</CardTitle>
                  <CardDescription>Live from the backend.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {quickStats.map((item, i) => {
                const colors = ['text-indigo-600 dark:text-indigo-400', 'text-violet-600 dark:text-violet-400', 'text-sky-600 dark:text-sky-400', 'text-emerald-600 dark:text-emerald-400']
                return (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-indigo-100/50 bg-white/50 px-4 py-3 dark:border-white/[0.05] dark:bg-white/[0.03]">
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className={cn('text-lg font-bold', colors[i % colors.length])}>{item.value}</p>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Status & payments */}
          <Card className={glassCard}>
            <CardHeader className="pb-3">
              <CardTitle>Status & payments</CardTitle>
              <CardDescription>Order states and supported payment methods.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {orderStatuses.map((status) => (
                  <span key={status} className="inline-flex items-center rounded-lg border border-indigo-100 bg-indigo-50/60 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-indigo-300">
                    {status}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {paymentMethods.map((method) => (
                  <span key={method} className="inline-flex items-center rounded-lg border border-violet-100 bg-violet-50/60 px-2.5 py-1 text-xs font-medium text-violet-700 dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-violet-300">
                    {method}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        {/* Recent transactions */}
        <Card className={glassCard}>
          <CardHeader className="pb-4">
            <CardTitle>Recent transactions</CardTitle>
            <CardDescription>Disputes, payouts, and order-linked payments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex flex-col gap-3 rounded-xl border border-indigo-100/50 bg-white/50 p-4 transition-colors hover:bg-white/70 dark:border-white/[0.05] dark:bg-white/[0.03] dark:hover:bg-white/[0.05] sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">{transaction.customer}</p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.id} · {transaction.time}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-foreground">{transaction.amount}</p>
                  <TransactionBadge status={transaction.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Team access */}
        <Card className={glassCard}>
          <CardHeader className="pb-4">
            <CardTitle>Team access</CardTitle>
            <CardDescription>Admins currently active on the console.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamMembers.map((member, index) => (
              <div key={member.name}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="ring-2 ring-white/50 dark:ring-white/10">
                      <AvatarFallback className={cn('bg-gradient-to-br text-xs font-semibold text-white', TEAM_GRADIENTS[index % TEAM_GRADIENTS.length])}>
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Online
                  </span>
                </div>
                {index < teamMembers.length - 1 ? <Separator className="mt-4 dark:bg-white/[0.05]" /> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}
