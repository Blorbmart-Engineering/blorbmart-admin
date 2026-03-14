import { useEffect, useMemo, useState } from 'react'
import { BarChart3, CircleDollarSign, Package } from 'lucide-react'

import { AdminShell } from '@/components/admin/admin-shell'
import { StatGrid } from '@/components/admin/stat-grid'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { chartData, orderStatuses, paymentMethods, recentTransactions, teamMembers } from '@/data/admin'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

function MiniChart({ color, values }: { color: string; values: number[] }) {
  return (
    <div className="flex h-32 items-end gap-2">
      {values.map((value, index) => (
        <div key={`${color}-${index}`} className="flex-1 rounded-t-xl bg-muted/70">
          <div className={cn('w-full rounded-t-xl', color)} style={{ height: `${value}%` }} />
        </div>
      ))}
    </div>
  )
}

export function OverviewPage() {
  const { apiFetchAuth } = useAuth()
  const [metrics, setMetrics] = useState<{ counts: any; last24h: any; approximate: boolean } | null>(null)
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
      { label: 'Total Users', value: counts.users?.toLocaleString?.() || 'â€”', change: `+${last24h.activity || 0} activity` },
      { label: 'Total Sellers', value: counts.vendors?.toLocaleString?.() || 'â€”', change: 'Tracked in vendors list' },
      { label: 'Total Orders', value: counts.orders?.toLocaleString?.() || 'â€”', change: `+${last24h.orders || 0} in 24h` },
      { label: 'Products Listed', value: counts.products?.toLocaleString?.() || 'â€”', change: 'Catalog health' },
      { label: 'Activity Logs', value: counts.activity?.toLocaleString?.() || 'â€”', change: 'Audit trail' },
      { label: 'Sync Status', value: loading ? 'Syncing' : 'Live', change: metrics?.approximate ? 'Approximate counts' : 'Real-time' },
    ]
  }, [metrics, loading])

  const quickStats = useMemo(() => {
    const counts = metrics?.counts || {}
    return [
      { label: 'Users', value: counts.users?.toLocaleString?.() || 'â€”' },
      { label: 'Vendors', value: counts.vendors?.toLocaleString?.() || 'â€”' },
      { label: 'Orders', value: counts.orders?.toLocaleString?.() || 'â€”' },
      { label: 'Products', value: counts.products?.toLocaleString?.() || 'â€”' },
    ]
  }, [metrics])

  return (
    <AdminShell title="Blorbmart marketplace dashboard" subtitle="A cleaner overview with route-based pages instead of one long scroll.">
      <StatGrid stats={overviewStats} />

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Analytics snapshot</CardTitle>
            <CardDescription>Sales, orders, and revenue trends for the week.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-border/60 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <BarChart3 className="size-4 text-primary" />
                Sales graph
              </div>
              <MiniChart color="bg-sky-500" values={chartData.map((item) => item.sales)} />
            </div>
            <div className="rounded-2xl border border-border/60 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Package className="size-4 text-primary" />
                Orders graph
              </div>
              <MiniChart color="bg-violet-500" values={chartData.map((item) => item.orders)} />
            </div>
            <div className="rounded-2xl border border-border/60 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <CircleDollarSign className="size-4 text-primary" />
                Revenue growth
              </div>
              <MiniChart color="bg-emerald-500" values={chartData.map((item) => item.revenue)} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick metrics</CardTitle>
              <CardDescription>Live rollups from the backend metrics endpoint.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {quickStats.map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-2 font-semibold">{item.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status & payments</CardTitle>
              <CardDescription>Common order states and supported payment methods.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {orderStatuses.map((status) => (
                  <Badge key={status} variant="outline">
                    {status}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((method) => (
                  <Badge key={method} variant="secondary">
                    {method}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent transactions</CardTitle>
            <CardDescription>Track disputes, payouts, and order-linked payments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex flex-col gap-3 rounded-2xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{transaction.customer}</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.id} • {transaction.time}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">{transaction.amount}</p>
                  <Badge variant={transaction.status === 'Completed' || transaction.status === 'Paid' ? 'secondary' : 'outline'}>
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team access</CardTitle>
            <CardDescription>Admins currently active on the console.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamMembers.map((member, index) => (
              <div key={member.name}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{member.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <Badge variant="outline">Online</Badge>
                </div>
                {index < teamMembers.length - 1 ? <Separator className="mt-4" /> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}
