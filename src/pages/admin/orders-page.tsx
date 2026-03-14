import { useEffect, useMemo, useState } from 'react'

import { AdminShell } from '@/components/admin/admin-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'

type OrderRecord = {
  id: string
  orderId?: string
  userId?: string
  buyerId?: string
  total?: number
  currency?: string
  status?: string
  paymentStatus?: string
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
      } catch (err: any) {
        if (!active) return
        setError(err?.message || 'Failed to load orders')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [apiFetchAuth, page, query, status, paymentStatus, buyerId, dateFrom, dateTo])

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
    } catch (err: any) {
      setError(err?.message || 'Failed to export orders')
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
                      <td className="py-3 pr-4">{order.userId || order.buyerId || '—'}</td>
                      <td className="py-3 pr-4">{formatPrice(order.total, order.currency)}</td>
                      <td className="py-3 pr-4">{order.paymentStatus || '—'}</td>
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
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setSelectedOrder(null)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-background p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Order Detail</h2>
                <p className="text-sm text-muted-foreground">ID: {selectedOrder.id}</p>
              </div>
              <Button variant="ghost" onClick={() => setSelectedOrder(null)}>Close</Button>
            </div>
            <div className="mt-6 grid gap-4">
              {[
                ['Order ID', selectedOrder.orderId || selectedOrder.id],
                ['Buyer', selectedOrder.userId || selectedOrder.buyerId || '—'],
                ['Total', formatPrice(selectedOrder.total, selectedOrder.currency)],
                ['Payment', selectedOrder.paymentStatus || '—'],
                ['Status', selectedOrder.status || '—'],
                ['Created', formatDate(selectedOrder.createdAt)]
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
