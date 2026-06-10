import { useEffect, useMemo, useState } from 'react'

import { AdminShell } from '@/components/admin/admin-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'

type VendorRecord = {
  id: string
  vendorId?: string
  userId?: string
  uid?: string
  businessName?: string
  ownerName?: string
  email?: string
  phone?: string
  status?: string
  sellerType?: 'normal' | 'food' | string
  createdAt?: unknown
}

function formatDate(value: unknown): string {
  if (!value) return '—'
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>
    if (typeof obj.toDate === 'function') return (obj.toDate as () => Date)().toLocaleString()
    if (typeof obj.seconds === 'number') return new Date(obj.seconds * 1000).toLocaleString()
    if (typeof obj._seconds === 'number') return new Date(obj._seconds * 1000).toLocaleString()
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
  }
  return '—'
}

export function VendorsPage() {
  const { apiFetchAuth } = useAuth()
  const [vendors, setVendors] = useState<VendorRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedVendor, setSelectedVendor] = useState<VendorRecord | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [vendorToDelete, setVendorToDelete] = useState<VendorRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [sellerType, setSellerType] = useState('all')
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
        if (sellerType !== 'all') params.set('sellerType', sellerType)
        if (dateFrom) params.set('dateFrom', dateFrom)
        if (dateTo) params.set('dateTo', dateTo)

        const response = await apiFetchAuth(`/api/admin/vendors?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to load vendors')
        }
        const payload = await response.json()
        if (!active) return
        
        // Fetch additional user data for each vendor to get complete profile
        const vendors = payload?.data?.vendors || []
        const enrichedVendors = await Promise.all(
          vendors.map(async (vendor: VendorRecord) => {
            try {
              const userLookupId = vendor.userId || vendor.uid || vendor.id
              // Try to get user data to fill missing fields
              const userResponse = await apiFetchAuth(`/api/admin/users/${userLookupId}`)
              if (userResponse.ok) {
                const userData = await userResponse.json()
                const user = userData?.data
                return {
                  ...vendor,
                  ownerName: vendor.ownerName || user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.displayName || '—',
                  email: vendor.email || user?.email || '—',
                  phone: vendor.phone || user?.phone || '—',
                }
              }
            } catch {
              // If user fetch fails, return vendor as-is
            }
            return vendor
          })
        )
        
        setVendors(enrichedVendors)
        setHasMore(Boolean(payload?.data?.pagination?.hasMore))
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Failed to load vendors')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [apiFetchAuth, page, query, status, sellerType, dateFrom, dateTo])

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        limit: '1000',
        q: query || ''
      })
      if (status !== 'all') params.set('status', status)
      if (sellerType !== 'all') params.set('sellerType', sellerType)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const response = await apiFetchAuth(`/api/admin/vendors/export?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to export vendors')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `vendors-export-${Date.now()}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export vendors')
    }
  }

  const handleDeleteVendor = async () => {
    if (!vendorToDelete?.id) return
    setDeleting(true)
    try {
      const response = await apiFetchAuth(`/api/admin/vendors/${vendorToDelete.id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error('Failed to delete vendor')
      }
      setVendors((prev) => prev.filter((v) => v.id !== vendorToDelete.id))
      setSelectedVendor((prev) => (prev && prev.id === vendorToDelete.id ? null : prev))
      setVendorToDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete vendor')
    } finally {
      setDeleting(false)
    }
  }

  const toolbarStatus = useMemo(() => (status === 'all' ? 'All' : status), [status])

  const updateVendorStatus = async (vendor: VendorRecord, nextStatus: string) => {
    if (!vendor?.id) return
    setUpdatingStatus(true)
    try {
      const response = await apiFetchAuth(`/api/admin/vendors/${vendor.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      })
      if (!response.ok) {
        throw new Error('Failed to update vendor status')
      }
      setVendors((prev) => prev.map((v) => (v.id === vendor.id ? { ...v, status: nextStatus } : v)))
      setSelectedVendor((prev) => (prev && prev.id === vendor.id ? { ...prev, status: nextStatus } : prev))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update vendor status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <AdminShell title="Vendors" subtitle="All registered sellers and storefronts.">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
          <CardDescription>Find vendors by business name, owner, or status.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="vendor-search">Search</Label>
            <Input id="vendor-search" placeholder="Business, owner, email, phone" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
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
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Seller type</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={sellerType}
              onChange={(e) => { setSellerType(e.target.value); setPage(1); }}
            >
              <option value="all">All seller types</option>
              <option value="normal">Normal seller</option>
              <option value="food">Food vendor</option>
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
            <Button variant="outline" onClick={() => { setQuery(''); setStatus('all'); setSellerType('all'); setDateFrom(''); setDateTo(''); setPage(1); }}>
              Reset
            </Button>
            <Button onClick={handleExport}>Export CSV</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Directory</CardTitle>
          <CardDescription>Showing {toolbarStatus.toLowerCase()} vendors with active filters.</CardDescription>
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
                    <th className="py-3 pr-4 font-medium">Seller type</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Created</th>
                    <th className="py-3 pr-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((vendor) => (
                    <tr key={vendor.id} className="border-b border-border/40">
                      <td className="py-3 pr-4">{vendor.businessName || vendor.vendorId || '—'}</td>
                      <td className="py-3 pr-4">{vendor.ownerName || '—'}</td>
                      <td className="py-3 pr-4">{vendor.email || '—'}</td>
                      <td className="py-3 pr-4">{vendor.phone || '—'}</td>
                      <td className="py-3 pr-4">{vendor.sellerType || 'normal'}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={vendor.status === 'active' ? 'secondary' : 'outline'}>
                          {vendor.status || 'unknown'}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">{formatDate(vendor.createdAt)}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="secondary" onClick={() => setSelectedVendor(vendor)}>
                            View
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setVendorToDelete(vendor)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
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

      {selectedVendor ? (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setSelectedVendor(null)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-background p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Vendor Detail</h2>
                <p className="text-sm text-muted-foreground">ID: {selectedVendor.id}</p>
              </div>
              <Button variant="ghost" onClick={() => setSelectedVendor(null)}>Close</Button>
            </div>
            <div className="mt-6 grid gap-4">
              {[
                ['Business', selectedVendor.businessName || selectedVendor.vendorId || '—'],
                ['Owner', selectedVendor.ownerName || '—'],
                ['Email', selectedVendor.email || '—'],
                ['Phone', selectedVendor.phone || '—'],
                ['Seller type', selectedVendor.sellerType || 'normal'],
                ['Status', selectedVendor.status || '—'],
                ['Created', formatDate(selectedVendor.createdAt)]
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border/60 p-4">
                  <p className="text-xs uppercase text-muted-foreground">{label}</p>
                  <p className="mt-2 font-medium">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2">
              {selectedVendor.status !== 'active' ? (
                <Button
                  onClick={() => updateVendorStatus(selectedVendor, 'active')}
                  disabled={updatingStatus}
                >
                  Approve vendor
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => updateVendorStatus(selectedVendor, 'suspended')}
                  disabled={updatingStatus}
                >
                  Suspend vendor
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => updateVendorStatus(selectedVendor, 'pending')}
                disabled={updatingStatus}
              >
                Mark pending
              </Button>
              <Button
                variant="destructive"
                onClick={() => setVendorToDelete(selectedVendor)}
                disabled={updatingStatus}
              >
                Delete vendor
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={Boolean(vendorToDelete)} onOpenChange={(open) => { if (!open) setVendorToDelete(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete vendor permanently?</DialogTitle>
            <DialogDescription>
              This will permanently remove{' '}
              <strong>{vendorToDelete?.businessName || vendorToDelete?.vendorId || 'this vendor'}</strong>{' '}
              along with their store and all of their products. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVendorToDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteVendor} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}
