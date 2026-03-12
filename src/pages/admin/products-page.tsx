import { useEffect, useState } from 'react'

import { AdminShell } from '@/components/admin/admin-shell'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

export function ProductsPage() {
  const { apiFetchAuth } = useAuth()
  const [products, setProducts] = useState<ProductRecord[]>([])
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
        const response = await apiFetchAuth('/api/admin/products?limit=25')
        if (!response.ok) {
          throw new Error('Failed to load products')
        }
        const payload = await response.json()
        if (!active) return
        setProducts(payload?.data?.products || [])
        setNextCursor(payload?.data?.nextCursor || null)
      } catch (err: any) {
        if (!active) return
        setError(err?.message || 'Failed to load products')
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
      const response = await apiFetchAuth(`/api/admin/products?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to load more products')
      }
      const payload = await response.json()
      setProducts((prev) => [...prev, ...(payload?.data?.products || [])])
      setNextCursor(payload?.data?.nextCursor || null)
    } catch (err: any) {
      setError(err?.message || 'Failed to load more products')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <AdminShell title="Products" subtitle="All listed products across the marketplace.">
      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>Showing the most recent products from Firestore.</CardDescription>
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
