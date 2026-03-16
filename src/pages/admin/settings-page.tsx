import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'

import { AdminShell } from '@/components/admin/admin-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth'

type SettingsPayload = {
  deliveryFee: number
  serviceFee: number
  payoutHoldHours: number
  requireLandmark: boolean
  addressNotes: string
}

type PromoCode = {
  id: string
  code: string
  type: 'percent' | 'flat'
  value: number
  maxDiscount?: number | null
  minOrderAmount?: number | null
  usageLimit?: number | null
  usageCount?: number
  active: boolean
  description?: string
}

const initialSettings: SettingsPayload = {
  deliveryFee: 1000,
  serviceFee: 100,
  payoutHoldHours: 0,
  requireLandmark: true,
  addressNotes: 'Provide a clear landmark for easier delivery.'
}

const initialPromo = {
  code: '',
  type: 'percent',
  value: 10,
  maxDiscount: '',
  minOrderAmount: '',
  usageLimit: '',
  description: '',
  active: true
}

export function SettingsPage() {
  const { apiFetchAuth } = useAuth()
  const [settings, setSettings] = useState<SettingsPayload>(initialSettings)
  const [savingSettings, setSavingSettings] = useState(false)
  const [loading, setLoading] = useState(true)

  const [promos, setPromos] = useState<PromoCode[]>([])
  const [promoForm, setPromoForm] = useState(initialPromo)
  const [promoSaving, setPromoSaving] = useState(false)

  const loadSettings = useCallback(async () => {
    setLoading(true)
    const response = await apiFetchAuth('/api/admin/settings')
    const data = await response.json().catch(() => ({}))
    if (response.ok && data?.data) {
      setSettings({
        deliveryFee: Number(data.data.deliveryFee ?? 1000),
        serviceFee: Number(data.data.serviceFee ?? 100),
        payoutHoldHours: Number(data.data.payoutHoldHours ?? 0),
        requireLandmark: Boolean(data.data.requireLandmark ?? true),
        addressNotes: String(data.data.addressNotes ?? '')
      })
    }
    setLoading(false)
  }, [apiFetchAuth])

  const loadPromos = useCallback(async () => {
    const response = await apiFetchAuth('/api/admin/promo-codes')
    const data = await response.json().catch(() => ({}))
    if (response.ok && Array.isArray(data?.data)) {
      setPromos(data.data as PromoCode[])
    }
  }, [apiFetchAuth])

  useEffect(() => {
    loadSettings()
    loadPromos()
  }, [loadSettings, loadPromos])

  const saveSettings = async () => {
    setSavingSettings(true)
    await apiFetchAuth('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        deliveryFee: Number(settings.deliveryFee || 0),
        serviceFee: Number(settings.serviceFee || 0),
        payoutHoldHours: Number(settings.payoutHoldHours || 0),
        requireLandmark: Boolean(settings.requireLandmark),
        addressNotes: settings.addressNotes
      })
    })
    setSavingSettings(false)
  }

  const createPromo = async () => {
    if (!promoForm.code.trim()) return
    setPromoSaving(true)
    await apiFetchAuth('/api/admin/promo-codes', {
      method: 'POST',
      body: JSON.stringify({
        code: promoForm.code.trim(),
        type: promoForm.type,
        value: Number(promoForm.value || 0),
        maxDiscount: promoForm.maxDiscount ? Number(promoForm.maxDiscount) : null,
        minOrderAmount: promoForm.minOrderAmount ? Number(promoForm.minOrderAmount) : null,
        usageLimit: promoForm.usageLimit ? Number(promoForm.usageLimit) : null,
        description: promoForm.description,
        active: promoForm.active
      })
    })
    setPromoForm(initialPromo)
    await loadPromos()
    setPromoSaving(false)
  }

  const togglePromo = async (promo: PromoCode) => {
    await apiFetchAuth(`/api/admin/promo-codes/${promo.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: !promo.active })
    })
    await loadPromos()
  }

  const deletePromo = async (promoId: string) => {
    await apiFetchAuth(`/api/admin/promo-codes/${promoId}`, { method: 'DELETE' })
    await loadPromos()
  }

  return (
    <AdminShell title="Platform Settings" subtitle="Manage fees, delivery rules, and promo codes.">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Fees & Delivery</CardTitle>
            <CardDescription>Global delivery and service fees for all orders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading settings...
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Delivery fee (NGN)</Label>
                    <Input
                      type="number"
                      value={settings.deliveryFee}
                      onChange={(event) => setSettings((prev) => ({
                        ...prev,
                        deliveryFee: Number(event.target.value || 0)
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Service fee (NGN)</Label>
                    <Input
                      type="number"
                      value={settings.serviceFee}
                      onChange={(event) => setSettings((prev) => ({
                        ...prev,
                        serviceFee: Number(event.target.value || 0)
                      }))}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Payout hold (hours)</Label>
                    <Input
                      type="number"
                      value={settings.payoutHoldHours}
                      onChange={(event) => setSettings((prev) => ({
                        ...prev,
                        payoutHoldHours: Number(event.target.value || 0)
                      }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Landmark required?</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.requireLandmark}
                      onChange={(event) => setSettings((prev) => ({
                        ...prev,
                        requireLandmark: event.target.checked
                      }))}
                    />
                    <span className="text-sm text-muted-foreground">
                      Require landmark field on delivery address
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address notes</Label>
                  <Input
                    value={settings.addressNotes}
                    onChange={(event) => setSettings((prev) => ({
                      ...prev,
                      addressNotes: event.target.value
                    }))}
                  />
                </div>
                <Button onClick={saveSettings} disabled={savingSettings}>
                  {savingSettings ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                  Save settings
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Promo Codes</CardTitle>
            <CardDescription>Create and manage global promo codes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input
                    value={promoForm.code}
                    onChange={(event) => setPromoForm((prev) => ({ ...prev, code: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={promoForm.type}
                    onChange={(event) => setPromoForm((prev) => ({ ...prev, type: event.target.value }))}
                  >
                    <option value="percent">Percent</option>
                    <option value="flat">Flat</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    type="number"
                    value={promoForm.value}
                    onChange={(event) => setPromoForm((prev) => ({ ...prev, value: Number(event.target.value || 0) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max discount</Label>
                  <Input
                    type="number"
                    value={promoForm.maxDiscount}
                    onChange={(event) => setPromoForm((prev) => ({ ...prev, maxDiscount: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min order</Label>
                  <Input
                    type="number"
                    value={promoForm.minOrderAmount}
                    onChange={(event) => setPromoForm((prev) => ({ ...prev, minOrderAmount: event.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Usage limit</Label>
                  <Input
                    type="number"
                    value={promoForm.usageLimit}
                    onChange={(event) => setPromoForm((prev) => ({ ...prev, usageLimit: event.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={promoForm.active}
                    onChange={(event) => setPromoForm((prev) => ({ ...prev, active: event.target.checked }))}
                  />
                  <span className="text-sm text-muted-foreground">Active</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={promoForm.description}
                  onChange={(event) => setPromoForm((prev) => ({ ...prev, description: event.target.value }))}
                />
              </div>
              <Button onClick={createPromo} disabled={promoSaving}>
                {promoSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Plus className="mr-2 size-4" />}
                Create promo
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              {promos.length === 0 ? (
                <p className="text-sm text-muted-foreground">No promo codes yet.</p>
              ) : (
                promos.map((promo) => (
                  <div key={promo.id} className="rounded-2xl border border-border/60 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{promo.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {promo.type === 'percent' ? `${promo.value}%` : `₦${promo.value}`} ·{' '}
                          {promo.active ? 'Active' : 'Disabled'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => togglePromo(promo)}>
                          {promo.active ? 'Disable' : 'Enable'}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deletePromo(promo.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    {promo.description ? (
                      <p className="mt-2 text-sm text-muted-foreground">{promo.description}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}
