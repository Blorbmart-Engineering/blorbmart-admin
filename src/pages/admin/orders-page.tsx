import { useCallback, useEffect, useMemo, useState } from 'react'

import { AdminShell } from '@/components/admin/admin-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'

type OrderItem = {
  name?: string
  productName?: string
  quantity?: number
  qty?: number
  price?: number
}

type OrderRecord = {
  id: string
  orderId?: string
  userId?: string
  buyerId?: string
  buyerName?: string
  buyerEmail?: string
  buyerPhone?: string
  total?: number
  currency?: string
  status?: string
  paymentStatus?: string
  paymentMethod?: string
  paymentReference?: string
  createdAt?: unknown
  items?: OrderItem[]
  shippingAddress?: Record<string, unknown>
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

function formatPrice(value?: number, currency?: string) {
  if (typeof value !== 'number') return '—'
  const code = currency || 'NGN'
  return `${code} ${value.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
}

export function OrdersPage() {
  const { apiFetchAuth } = useAuth()
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null)

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [paymentStatus, setPaymentStatus] = useState('all')
  const [buyerId, setBuyerId] = useState('')
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
        if (paymentStatus !== 'all') params.set('paymentStatus', paymentStatus)
        if (buyerId) params.set('buyerId', buyerId)
        if (dateFrom) params.set('dateFrom', dateFrom)
        if (dateTo) params.set('dateTo', dateTo)

        const response = await apiFetchAuth(`/api/admin/orders?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to load orders')
        }
        const payload = await response.json()
        if (!active) return
        setOrders(payload?.data?.orders || [])
        setHasMore(Boolean(payload?.data?.pagination?.hasMore))
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Failed to load orders')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [apiFetchAuth, page, query, status, paymentStatus, buyerId, dateFrom, dateTo])

  const [buyerCache, setBuyerCache] = useState<Record<string, { name?: string; email?: string; phone?: string }>>({})

  const fetchBuyerDetails = useCallback(async (userId: string) => {
    if (!userId || buyerCache[userId]) return
    try {
      const response = await apiFetchAuth(`/api/admin/users?q=${encodeURIComponent(userId)}&limit=1`)
      if (!response.ok) return
      const payload = await response.json()
      const user = payload?.data?.users?.[0]
      if (user) {
        setBuyerCache((prev) => ({
          ...prev,
          [userId]: {
            name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.displayName || 'Unknown',
            email: user.email || '',
            phone: user.phone || ''
          }
        }))
      }
    } catch (err) {
      console.error('Failed to fetch buyer:', err)
    }
  }, [apiFetchAuth, buyerCache])

  useEffect(() => {
    if (selectedOrder?.userId) {
      fetchBuyerDetails(selectedOrder.userId)
    }
  }, [selectedOrder, fetchBuyerDetails])

  // Fetch buyer details for all orders in the list
  useEffect(() => {
    const userIds = orders.map(o => o.userId).filter((id): id is string => !!id && !buyerCache[id])
    const uniqueIds = [...new Set(userIds)].slice(0, 10)
    uniqueIds.forEach(id => fetchBuyerDetails(id))
  }, [orders, buyerCache, fetchBuyerDetails])

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        limit: '1000',
        q: query || ''
      })
      if (status !== 'all') params.set('status', status)
      if (paymentStatus !== 'all') params.set('paymentStatus', paymentStatus)
      if (buyerId) params.set('buyerId', buyerId)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const response = await apiFetchAuth(`/api/admin/orders/export?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to export orders')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `orders-export-${Date.now()}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export orders')
    }
  }

  const toolbarStatus = useMemo(() => (status === 'all' ? 'All' : status), [status])

  return (
    <AdminShell title="Orders" subtitle="All customer orders across the platform.">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
          <CardDescription>Filter by order status, payment state, or buyer.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="order-search">Search</Label>
            <Input id="order-search" placeholder="Order ID, buyer ID, status" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Payment</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={paymentStatus}
              onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
            >
              <option value="all">All payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="buyer-filter">Buyer ID</Label>
            <Input id="buyer-filter" placeholder="Buyer/User ID" value={buyerId} onChange={(e) => { setBuyerId(e.target.value); setPage(1); }} />
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" onClick={() => { setQuery(''); setStatus('all'); setPaymentStatus('all'); setBuyerId(''); setDateFrom(''); setDateTo(''); setPage(1); }}>
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
          <CardTitle>Order History</CardTitle>
          <CardDescription>Showing {toolbarStatus.toLowerCase()} orders with active filters.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading orders...</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {!loading && !error ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground">
                    <th className="py-3 pr-4 font-medium">Order</th>
                    <th className="py-3 pr-4 font-medium">Buyer</th>
                    <th className="py-3 pr-4 font-medium">Total</th>
                    <th className="py-3 pr-4 font-medium">Payment</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Created</th>
                    <th className="py-3 pr-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-border/40">
                      <td className="py-3 pr-4">{order.orderId || order.id}</td>
                      <td className="py-3 pr-4">
                        {order.userId && buyerCache[order.userId]?.name 
                          ? buyerCache[order.userId].name 
                          : order.buyerName || order.userId || order.buyerId || '—'}
                      </td>
                      <td className="py-3 pr-4">{formatPrice(order.total, order.currency)}</td>
                      <td className="py-3 pr-4">
                        <Badge 
                          variant={order.paymentStatus === 'paid' || order.paymentStatus === 'completed' ? 'default' : 'outline'}
                          className={order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700 border-red-200' : ''}
                        >
                          {order.paymentStatus || 'Pending'}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={order.status === 'completed' ? 'secondary' : 'outline'}>
                          {order.status || 'unknown'}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">{formatDate(order.createdAt)}</td>
                      <td className="py-3 pr-4">
                        <Button size="sm" variant="secondary" onClick={() => setSelectedOrder(order)}>
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

      {selectedOrder ? (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" 
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={() => setSelectedOrder(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-semibold">Order Details</h2>
              <p className="text-sm text-muted-foreground mt-1">{selectedOrder.orderId || selectedOrder.id}</p>
            </div>

            <div className="space-y-4">
              {/* Buyer Info */}
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground mb-3">Buyer Information</p>
                <div className="space-y-2">
                  <p className="font-medium">
                    {selectedOrder.userId && buyerCache[selectedOrder.userId]?.name 
                      ? buyerCache[selectedOrder.userId].name 
                      : selectedOrder.buyerName || 'Unknown Buyer'}
                  </p>
                  {selectedOrder.userId && buyerCache[selectedOrder.userId]?.email && (
                    <p className="text-sm text-muted-foreground">{buyerCache[selectedOrder.userId].email}</p>
                  )}
                  {selectedOrder.userId && buyerCache[selectedOrder.userId]?.phone && (
                    <p className="text-sm text-muted-foreground">{buyerCache[selectedOrder.userId].phone}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">ID: {selectedOrder.userId || selectedOrder.buyerId || '—'}</p>
                </div>
              </div>

              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border/60 p-4">
                  <p className="text-xs uppercase text-muted-foreground mb-1">Total Amount</p>
                  <p className="text-lg font-semibold">{formatPrice(selectedOrder.total, selectedOrder.currency)}</p>
                </div>
                <div className="rounded-xl border border-border/60 p-4">
                  <p className="text-xs uppercase text-muted-foreground mb-1">Status</p>
                  <Badge variant={selectedOrder.status === 'completed' ? 'default' : 'secondary'}>
                    {selectedOrder.status || 'Unknown'}
                  </Badge>
                </div>
              </div>

              {/* Payment Info */}
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground mb-3">Payment Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <Badge 
                      variant={
                        selectedOrder.paymentStatus === 'paid' || selectedOrder.paymentStatus === 'completed' 
                          ? 'default' 
                          : 'outline'
                      }
                      className={
                        selectedOrder.paymentStatus === 'failed' 
                          ? 'bg-red-100 text-red-700 border-red-200' 
                          : ''
                      }
                    >
                      {selectedOrder.paymentStatus || 'Pending'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Method</p>
                    <p className="font-medium capitalize">{selectedOrder.paymentMethod || '—'}</p>
                  </div>
                  {selectedOrder.paymentReference && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Reference</p>
                      <p className="font-mono text-sm">{selectedOrder.paymentReference}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground mb-3">Timeline</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="text-sm font-medium">{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Items (if available) */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="rounded-xl border border-border/60 p-4">
                  <p className="text-xs font-medium uppercase text-muted-foreground mb-3">Items ({selectedOrder.items.length})</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedOrder.items.map((item: OrderItem, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.name || item.productName || `Item ${idx + 1}`} × {item.quantity || item.qty || 1}</span>
                        <span className="font-medium">{formatPrice((item.price ?? 0) * (item.quantity || item.qty || 1), selectedOrder.currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  )
}
