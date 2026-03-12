import { useEffect, useState } from 'react'

import { AdminShell } from '@/components/admin/admin-shell'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'

type UserRecord = {
  id: string
  uid?: string
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  role?: string
  accountStatus?: string
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

export function UsersPage() {
  const { apiFetchAuth } = useAuth()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [nextCursor, setNextCursor] = useState<{ cursorId: string; cursorCreatedAt: number | null } | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await apiFetchAuth('/api/admin/users?limit=25')
        if (!response.ok) {
          throw new Error('Failed to load users')
        }
        const payload = await response.json()
        if (!active) return
        setUsers(payload?.data?.users || [])
        setNextCursor(payload?.data?.nextCursor || null)
      } catch (err: any) {
        if (!active) return
        setError(err?.message || 'Failed to load users')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [apiFetchAuth])

  const applyAction = async (userId: string, action: string, options: { reason?: string; durationDays?: number } = {}) => {
    setActionLoading(`${userId}:${action}`)
    try {
      const response = await apiFetchAuth(`/api/admin/users/${userId}/action`, {
        method: 'PATCH',
        body: JSON.stringify({ action, ...options })
      })
      if (!response.ok) {
        throw new Error('Failed to apply action')
      }
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, accountStatus: action } : user))
      )
    } catch (err: any) {
      setError(err?.message || 'Failed to apply action')
    } finally {
      setActionLoading(null)
    }
  }

  const handleWarn = (userId: string) => {
    const reason = window.prompt('Warn reason (optional):') || ''
    applyAction(userId, 'warn', { reason })
  }

  const handleSuspend = (userId: string) => {
    const reason = window.prompt('Suspend reason (optional):') || ''
    applyAction(userId, 'suspend', { reason })
  }

  const handleBan = (userId: string) => {
    const reason = window.prompt('Ban reason (optional):') || ''
    const days = window.prompt('Ban duration in days (leave empty for indefinite):') || ''
    const durationDays = days ? Number(days) : undefined
    applyAction(userId, 'ban', { reason, durationDays })
  }

  const handleDisable = (userId: string) => {
    const reason = window.prompt('Disable reason (optional):') || ''
    applyAction(userId, 'disable', { reason })
  }

  const handleDelete = (userId: string) => {
    if (!window.confirm('Delete this user? This will disable access.')) return
    const reason = window.prompt('Delete reason (optional):') || ''
    applyAction(userId, 'delete', { reason })
  }

  const handleLoadMore = async () => {
    if (!nextCursor) return
    setLoadingMore(true)
    try {
      const params = new URLSearchParams({
        limit: '25',
        cursorId: nextCursor.cursorId,
        cursorCreatedAt: String(nextCursor.cursorCreatedAt || '')
      })
      const response = await apiFetchAuth(`/api/admin/users?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to load more users')
      }
      const payload = await response.json()
      setUsers((prev) => [...prev, ...(payload?.data?.users || [])])
      setNextCursor(payload?.data?.nextCursor || null)
    } catch (err: any) {
      setError(err?.message || 'Failed to load more users')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <AdminShell title="Users" subtitle="All registered buyers and vendors.">
      <Card>
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>Showing the most recent users from Firestore.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading users...</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {!loading && !error ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground">
                    <th className="py-3 pr-4 font-medium">Name</th>
                    <th className="py-3 pr-4 font-medium">Email</th>
                    <th className="py-3 pr-4 font-medium">Phone</th>
                    <th className="py-3 pr-4 font-medium">Role</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Created</th>
                    <th className="py-3 pr-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || '—'
                    const actionKey = `${user.id}`
                    return (
                      <tr key={user.id} className="border-b border-border/40">
                        <td className="py-3 pr-4">{name}</td>
                        <td className="py-3 pr-4">{user.email || '—'}</td>
                        <td className="py-3 pr-4">{user.phone || '—'}</td>
                        <td className="py-3 pr-4">{user.role || '—'}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={user.accountStatus === 'active' ? 'secondary' : 'outline'}>
                            {user.accountStatus || 'unknown'}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">{formatDate(user.createdAt)}</td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleWarn(user.id)}
                              disabled={actionLoading?.startsWith(actionKey)}
                            >
                              Warn
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSuspend(user.id)}
                              disabled={actionLoading?.startsWith(actionKey)}
                            >
                              Suspend
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBan(user.id)}
                              disabled={actionLoading?.startsWith(actionKey)}
                            >
                              Ban
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDisable(user.id)}
                              disabled={actionLoading?.startsWith(actionKey)}
                            >
                              Disable
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(user.id)}
                              disabled={actionLoading?.startsWith(actionKey)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
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
