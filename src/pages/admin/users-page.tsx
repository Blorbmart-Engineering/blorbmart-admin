import { useEffect, useMemo, useState } from 'react'

import { AdminShell } from '@/components/admin/admin-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'

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
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [role, setRole] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 25
  const [hasMore, setHasMore] = useState(false)

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
        if (status !== 'all') params.set('status', status)
        if (role !== 'all') params.set('role', role)
        if (dateFrom) params.set('dateFrom', dateFrom)
        if (dateTo) params.set('dateTo', dateTo)

        const response = await apiFetchAuth(`/api/admin/users?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to load users')
        }
        const payload = await response.json()
        if (!active) return
        setUsers(payload?.data?.users || [])
        setHasMore(Boolean(payload?.data?.pagination?.hasMore))
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
  }, [apiFetchAuth, page, query, status, role, dateFrom, dateTo])

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
      const statusMap: Record<string, string> = {
        warn: 'active',
        suspend: 'suspended',
        ban: 'banned',
        disable: 'disabled',
        delete: 'deleted',
        enable: 'active'
      }
      const nextStatus = statusMap[action] || action
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, accountStatus: nextStatus } : user))
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

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        limit: '1000',
        q: query || ''
      })
      if (status !== 'all') params.set('status', status)
      if (role !== 'all') params.set('role', role)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const response = await apiFetchAuth(`/api/admin/users/export?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to export users')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `users-export-${Date.now()}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err?.message || 'Failed to export users')
    }
  }

  const toolbarStatus = useMemo(() => (status === 'all' ? 'All' : status), [status])

  return (
    <AdminShell title="Users" subtitle="All registered buyers and vendors.">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
          <CardDescription>Find users by email, phone, role, or status.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="user-search">Search</Label>
            <Input id="user-search" placeholder="Email, phone, name, or ID" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
              <option value="disabled">Disabled</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={role}
              onChange={(e) => { setRole(e.target.value); setPage(1); }}
            >
              <option value="all">All roles</option>
              <option value="buyer">Buyer</option>
              <option value="vendor">Vendor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Date range</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
              <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" onClick={() => { setQuery(''); setStatus('all'); setRole('all'); setDateFrom(''); setDateTo(''); setPage(1); }}>
              Reset
            </Button>
            <Button onClick={handleExport}>Export CSV</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>Showing {toolbarStatus.toLowerCase()} users with active filters.</CardDescription>
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
                              variant="secondary"
                              onClick={() => setSelectedUser(user)}
                            >
                              View
                            </Button>
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
          {!loading && !error ? (
            <div className="mt-4 flex items-center justify-between text-sm">
              <Button variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                Previous
              </Button>
              <span className="text-muted-foreground">Page {page}</span>
              <Button variant="ghost" onClick={() => setPage((p) => p + 1)} disabled={!hasMore}>
                Next
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {selectedUser ? (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setSelectedUser(null)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-background p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">User Detail</h2>
                <p className="text-sm text-muted-foreground">ID: {selectedUser.id}</p>
              </div>
              <Button variant="ghost" onClick={() => setSelectedUser(null)}>Close</Button>
            </div>
            <div className="mt-6 grid gap-4">
              {[
                ['Name', [selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(' ') || '—'],
                ['Email', selectedUser.email || '—'],
                ['Phone', selectedUser.phone || '—'],
                ['Role', selectedUser.role || '—'],
                ['Status', selectedUser.accountStatus || '—'],
                ['Created', formatDate(selectedUser.createdAt)]
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
