import { useEffect, useState } from 'react'

import { AdminShell } from '@/components/admin/admin-shell'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'

type VendorRecord = {
  id: string
  vendorId?: string
  businessName?: string
  ownerName?: string
  email?: string
  phone?: string
  status?: string
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

export function VendorsPage() {
  const { apiFetchAuth } = useAuth()
  const [vendors, setVendors] = useState<VendorRecord[]>([])
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
        const response = await apiFetchAuth('/api/admin/vendors?limit=25')
        if (!response.ok) {
          throw new Error('Failed to load vendors')
        }
        const payload = await response.json()
        if (!active) return
        setVendors(payload?.data?.vendors || [])
        setNextCursor(payload?.data?.nextCursor || null)
      } catch (err: any) {
        if (!active) return
        setError(err?.message || 'Failed to load vendors')
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
      const response = await apiFetchAuth(`/api/admin/vendors?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to load more vendors')
      }
      const payload = await response.json()
      setVendors((prev) => [...prev, ...(payload?.data?.vendors || [])])
      setNextCursor(payload?.data?.nextCursor || null)
    } catch (err: any) {
      setError(err?.message || 'Failed to load more vendors')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <AdminShell title="Vendors" subtitle="All registered sellers and storefronts.">
      <Card>
        <CardHeader>
          <CardTitle>Vendor Directory</CardTitle>
          <CardDescription>Showing the most recent vendors from Firestore.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading vendors...</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {!loading && !error ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground">
                    <th className="py-3 pr-4 font-medium">Business</th>
                    <th className="py-3 pr-4 font-medium">Owner</th>
                    <th className="py-3 pr-4 font-medium">Email</th>
                    <th className="py-3 pr-4 font-medium">Phone</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((vendor) => (
                    <tr key={vendor.id} className="border-b border-border/40">
                      <td className="py-3 pr-4">{vendor.businessName || vendor.vendorId || '—'}</td>
                      <td className="py-3 pr-4">{vendor.ownerName || '—'}</td>
                      <td className="py-3 pr-4">{vendor.email || '—'}</td>
                      <td className="py-3 pr-4">{vendor.phone || '—'}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={vendor.status === 'active' ? 'secondary' : 'outline'}>
                          {vendor.status || 'unknown'}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">{formatDate(vendor.createdAt)}</td>
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
