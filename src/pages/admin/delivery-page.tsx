import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'

import { AdminShell } from '@/components/admin/admin-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'

type DeliveryLandmark = {
  id: string
  name: string
  price: number
  active: boolean
}

type SettingsPayload = {
  deliveryFee: number
  requireLandmark: boolean
  addressNotes: string
}

const initialLandmarkForm = {
  name: '',
  price: 0
}

export function DeliveryPage() {
  const { apiFetchAuth } = useAuth()
  const [landmarks, setLandmarks] = useState<DeliveryLandmark[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [landmarkForm, setLandmarkForm] = useState(initialLandmarkForm)
  const [settings, setSettings] = useState<SettingsPayload>({
    deliveryFee: 500,
    requireLandmark: true,
    addressNotes: 'Provide a clear landmark for easier delivery.'
  })

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [landmarksRes, settingsRes] = await Promise.all([
      apiFetchAuth('/api/admin/delivery-landmarks'),
      apiFetchAuth('/api/admin/settings')
    ])

    const landmarksData = await landmarksRes.json().catch(() => ({}))
    const settingsData = await settingsRes.json().catch(() => ({}))

    if (landmarksRes.ok && Array.isArray(landmarksData?.data)) {
      setLandmarks(landmarksData.data as DeliveryLandmark[])
    }
    if (settingsRes.ok && settingsData?.data) {
      setSettings({
        deliveryFee: Number(settingsData.data.deliveryFee ?? 500),
        requireLandmark: Boolean(settingsData.data.requireLandmark ?? true),
        addressNotes: String(settingsData.data.addressNotes ?? '')
      })
    }
    setLoading(false)
  }, [apiFetchAuth])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const addLandmark = async () => {
    if (!landmarkForm.name.trim()) return
    setSaving(true)
    await apiFetchAuth('/api/admin/delivery-landmarks', {
      method: 'POST',
      body: JSON.stringify({
        name: landmarkForm.name.trim(),
        price: Number(landmarkForm.price || 0),
        active: true
      })
    })
    setLandmarkForm(initialLandmarkForm)
    await loadAll()
    setSaving(false)
  }

  const saveLandmark = async (landmark: DeliveryLandmark) => {
    setSaving(true)
    await apiFetchAuth(`/api/admin/delivery-landmarks/${landmark.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: landmark.name,
        price: Number(landmark.price || 0),
        active: landmark.active
      })
    })
    await loadAll()
    setSaving(false)
  }

  const removeLandmark = async (id: string) => {
    setSaving(true)
    await apiFetchAuth(`/api/admin/delivery-landmarks/${id}`, { method: 'DELETE' })
    await loadAll()
    setSaving(false)
  }

  const saveSettings = async () => {
    setSaving(true)
    await apiFetchAuth('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        deliveryFee: Number(settings.deliveryFee || 0),
        requireLandmark: true,
        addressNotes: settings.addressNotes
      })
    })
    await loadAll()
    setSaving(false)
  }

  return (
    <AdminShell title="Delivery" subtitle="Manage delivery landmarks and location-based pricing.">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Delivery Rules</CardTitle>
            <CardDescription>Global fallback fee and required landmark notes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Fallback delivery fee (NGN)</Label>
              <Input
                type="number"
                value={settings.deliveryFee}
                onChange={(e) => setSettings((prev) => ({ ...prev, deliveryFee: Number(e.target.value || 0) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Address note</Label>
              <Input
                value={settings.addressNotes}
                onChange={(e) => setSettings((prev) => ({ ...prev, addressNotes: e.target.value }))}
              />
            </div>
            <p className="text-xs text-muted-foreground">Landmark is enforced for all orders at backend checkout.</p>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
              Save delivery settings
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Landmark Pricing</CardTitle>
            <CardDescription>Set landmark name and delivery price for faster checkout pricing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/60 p-4">
              <p className="mb-3 text-sm font-medium">Add delivery landmark</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  placeholder="Landmark name"
                  value={landmarkForm.name}
                  onChange={(e) => setLandmarkForm((prev) => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="Price (NGN)"
                  value={landmarkForm.price}
                  onChange={(e) => setLandmarkForm((prev) => ({ ...prev, price: Number(e.target.value || 0) }))}
                />
                <Button onClick={addLandmark} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Plus className="mr-2 size-4" />}
                  Add Landmark
                </Button>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading delivery landmarks...</p>
            ) : (
              <div className="space-y-3">
                {landmarks.map((landmark) => (
                  <div key={landmark.id} className="rounded-2xl border border-border/60 p-4">
                    <div className="grid gap-3 sm:grid-cols-[1.4fr_0.8fr_auto_auto_auto] sm:items-center">
                      <Input
                        value={landmark.name}
                        onChange={(e) =>
                          setLandmarks((prev) => prev.map((l) => (l.id === landmark.id ? { ...l, name: e.target.value } : l)))
                        }
                      />
                      <Input
                        type="number"
                        value={landmark.price}
                        onChange={(e) =>
                          setLandmarks((prev) => prev.map((l) => (l.id === landmark.id ? { ...l, price: Number(e.target.value || 0) } : l)))
                        }
                      />
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={landmark.active}
                          onChange={(e) =>
                            setLandmarks((prev) => prev.map((l) => (l.id === landmark.id ? { ...l, active: e.target.checked } : l)))
                          }
                        />
                        Active
                      </label>
                      <Button variant="outline" size="sm" onClick={() => saveLandmark(landmark)} disabled={saving}>
                        <Save className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeLandmark(landmark.id)} disabled={saving}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {landmarks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No landmarks yet. Add one to start location pricing.</p>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}
