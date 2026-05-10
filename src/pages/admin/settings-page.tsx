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
  buyerReferralEnabled: boolean
  buyerReferralRewardNaira: number
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

type CategoryCommission = {
  id: string
  categoryId: string
  categoryName: string
  commissionPercent: number
  active: boolean
}

const initialSettings: SettingsPayload = {
  deliveryFee: 500,
  serviceFee: 100,
  payoutHoldHours: 0,
  buyerReferralEnabled: true,
  buyerReferralRewardNaira: 200,
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

const initialCommissionForm = {
  categoryId: '',
  categoryName: '',
  commissionPercent: 10
}

export function SettingsPage() {
  const { apiFetchAuth } = useAuth()
  const [settings, setSettings] = useState<SettingsPayload>(initialSettings)
  const [savingSettings, setSavingSettings] = useState(false)
  const [loading, setLoading] = useState(true)

  const [promos, setPromos] = useState<PromoCode[]>([])
  const [promoForm, setPromoForm] = useState(initialPromo)
  const [promoSaving, setPromoSaving] = useState(false)

  const [commissions, setCommissions] = useState<CategoryCommission[]>([])
  const [commissionSaving, setCommissionSaving] = useState(false)
  const [commissionForm, setCommissionForm] = useState(initialCommissionForm)

  const loadSettings = useCallback(async () => {
    setLoading(true)
    const response = await apiFetchAuth('/api/admin/settings')
    const data = await response.json().catch(() => ({}))
    if (response.ok && data?.data) {
      setSettings({
        deliveryFee: Number(data.data.deliveryFee ?? 1000),
        serviceFee: Number(data.data.serviceFee ?? 100),
        payoutHoldHours: Number(data.data.payoutHoldHours ?? 0),
        buyerReferralEnabled: Boolean(data.data.buyerReferralEnabled ?? true),
        buyerReferralRewardNaira: Number(data.data.buyerReferralRewardNaira ?? 200),
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

  const loadCommissions = useCallback(async () => {
    const response = await apiFetchAuth('/api/category-commission')
    const data = await response.json().catch(() => ({}))
    if (response.ok && Array.isArray(data?.data)) {
      setCommissions(data.data as CategoryCommission[])
    }
  }, [apiFetchAuth])

  useEffect(() => {
    loadSettings()
    loadPromos()
    loadCommissions()
  }, [loadSettings, loadPromos, loadCommissions])

  const saveSettings = async () => {
    setSavingSettings(true)
    await apiFetchAuth('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        deliveryFee: Number(settings.deliveryFee || 0),
        serviceFee: Number(settings.serviceFee || 0),
        payoutHoldHours: Number(settings.payoutHoldHours || 0),
        buyerReferralEnabled: Boolean(settings.buyerReferralEnabled),
        buyerReferralRewardNaira: Number(settings.buyerReferralRewardNaira || 0),
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

  const updateCommission = async (categoryId: string, commissionPercent: number, active: boolean) => {
    setCommissionSaving(true)
    await apiFetchAuth(`/api/category-commission/${categoryId}`, {
      method: 'PATCH',
      body: JSON.stringify({ commissionPercent, active })
    })
    await loadCommissions()
    setCommissionSaving(false)
  }

  const createCommission = async () => {
    if (!commissionForm.categoryId.trim() || !commissionForm.categoryName.trim()) return
    setCommissionSaving(true)
    await apiFetchAuth('/api/category-commission', {
      method: 'POST',
      body: JSON.stringify({
        categoryId: commissionForm.categoryId.trim().toLowerCase(),
        categoryName: commissionForm.categoryName.trim(),
        commissionPercent: Number(commissionForm.commissionPercent || 0),
        active: true
      })
    })
    setCommissionForm(initialCommissionForm)
    await loadCommissions()
    setCommissionSaving(false)
  }

  const deleteCommission = async (categoryId: string) => {
    setCommissionSaving(true)
    await apiFetchAuth(`/api/category-commission/${categoryId}`, { method: 'DELETE' })
    await loadCommissions()
    setCommissionSaving(false)
  }

  return (
    <AdminShell title="Platform Settings" subtitle="Manage fees, delivery rules, and promo codes.">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
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
                  <div className="space-y-2">
                    <Label>Buyer referral reward (NGN)</Label>
                    <Input
                      type="number"
                      value={settings.buyerReferralRewardNaira}
                      onChange={(event) => setSettings((prev) => ({
                        ...prev,
                        buyerReferralRewardNaira: Number(event.target.value || 0)
                      }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Buyer referrals enabled?</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.buyerReferralEnabled}
                      onChange={(event) => setSettings((prev) => ({
                        ...prev,
                        buyerReferralEnabled: event.target.checked
                      }))}
                    />
                    <span className="text-sm text-muted-foreground">
                      Let buyers share referral codes and earn wallet rewards
                    </span>
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Category Commissions</CardTitle>
            <CardDescription>Set platform commission rates per product category.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/60 p-4">
              <p className="mb-3 text-sm font-medium">Add category commission</p>
              <div className="grid gap-3 sm:grid-cols-4">
                <Input
                  placeholder="category_id"
                  value={commissionForm.categoryId}
                  onChange={(e) => setCommissionForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                />
                <Input
                  placeholder="Category name"
                  value={commissionForm.categoryName}
                  onChange={(e) => setCommissionForm((prev) => ({ ...prev, categoryName: e.target.value }))}
                />
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Commission %"
                  value={commissionForm.commissionPercent}
                  onChange={(e) => setCommissionForm((prev) => ({ ...prev, commissionPercent: Number(e.target.value || 0) }))}
                />
                <Button onClick={createCommission} disabled={commissionSaving}>
                  {commissionSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Plus className="mr-2 size-4" />}
                  Add
                </Button>
              </div>
            </div>
            {commissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Loading commissions...</p>
            ) : (
              <div className="space-y-3">
                {commissions.map((commission) => (
                  <div key={commission.id} className="rounded-2xl border border-border/60 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold">{commission.categoryName}</p>
                        <p className="text-xs text-muted-foreground">ID: {commission.categoryId}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Commission %</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            className="w-20 h-8"
                            value={commission.commissionPercent}
                            onChange={(e) => {
                              const newCommissions = commissions.map(c =>
                                c.id === commission.id
                                  ? { ...c, commissionPercent: Number(e.target.value || 0) }
                                  : c
                              )
                              setCommissions(newCommissions)
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={commission.active}
                            onChange={(e) => {
                              const newCommissions = commissions.map(c =>
                                c.id === commission.id
                                  ? { ...c, active: e.target.checked }
                                  : c
                              )
                              setCommissions(newCommissions)
                            }}
                          />
                          <span className="text-xs text-muted-foreground">Active</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCommission(
                            commission.categoryId,
                            commission.commissionPercent,
                            commission.active
                          )}
                          disabled={commissionSaving}
                        >
                          {commissionSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCommission(commission.categoryId)}
                          disabled={commissionSaving}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
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
