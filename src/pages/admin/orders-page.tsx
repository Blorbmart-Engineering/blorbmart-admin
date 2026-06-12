import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { AdminShell } from '@/components/admin/admin-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/lib/auth'

type OrderItem = {
  name?: string
  productName?: string
  quantity?: number
  qty?: number
  price?: number
  subtotal?: number
}

type StoreOrder = {
  id?: string
  storeId?: string
  storeName?: string
  vendorId?: string
  items?: OrderItem[]
  total?: number
  subtotal?: number
  status?: string
}

type OrderDiagnostics = {
  paymentPaid?: boolean
  vendorIdsPresent?: boolean
  vendorIds?: string[]
  likelyIssue?: string | null
  paystackMode?: 'live' | 'test'
}

type SellerOverride = {
  vendorName?: string
  restaurantAddress?: string
  contactNumber?: string
  email?: string
}

type SellerOption = {
  id: string
  label: string
  vendorName: string
  restaurantAddress: string
  contactNumber: string
  email: string
  sellerType?: string | null
}

type OrderRecord = {
  id: string
  orderId?: string
  userId?: string
  buyerId?: string
  buyerName?: string
  buyerEmail?: string
  buyerPhone?: string
  userName?: string
  userEmail?: string
  userPhone?: string
  phone?: string
  total?: number
  totalAmount?: number
  subtotal?: number
  deliveryFee?: number
  serviceFee?: number
  discountAmount?: number
  currency?: string
  status?: string
  orderStatus?: string
  orderType?: string
  paymentStatus?: string
  paymentMethod?: string
  paymentReference?: string
  paymentProvider?: string
  paidAt?: unknown
  createdAt?: unknown
  updatedAt?: unknown
  items?: OrderItem[]
  storeOrders?: StoreOrder[]
  storeId?: string
  storeName?: string
  storeCount?: number
  vendorIds?: string[]
  sellerOverride?: SellerOverride
  promoCode?: string
  note?: string
  notes?: string
  address?: Record<string, unknown> | string
  deliveryAddress?: Record<string, unknown> | string
  diagnostics?: OrderDiagnostics
  shippingAddress?: Record<string, unknown>
}

