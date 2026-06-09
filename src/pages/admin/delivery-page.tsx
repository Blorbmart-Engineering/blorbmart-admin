import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

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
  campusDeliveryFee: number
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
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [landmarkForm, setLandmarkForm] = useState(initialLandmarkForm)
  const [settings, setSettings] = useState<SettingsPayload>({
    deliveryFee: 500,
    campusDeliveryFee: 300,
    requireLandmark: true,
    addressNotes: 'Provide a clear landmark for easier delivery.'
  })

  const loadAll = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [landmarksRes, settingsRes] = await Promise.all([
        apiFetchAuth('/api/admin/delivery-landmarks'),
        apiFetchAuth('/api/admin/settings')
      ])

      const landmarksData = await landmarksRes.json().catch(() => ({}))
      const settingsData = await settingsRes.json().catch(() => ({}))

      if (landmarksRes.ok && Array.isArray(landmarksData?.data)) {
        setLandmarks(landmarksData.data as DeliveryLandmark[])
      } else if (!landmarksRes.ok) {
        setLoadError('Failed to load delivery landmarks.')
      }
      if (settingsRes.ok && settingsData?.data) {
        setSettings({
          deliveryFee: Number(settingsData.data.deliveryFee ?? 500),
          campusDeliveryFee: Number(settingsData.data.campusDeliveryFee ?? 300),
          requireLandmark: Boolean(settingsData.data.requireLandmark ?? true),
          addressNotes: String(settingsData.data.addressNotes ?? '')
        })
      }
    } catch {
      setLoadError('Failed to load delivery data.')
    } finally {
      setLoading(false)
    }
  }, [apiFetchAuth])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const addLandmark = async () => {
    if (!landmarkForm.name.trim()) return
    setSaving(true)
    try {
      const response = await apiFetchAuth('/api/admin/delivery-landmarks', {
        method: 'POST',
        body: JSON.stringify({
          name: landmarkForm.name.trim(),
          price: Number(landmarkForm.price || 0),
          active: true
        })
      })
      if (response.ok) {
        toast.success('Landmark added')
        setLandmarkForm(initialLandmarkForm)
        await loadAll()
      } else {
        const data = await response.json().catch(() => ({}))
        toast.error(data?.message || 'Failed to add landmark')
      }
    } catch {
      toast.error('Failed to add landmark')
    } finally {
      setSaving(false)
    }
  }

  const saveLandmark = async (landmark: DeliveryLandmark) => {
    setSaving(true)
    try {
      const response = await apiFetchAuth(`/api/admin/delivery-landmarks/${landmark.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: landmark.name,
          price: Number(landmark.price || 0),
          active: landmark.active
        })
      })
      if (response.ok) {
        toast.success('Landmark saved')
        await loadAll()
      } else {
        const data = await response.json().catch(() => ({}))
        toast.error(data?.message || 'Failed to save landmark')
      }
    } catch {
      toast.error('Failed to save landmark')
    } finally {
      setSaving(false)
    }
  }

  const removeLandmark = async (id: string) => {
    setSaving(true)
    try {
      const response = await apiFetchAuth(`/api/admin/delivery-landmarks/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Landmark removed')
        await loadAll()
      } else {
        const data = await response.json().catch(() => ({}))
        toast.error(data?.message || 'Failed to remove landmark')
      }
    } catch {
      toast.error('Failed to remove landmark')
    } finally {
      setSaving(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await apiFetchAuth('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          deliveryFee: Number(settings.deliveryFee || 0),
          campusDeliveryFee: Number(settings.campusDeliveryFee || 0),
          requireLandmark: settings.requireLandmark,
          addressNotes: settings.addressNotes
        })
      })
      if (response.ok) {
        toast.success('Delivery settings saved')
        await loadAll()
      } else {
        const data = await response.json().catch(() => ({}))
        toast.error(data?.message || 'Failed to save settings')
      }
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminShell title="Delivery" subtitle="Manage delivery landmarks and location-based pricing.">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Delivery Rules</CardTitle>
            <CardDescription>Campus and off-campus delivery fees.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>On-campus delivery fee (NGN)</Label>
              <Input
                type="number"
                value={settings.campusDeliveryFee}
                onChange={(e) => setSettings((prev) => ({ ...prev, campusDeliveryFee: Number(e.target.value || 0) }))}
              />
              <p className="text-xs text-muted-foreground">Flat fee charged for any order delivered to a campus location below.</p>
            </div>
            <div className="space-y-2">
              <Label>Off-campus fallback delivery fee (NGN)</Label>
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
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={settings.requireLandmark}
                onChange={(e) => setSettings((prev) => ({ ...prev, requireLandmark: e.target.checked }))}
              />
              Require a landmark for off-campus orders
            </label>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
              Save delivery settings
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Campus Locations</CardTitle>
            <CardDescription>These show up as a dropdown when buyers choose "On Campus" delivery. Price is shown for reference; the flat on-campus fee above is what's charged.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/60 p-4">
              <p className="mb-3 text-sm font-medium">Add campus location</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  placeholder="Location name (e.g. Hostel A)"
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
                  Add Location
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading delivery landmarks...
              </div>
            ) : loadError ? (
              <p className="text-sm text-destructive">{loadError}</p>
            ) : (
              <div className="space-y-3">
                {landmarks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No landmarks yet. Add one to start location pricing.</p>
                ) : landmarks.map((landmark) => (
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}
