import { useEffect, useMemo, useState } from 'react'

import { AdminShell } from '@/components/admin/admin-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'

type ActivityRecord = {
  id: string
  type?: string
  actorType?: string
  actorId?: string
  targetType?: string
  targetId?: string
  message?: string
  createdAt?: any
}

function formatDate(value: any) {
  if (!value) return '—'
  if (typeof value.toDate === 'function') {
    return value.toDate().toLocaleString()
  }
  if (typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000).toLocaleString()
  }
  if (typeof value._seconds === 'number') {
    return new Date(value._seconds * 1000).toLocaleString()
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

export function ActivityPage() {
  const { apiFetchAuth } = useAuth()
  const [activity, setActivity] = useState<ActivityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedItem, setSelectedItem] = useState<ActivityRecord | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [hasMore, setHasMore] = useState(false)
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [actorType, setActorType] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams({
          limit: String(pageSize),
          page: String(page),
          q: query || ''
        })
        if (type !== 'all') params.set('type', type)
        if (actorType !== 'all') params.set('actorType', actorType)
        if (dateFrom) params.set('dateFrom', dateFrom)
        if (dateTo) params.set('dateTo', dateTo)
        const response = await apiFetchAuth(`/api/admin/activity?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to load activity')
        }
        const payload = await response.json()
        if (!active) return
        setActivity(payload?.data?.activity || [])
        setHasMore(Boolean(payload?.data?.pagination?.hasMore))
      } catch (err: any) {
        if (!active) return
        setError(err?.message || 'Failed to load activity')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [apiFetchAuth, page, pageSize, query, type, actorType, dateFrom, dateTo])

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        limit: '1000',
        q: query || ''
      })
      if (type !== 'all') params.set('type', type)
      if (actorType !== 'all') params.set('actorType', actorType)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const response = await apiFetchAuth(`/api/admin/activity/export?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to export activity')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `activity-export-${Date.now()}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err?.message || 'Failed to export activity')
    }
  }

  const toolbarType = useMemo(() => (type === 'all' ? 'All' : type), [type])

  return (
    <AdminShell title="Activity" subtitle="All user and system activity logs.">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
          <CardDescription>Filter activity by type, actor, or date.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="activity-search">Search</Label>
            <Input id="activity-search" placeholder="Message, actor, target, ID" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Input placeholder="e.g. user_suspend" value={type === 'all' ? '' : type} onChange={(e) => { setType(e.target.value || 'all'); setPage(1); }} />
          </div>
          <div className="space-y-2">
            <Label>Actor Type</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={actorType}
              onChange={(e) => { setActorType(e.target.value); setPage(1); }}
            >
              <option value="all">All actors</option>
              <option value="admin">Admin</option>
              <option value="system">System</option>
              <option value="user">User</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" onClick={() => { setQuery(''); setType('all'); setActorType('all'); setDateFrom(''); setDateTo(''); setPage(1); }}>
              Reset
            </Button>
            <Button onClick={handleExport}>Export CSV</Button>
          </div>
        </CardContent>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr]">
          <div className="space-y-2">
            <Label>Date range</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
              <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
          <CardDescription>Showing {toolbarType.toLowerCase()} events with active filters.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading activity...</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {!loading && !error ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground">
                    <th className="py-3 pr-4 font-medium">Type</th>
                    <th className="py-3 pr-4 font-medium">Actor</th>
                    <th className="py-3 pr-4 font-medium">Target</th>
                    <th className="py-3 pr-4 font-medium">Message</th>
                    <th className="py-3 pr-4 font-medium">Time</th>
                    <th className="py-3 pr-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((item) => (
                    <tr key={item.id} className="border-b border-border/40">
                      <td className="py-3 pr-4">
                        <Badge variant="outline">{item.type || '—'}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {(item.actorType || 'user') + (item.actorId ? `:${item.actorId}` : '')}
                      </td>
                      <td className="py-3 pr-4">
                        {(item.targetType || '—') + (item.targetId ? `:${item.targetId}` : '')}
                      </td>
                      <td className="py-3 pr-4">{item.message || '—'}</td>
                      <td className="py-3 pr-4">{formatDate(item.createdAt)}</td>
                      <td className="py-3 pr-4">
                        <Button size="sm" variant="secondary" onClick={() => setSelectedItem(item)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {!loading && !error ? (
            <div className="mt-4 flex items-center justify-between text-sm">
              <button
                type="button"
                className="font-medium text-primary disabled:text-muted-foreground"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </button>
              <span className="text-muted-foreground">Page {page}</span>
              <button
                type="button"
                className="font-medium text-primary disabled:text-muted-foreground"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore}
              >
                Next
              </button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {selectedItem ? (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setSelectedItem(null)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-background p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Activity Detail</h2>
                <p className="text-sm text-muted-foreground">ID: {selectedItem.id}</p>
              </div>
              <Button variant="ghost" onClick={() => setSelectedItem(null)}>Close</Button>
            </div>
            <div className="mt-6 grid gap-4">
              {[
                ['Type', selectedItem.type || '—'],
                ['Actor', `${selectedItem.actorType || '—'}${selectedItem.actorId ? `:${selectedItem.actorId}` : ''}`],
                ['Target', `${selectedItem.targetType || '—'}${selectedItem.targetId ? `:${selectedItem.targetId}` : ''}`],
                ['Message', selectedItem.message || '—'],
                ['Time', formatDate(selectedItem.createdAt)]
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border/60 p-4">
                  <p className="text-xs uppercase text-muted-foreground">{label}</p>
                  <p className="mt-2 font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  )
}