const ISSUE_LABELS: Record<string, string> = {
  payment_not_completed: 'Payment not completed — restaurant will not see this order',
  paid_but_status_stuck: 'Paid but order status stuck — may need manual check',
  missing_vendor_ids: 'No vendor IDs — restaurant cannot be matched'
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

function getOrderTotal(order: OrderRecord) {
  return order.totalAmount ?? order.total
}

function getOrderStatus(order: OrderRecord) {
  return order.orderStatus || order.status || 'unknown'
}

function getBuyerName(order: OrderRecord) {
  return order.userName || order.buyerName || 'Unknown Buyer'
}

function getBuyerEmail(order: OrderRecord) {
  return order.userEmail || order.buyerEmail || ''
}

function getBuyerPhone(order: OrderRecord) {
  return order.userPhone || order.buyerPhone || order.phone || ''
}

function isPaymentPaid(order: OrderRecord) {
  const status = String(order.paymentStatus || '').toLowerCase()
  return status === 'paid' || status === 'success' || status === 'completed'
}

function formatAddress(value: OrderRecord['address'] | OrderRecord['deliveryAddress']): string {
  if (!value) return '—'
  if (typeof value === 'string') return value
  const parts = [
    value.street,
    value.addressLine1,
    value.city,
    value.state,
    value.landmark,
    value.fullAddress,
    value.note
  ].filter(Boolean)
  return parts.length ? parts.join(', ') : JSON.stringify(value)
}

function collectLineItems(order: OrderRecord): OrderItem[] {
  if (order.items?.length) return order.items
  const fromStores = (order.storeOrders || []).flatMap((store) => store.items || [])
  return fromStores
}

function paymentBadgeVariant(order: OrderRecord) {
  if (isPaymentPaid(order)) return 'default'
  if (order.paymentStatus === 'failed') return 'outline'
  return 'outline'
}

export function OrdersPage() {
  const { apiFetchAuth } = useAuth()
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [reconciling, setReconciling] = useState(false)
  const [sellerOverrideDraft, setSellerOverrideDraft] = useState<SellerOverride>({
    vendorName: '',
    restaurantAddress: '',
    contactNumber: '',
    email: ''
  })
  const [sellerOptions, setSellerOptions] = useState<SellerOption[]>([])
  const [sellerOptionsLoading, setSellerOptionsLoading] = useState(false)
  const [selectedSellerId, setSelectedSellerId] = useState('')
  const [sellerOverrideSaving, setSellerOverrideSaving] = useState(false)
  const [sellerOverrideResending, setSellerOverrideResending] = useState(false)
  const [sellerOverrideMessage, setSellerOverrideMessage] = useState('')

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

  useEffect(() => {
    let active = true

    const loadSellers = async () => {
      setSellerOptionsLoading(true)
      try {
        const response = await apiFetchAuth('/api/admin/vendors?limit=500')
        if (!response.ok) return
        const payload = await response.json()
        if (!active) return
        const sellers = (payload?.data?.vendors || []).map((seller: Record<string, unknown>) => {
          const id = String(seller.id || seller.vendorId || seller.userId || '').trim()
          const vendorName = String(seller.businessName || seller.name || seller.storeName || '').trim()
          const restaurantAddress = String(seller.address || seller.businessAddress || seller.storeAddress || '').trim()
          const contactNumber = String(seller.businessPhone || seller.phone || seller.contactPhone || seller.phoneNumber || '').trim()
          const email = String(seller.email || seller.contactEmail || seller.businessEmail || '').trim()
          const sellerType = String(seller.sellerType || '').trim() || null
          if (!id) return null
          return {
            id,
            label: `${vendorName || id}${sellerType ? ` (${sellerType})` : ''}`,
            vendorName,
            restaurantAddress,
            contactNumber,
            email,
            sellerType
          } as SellerOption
        }).filter(Boolean) as SellerOption[]
        setSellerOptions(sellers)
      } catch (err) {
        console.error('Failed to load sellers:', err)
      } finally {
        if (active) setSellerOptionsLoading(false)
      }
    }

    loadSellers()
    return () => {
      active = false
    }
  }, [apiFetchAuth])

  const [buyerCache, setBuyerCache] = useState<Record<string, { name?: string; email?: string; phone?: string }>>({})
  const fetchedIdsRef = useRef<Set<string>>(new Set())

  const fetchBuyerDetails = useCallback(async (userId: string) => {
    if (!userId || fetchedIdsRef.current.has(userId)) return
    fetchedIdsRef.current.add(userId)
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
      fetchedIdsRef.current.delete(userId)
      console.error('Failed to fetch buyer:', err)
    }
  }, [apiFetchAuth])

  const loadOrderDetail = useCallback(async (order: OrderRecord) => {
    const key = order.orderId || order.id
    setDetailLoading(true)
    try {
      const response = await apiFetchAuth(`/api/admin/orders/${encodeURIComponent(key)}`)
      if (response.ok) {
        const payload = await response.json()
        if (payload?.data?.order) {
          setSelectedOrder(payload.data.order)
          const override = payload.data.order.sellerOverride || {}
          setSellerOverrideDraft({
            vendorName: override.vendorName || '',
            restaurantAddress: override.restaurantAddress || '',
            contactNumber: override.contactNumber || '',
            email: override.email || ''
          })
          setSelectedSellerId('')
          setSellerOverrideMessage('')
        }
      }
    } catch (err) {
      console.error('Failed to load order detail:', err)
    } finally {
      setDetailLoading(false)
    }
  }, [apiFetchAuth])

  const openOrderDetail = useCallback(async (order: OrderRecord) => {
    setSelectedOrder(order)
    await loadOrderDetail(order)
  }, [loadOrderDetail])

  const reconcilePayment = useCallback(async (order: OrderRecord) => {
    const key = order.orderId || order.id
    setReconciling(true)
    setError('')
    try {
      const response = await apiFetchAuth(`/api/admin/orders/${encodeURIComponent(key)}/reconcile-payment`, {
        method: 'POST'
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to verify payment')
      }
      await loadOrderDetail(order)
      const listResponse = await apiFetchAuth(`/api/admin/orders?limit=${pageSize}&page=${page}`)
      if (listResponse.ok) {
        const listPayload = await listResponse.json()
        setOrders(listPayload?.data?.orders || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify payment')
    } finally {
      setReconciling(false)
    }
  }, [apiFetchAuth, loadOrderDetail, page])

  const saveSellerOverride = useCallback(async () => {
    if (!selectedOrder) return
    const key = selectedOrder.orderId || selectedOrder.id
    setSellerOverrideSaving(true)
    setSellerOverrideMessage('')
    try {
      const response = await apiFetchAuth(`/api/admin/orders/${encodeURIComponent(key)}/seller-override`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sellerOverrideDraft)
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to save seller override')
      }
      setSellerOverrideMessage('Seller override saved.')
      await loadOrderDetail(selectedOrder)
    } catch (err) {
      setSellerOverrideMessage(err instanceof Error ? err.message : 'Failed to save seller override')
    } finally {
      setSellerOverrideSaving(false)
    }
  }, [apiFetchAuth, loadOrderDetail, selectedOrder, sellerOverrideDraft])

  const resendOpsEmail = useCallback(async () => {
    if (!selectedOrder) return
    const key = selectedOrder.orderId || selectedOrder.id
    setSellerOverrideResending(true)
    setSellerOverrideMessage('')
    try {
      const response = await apiFetchAuth(`/api/admin/orders/${encodeURIComponent(key)}/resend-ops-email`, {
        method: 'POST'
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to resend email')
      }
      setSellerOverrideMessage(payload?.message || 'Email resent.')
    } catch (err) {
      setSellerOverrideMessage(err instanceof Error ? err.message : 'Failed to resend email')
    } finally {
      setSellerOverrideResending(false)
    }
  }, [apiFetchAuth, selectedOrder])

  const applySellerSelection = useCallback((sellerId: string) => {
    setSelectedSellerId(sellerId)
    const seller = sellerOptions.find((item) => item.id === sellerId)
    if (!seller) return
    setSellerOverrideDraft({
      vendorName: seller.vendorName || '',
      restaurantAddress: seller.restaurantAddress || '',
      contactNumber: seller.contactNumber || '',
      email: seller.email || ''
    })
  }, [sellerOptions])

  useEffect(() => {
    if (selectedOrder?.userId) {
      fetchBuyerDetails(selectedOrder.userId)
    }
  }, [selectedOrder, fetchBuyerDetails])

  useEffect(() => {
    const userIds = orders.map((o) => o.userId).filter((id): id is string => !!id && !fetchedIdsRef.current.has(id))
    const uniqueIds = [...new Set(userIds)].slice(0, 10)
    uniqueIds.forEach((id) => fetchBuyerDetails(id))
  }, [orders, fetchBuyerDetails])

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

  const issueCount = useMemo(
    () => orders.filter((o) => o.diagnostics?.likelyIssue).length,
    [orders]
  )

  const toolbarStatus = useMemo(() => (status === 'all' ? 'All' : status), [status])

  return (
    <AdminShell title="Orders" subtitle="All customer orders across the platform.">
      {issueCount > 0 ? (
        <Card className="mb-6 border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-900">
              {issueCount} order{issueCount === 1 ? '' : 's'} on this page may have delivery issues (unpaid, missing vendor, or stuck status). Check the Alert column.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
          <CardDescription>Filter by order status, payment state, or buyer.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="order-search">Search</Label>
            <Input id="order-search" placeholder="Order ID, phone, store, payment ref" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending / placed</option>
              <option value="processing">Processing / preparing</option>
              <option value="completed">Delivered / completed</option>
              <option value="cancelled">Cancelled / failed</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Payment</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={paymentStatus}
              onChange={(e) => { setPaymentStatus(e.target.value); setPage(1) }}
            >
              <option value="all">All payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="buyer-filter">Buyer ID</Label>
            <Input id="buyer-filter" placeholder="Buyer/User ID" value={buyerId} onChange={(e) => { setBuyerId(e.target.value); setPage(1) }} />
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" onClick={() => { setQuery(''); setStatus('all'); setPaymentStatus('all'); setBuyerId(''); setDateFrom(''); setDateTo(''); setPage(1) }}>
              Reset
            </Button>
            <Button onClick={handleExport}>Export CSV</Button>
          </div>
        </CardContent>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr]">
          <div className="space-y-2">
            <Label>Date range</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} />
              <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} />
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
                    <th className="py-3 pr-4 font-medium">Store</th>
                    <th className="py-3 pr-4 font-medium">Total</th>
                    <th className="py-3 pr-4 font-medium">Payment</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Alert</th>
                    <th className="py-3 pr-4 font-medium">Created</th>
                    <th className="py-3 pr-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const issue = order.diagnostics?.likelyIssue
                    return (
                      <tr key={order.id} className="border-b border-border/40">
                        <td className="py-3 pr-4">
                          <div className="font-medium">{order.orderId || order.id}</div>
                          {order.orderType ? <div className="text-xs text-muted-foreground">{order.orderType}</div> : null}
                        </td>
                        <td className="py-3 pr-4">
                          <div>
                            {order.userId && buyerCache[order.userId]?.name
                              ? buyerCache[order.userId].name
                              : getBuyerName(order)}
                          </div>
                          {getBuyerPhone(order) ? (
                            <div className="text-xs text-muted-foreground">{getBuyerPhone(order)}</div>
                          ) : null}
                        </td>
                        <td className="py-3 pr-4">
                          <div>{order.storeName || order.storeOrders?.[0]?.storeName || '—'}</div>
                          {order.paymentReference ? (
                            <div className="text-xs font-mono text-muted-foreground truncate max-w-[120px]" title={order.paymentReference}>
                              {order.paymentReference}
                            </div>
                          ) : null}
                        </td>
                        <td className="py-3 pr-4">{formatPrice(getOrderTotal(order), order.currency)}</td>
                        <td className="py-3 pr-4">
                          <Badge
                            variant={paymentBadgeVariant(order)}
                            className={order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700 border-red-200' : ''}
                          >
                            {order.paymentStatus || 'pending'}
                          </Badge>
                          {order.paymentMethod ? (
                            <div className="text-xs text-muted-foreground mt-1 capitalize">{order.paymentMethod}</div>
                          ) : null}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={getOrderStatus(order) === 'delivered' ? 'secondary' : 'outline'}>
                            {getOrderStatus(order)}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">
                          {issue ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-xs">
                              {ISSUE_LABELS[issue] || issue}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">OK</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">{formatDate(order.createdAt)}</td>
                        <td className="py-3 pr-4">
                          <Button size="sm" variant="secondary" onClick={() => openOrderDetail(order)}>
                            View
                          </Button>
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

      {selectedOrder ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-semibold">Order Details</h2>
              <p className="text-sm text-muted-foreground mt-1">{selectedOrder.orderId || selectedOrder.id}</p>
              {detailLoading ? <p className="text-xs text-muted-foreground mt-1">Loading full order data...</p> : null}
            </div>

            {selectedOrder.diagnostics?.likelyIssue ? (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {ISSUE_LABELS[selectedOrder.diagnostics.likelyIssue] || selectedOrder.diagnostics.likelyIssue}
              </div>
            ) : null}

            <div className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground mb-3">Buyer Information</p>
                <div className="space-y-2">
                  <p className="font-medium">
                    {selectedOrder.userId && buyerCache[selectedOrder.userId]?.name
                      ? buyerCache[selectedOrder.userId].name
                      : getBuyerName(selectedOrder)}
                  </p>
                  {(selectedOrder.userId && buyerCache[selectedOrder.userId]?.email) || getBuyerEmail(selectedOrder) ? (
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.userId && buyerCache[selectedOrder.userId]?.email
                        ? buyerCache[selectedOrder.userId].email
                        : getBuyerEmail(selectedOrder)}
                    </p>
                  ) : null}
                  {(selectedOrder.userId && buyerCache[selectedOrder.userId]?.phone) || getBuyerPhone(selectedOrder) ? (
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.userId && buyerCache[selectedOrder.userId]?.phone
                        ? buyerCache[selectedOrder.userId].phone
                        : getBuyerPhone(selectedOrder)}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground mt-2">User ID: {selectedOrder.userId || selectedOrder.buyerId || '—'}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground mb-3">Restaurant / Store</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Store name</p>
                    <p className="font-medium">{selectedOrder.storeName || selectedOrder.storeOrders?.[0]?.storeName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Store ID</p>
                    <p className="font-mono text-xs break-all">{selectedOrder.storeId || selectedOrder.storeOrders?.[0]?.storeId || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Vendor IDs (used to route to restaurant)</p>
                    <p className="font-mono text-xs break-all">
                      {selectedOrder.vendorIds?.length
                        ? selectedOrder.vendorIds.join(', ')
                        : selectedOrder.diagnostics?.vendorIds?.join(', ') || '—'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Seller Override</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pick a seller from the list, or tweak the fields before saving.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resendOpsEmail} disabled={sellerOverrideResending || detailLoading}>
                      {sellerOverrideResending ? 'Resending...' : 'Resend email'}
                    </Button>
                    <Button onClick={saveSellerOverride} disabled={sellerOverrideSaving || detailLoading}>
                      {sellerOverrideSaving ? 'Saving...' : 'Save override'}
                    </Button>
                  </div>
                </div>

                <div className="mb-4 space-y-1.5">
                  <Label htmlFor="seller-override-select">Choose seller</Label>
                  <Select
                    value={selectedSellerId}
                    onValueChange={applySellerSelection}
                    disabled={sellerOptionsLoading || sellerOverrideSaving}
                  >
                    <SelectTrigger id="seller-override-select">
                      <SelectValue placeholder={sellerOptionsLoading ? 'Loading sellers...' : 'Select a seller'} />
                    </SelectTrigger>
                    <SelectContent>
                      {sellerOptions.length ? sellerOptions.map((seller) => (
                        <SelectItem key={seller.id} value={seller.id}>
                          {seller.label}
                        </SelectItem>
                      )) : (
                        <SelectItem value="__none" disabled>
                          No sellers found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="seller-override-name">Vendor name</Label>
                    <Input
                      id="seller-override-name"
                      value={sellerOverrideDraft.vendorName || ''}
                      onChange={(event) => setSellerOverrideDraft((prev) => ({ ...prev, vendorName: event.target.value }))}
                      placeholder="The Daisy Aesthetic"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="seller-override-contact">Contact number</Label>
                    <Input
                      id="seller-override-contact"
                      value={sellerOverrideDraft.contactNumber || ''}
                      onChange={(event) => setSellerOverrideDraft((prev) => ({ ...prev, contactNumber: event.target.value }))}
                      placeholder="08012345678"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="seller-override-address">Restaurant address</Label>
                    <Input
                      id="seller-override-address"
                      value={sellerOverrideDraft.restaurantAddress || ''}
                      onChange={(event) => setSellerOverrideDraft((prev) => ({ ...prev, restaurantAddress: event.target.value }))}
                      placeholder="No. 12 Market Road, Osogbo"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="seller-override-email">Optional email for resend</Label>
                    <Input
                      id="seller-override-email"
                      type="email"
                      value={sellerOverrideDraft.email || ''}
                      onChange={(event) => setSellerOverrideDraft((prev) => ({ ...prev, email: event.target.value }))}
                      placeholder="vendor@example.com"
                    />
                  </div>
                </div>

                {sellerOverrideMessage ? (
                  <p className="mt-3 text-sm text-muted-foreground">{sellerOverrideMessage}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border/60 p-4">
                  <p className="text-xs uppercase text-muted-foreground mb-1">Total Amount</p>
                  <p className="text-lg font-semibold">{formatPrice(getOrderTotal(selectedOrder), selectedOrder.currency)}</p>
                  {typeof selectedOrder.subtotal === 'number' ? (
                    <p className="text-xs text-muted-foreground mt-1">Subtotal: {formatPrice(selectedOrder.subtotal, selectedOrder.currency)}</p>
                  ) : null}
                  {typeof selectedOrder.deliveryFee === 'number' ? (
                    <p className="text-xs text-muted-foreground">Delivery: {formatPrice(selectedOrder.deliveryFee, selectedOrder.currency)}</p>
                  ) : null}
                  {typeof selectedOrder.serviceFee === 'number' ? (
                    <p className="text-xs text-muted-foreground">Service fee: {formatPrice(selectedOrder.serviceFee, selectedOrder.currency)}</p>
                  ) : null}
                  {typeof selectedOrder.discountAmount === 'number' && selectedOrder.discountAmount > 0 ? (
                    <p className="text-xs text-muted-foreground">Discount: −{formatPrice(selectedOrder.discountAmount, selectedOrder.currency)}</p>
                  ) : null}
                </div>
                <div className="rounded-xl border border-border/60 p-4">
                  <p className="text-xs uppercase text-muted-foreground mb-1">Order Status</p>
                  <Badge variant={getOrderStatus(selectedOrder) === 'delivered' ? 'default' : 'secondary'}>
                    {getOrderStatus(selectedOrder)}
                  </Badge>
                  {selectedOrder.orderType ? (
                    <p className="text-xs text-muted-foreground mt-2">Type: {selectedOrder.orderType}</p>
                  ) : null}
                  {selectedOrder.promoCode ? (
                    <p className="text-xs text-muted-foreground mt-1">Promo: {selectedOrder.promoCode}</p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground mb-3">Payment Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <Badge
                      variant={isPaymentPaid(selectedOrder) ? 'default' : 'outline'}
                      className={selectedOrder.paymentStatus === 'failed' ? 'bg-red-100 text-red-700 border-red-200' : ''}
                    >
                      {selectedOrder.paymentStatus || 'pending'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Method</p>
                    <p className="font-medium capitalize">{selectedOrder.paymentMethod || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Provider</p>
                    <p className="font-medium">{selectedOrder.paymentProvider || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Paystack mode (server)</p>
                    <Badge variant="outline">{selectedOrder.diagnostics?.paystackMode || '—'}</Badge>
                  </div>
                  {selectedOrder.paymentReference ? (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Reference</p>
                      <p className="font-mono text-sm break-all">{selectedOrder.paymentReference}</p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground mb-3">Delivery</p>
                <p className="text-sm">{formatAddress(selectedOrder.deliveryAddress || selectedOrder.address)}</p>
                {selectedOrder.note || selectedOrder.notes ? (
                  <p className="text-sm text-muted-foreground mt-2">Note: {selectedOrder.note || selectedOrder.notes}</p>
                ) : null}
              </div>

              <div className="rounded-xl border border-border/60 p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground mb-3">Timeline</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="text-sm font-medium">{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Updated</span>
                    <span className="text-sm font-medium">{formatDate(selectedOrder.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Paid at</span>
                    <span className="text-sm font-medium">{formatDate(selectedOrder.paidAt)}</span>
                  </div>
                </div>
              </div>

              {collectLineItems(selectedOrder).length > 0 ? (
                <div className="rounded-xl border border-border/60 p-4">
                  <p className="text-xs font-medium uppercase text-muted-foreground mb-3">
                    Items ({collectLineItems(selectedOrder).length})
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {collectLineItems(selectedOrder).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>
                          {item.name || item.productName || `Item ${idx + 1}`} × {item.quantity || item.qty || 1}
                        </span>
                        <span className="font-medium">
                          {formatPrice(
                            item.subtotal ?? (item.price ?? 0) * (item.quantity || item.qty || 1),
                            selectedOrder.currency
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedOrder.storeOrders && selectedOrder.storeOrders.length > 0 ? (
                <div className="rounded-xl border border-border/60 p-4">
                  <p className="text-xs font-medium uppercase text-muted-foreground mb-3">Per-store breakdown</p>
                  <div className="space-y-3">
                    {selectedOrder.storeOrders.map((store, idx) => (
                      <div key={store.id || idx} className="rounded-lg bg-muted/40 p-3 text-sm">
                        <p className="font-medium">{store.storeName || `Store ${idx + 1}`}</p>
                        <p className="text-xs text-muted-foreground font-mono">store: {store.storeId || '—'} · vendor: {store.vendorId || '—'}</p>
                        <p className="text-xs text-muted-foreground">Status: {store.status || '—'} · Total: {formatPrice(store.total ?? store.subtotal, selectedOrder.currency)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              {!isPaymentPaid(selectedOrder) && selectedOrder.paymentReference ? (
                <Button
                  disabled={reconciling}
                  onClick={() => reconcilePayment(selectedOrder)}
                >
                  {reconciling ? 'Checking Paystack…' : 'Verify payment with Paystack'}
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  )
}
