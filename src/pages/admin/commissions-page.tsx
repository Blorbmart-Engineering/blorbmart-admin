import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'

import { AdminShell } from '@/components/admin/admin-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'

type CategoryCommission = {
  id: string
  categoryId: string
  categoryName: string
  commissionPercent: number
  active: boolean
}

const initialCommissionForm = {
  categoryId: '',
  categoryName: '',
  commissionPercent: 10
}

export function CommissionsPage() {
  const { apiFetchAuth } = useAuth()
  const [commissions, setCommissions] = useState<CategoryCommission[]>([])
  const [commissionSaving, setCommissionSaving] = useState(false)
  const [commissionForm, setCommissionForm] = useState(initialCommissionForm)

  const loadCommissions = useCallback(async () => {
    const response = await apiFetchAuth('/api/category-commission')
    const data = await response.json().catch(() => ({}))
    if (response.ok && Array.isArray(data?.data)) {
      setCommissions(data.data as CategoryCommission[])
    }
  }, [apiFetchAuth])

  useEffect(() => {
    loadCommissions()
  }, [loadCommissions])

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
    <AdminShell title="Commissions" subtitle="Manage platform commission rates by category.">
      <Card>
        <CardHeader>
          <CardTitle>Category Commissions</CardTitle>
          <CardDescription>Set and manage commission rates from the v1.1 policy.</CardDescription>
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
                          className="h-8 w-20"
                          value={commission.commissionPercent}
                          onChange={(e) => {
                            const newCommissions = commissions.map((c) =>
                              c.id === commission.id ? { ...c, commissionPercent: Number(e.target.value || 0) } : c
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
                            const newCommissions = commissions.map((c) =>
                              c.id === commission.id ? { ...c, active: e.target.checked } : c
                            )
                            setCommissions(newCommissions)
                          }}
                        />
                        <span className="text-xs text-muted-foreground">Active</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCommission(commission.categoryId, commission.commissionPercent, commission.active)}
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
    </AdminShell>
  )
}
