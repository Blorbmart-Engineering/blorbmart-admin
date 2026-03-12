import { useEffect, useState } from 'react'

import { AdminShell } from '@/components/admin/admin-shell'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  const [nextCursor, setNextCursor] = useState<{ cursorId: string; cursorCreatedAt: number | null } | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await apiFetchAuth('/api/admin/activity?limit=25')
        if (!response.ok) {
          throw new Error('Failed to load activity')
        }
        const payload = await response.json()
        if (!active) return
        setActivity(payload?.data?.activity || [])
        setNextCursor(payload?.data?.nextCursor || null)
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
  }, [apiFetchAuth])

  const handleLoadMore = async () => {
    if (!nextCursor) return
    setLoadingMore(true)
    try {
      const params = new URLSearchParams({
        limit: '25',
        cursorId: nextCursor.cursorId,
        cursorCreatedAt: String(nextCursor.cursorCreatedAt || '')
      })
      const response = await apiFetchAuth(`/api/admin/activity?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to load more activity')
      }
      const payload = await response.json()
      setActivity((prev) => [...prev, ...(payload?.data?.activity || [])])
      setNextCursor(payload?.data?.nextCursor || null)
    } catch (err: any) {
      setError(err?.message || 'Failed to load more activity')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <AdminShell title="Activity" subtitle="All user and system activity logs.">
      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
          <CardDescription>Recent actions across the platform.</CardDescription>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {!loading && !error && nextCursor ? (
            <div className="mt-4">
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </AdminShell>
  )
}
