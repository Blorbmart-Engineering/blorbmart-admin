import { useEffect, useMemo, useState } from 'react'

import { AdminShell } from '@/components/admin/admin-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'

type ProductRecord = {
  id: string
  name?: string
  title?: string
  price?: number
  currency?: string
  status?: string
  category?: string
  vendorId?: string
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

function formatPrice(value?: number, currency?: string) {
  if (typeof value !== 'number') return '—'
  const code = currency || 'NGN'
  return `${code} ${value.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
}

export function ProductsPage() {
  const { apiFetchAuth } = useAuth()
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(null)

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const [vendorId, setVendorId] = useState('')
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
        if (category !== 'all') params.set('category', category)
        if (vendorId) params.set('vendorId', vendorId)
        if (dateFrom) params.set('dateFrom', dateFrom)
        if (dateTo) params.set('dateTo', dateTo)

        const response = await apiFetchAuth(`/api/admin/products?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to load products')
        }
        const payload = await response.json()
        if (!active) return
        setProducts(payload?.data?.products || [])
        setHasMore(Boolean(payload?.data?.pagination?.hasMore))
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Failed to load products')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [apiFetchAuth, page, query, status, category, vendorId, dateFrom, dateTo])

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        limit: '1000',
        q: query || ''
      })
      if (status !== 'all') params.set('status', status)
      if (category !== 'all') params.set('category', category)
      if (vendorId) params.set('vendorId', vendorId)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const response = await apiFetchAuth(`/api/admin/products/export?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to export products')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `products-export-${Date.now()}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export products')
    }
  }

  const toolbarStatus = useMemo(() => (status === 'all' ? 'All' : status), [status])

  return (
    <AdminShell title="Products" subtitle="All listed products across the marketplace.">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
          <CardDescription>Filter products by category, status, or vendor.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="product-search">Search</Label>
            <Input id="product-search" placeholder="Name, category, vendor ID" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
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
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            >
              <option value="all">All categories</option>
              <option value="food">Food</option>
              <option value="groceries">Groceries</option>
              <option value="beverages">Beverages</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendor-filter">Vendor ID</Label>
            <Input id="vendor-filter" placeholder="Vendor ID" value={vendorId} onChange={(e) => { setVendorId(e.target.value); setPage(1); }} />
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" onClick={() => { setQuery(''); setStatus('all'); setCategory('all'); setVendorId(''); setDateFrom(''); setDateTo(''); setPage(1); }}>
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
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>Showing {toolbarStatus.toLowerCase()} products with active filters.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading products...</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {!loading && !error ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground">
                    <th className="py-3 pr-4 font-medium">Name</th>
                    <th className="py-3 pr-4 font-medium">Category</th>
                    <th className="py-3 pr-4 font-medium">Vendor</th>
                    <th className="py-3 pr-4 font-medium">Price</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Created</th>
                    <th className="py-3 pr-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-border/40">
                      <td className="py-3 pr-4">{product.name || product.title || '—'}</td>
                      <td className="py-3 pr-4">{product.category || '—'}</td>
                      <td className="py-3 pr-4">{product.vendorId || '—'}</td>
                      <td className="py-3 pr-4">{formatPrice(product.price, product.currency)}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={product.status === 'active' ? 'secondary' : 'outline'}>
                          {product.status || 'unknown'}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">{formatDate(product.createdAt)}</td>
                      <td className="py-3 pr-4">
                        <Button size="sm" variant="secondary" onClick={() => setSelectedProduct(product)}>
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

      {selectedProduct ? (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setSelectedProduct(null)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-background p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Product Detail</h2>
                <p className="text-sm text-muted-foreground">ID: {selectedProduct.id}</p>
              </div>
              <Button variant="ghost" onClick={() => setSelectedProduct(null)}>Close</Button>
            </div>
            <div className="mt-6 grid gap-4">
              {[
                ['Name', selectedProduct.name || selectedProduct.title || '—'],
                ['Category', selectedProduct.category || '—'],
                ['Vendor', selectedProduct.vendorId || '—'],
                ['Price', formatPrice(selectedProduct.price, selectedProduct.currency)],
                ['Status', selectedProduct.status || '—'],
                ['Created', formatDate(selectedProduct.createdAt)]
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
