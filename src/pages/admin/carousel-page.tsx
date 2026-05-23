import { useEffect, useState, useCallback, useMemo } from 'react'
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  EyeOff, 
  GripVertical,
  Image as ImageIcon,
  Calendar,
  Check,
  X,
  Loader2
} from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { AdminShell } from '@/components/admin/admin-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'

interface CarouselSlide {
  id: string
  title: string
  subtitle?: string
  imageUrl: string
  actionType: 'product' | 'category' | 'url' | 'none'
  actionTarget?: string
  displayOrder: number
  isActive: boolean
  alwaysShow: boolean
  startDate?: string
  endDate?: string
  viewCount?: number
  clickCount?: number
}

function SlideImage({ src, alt, className }: { src?: string; alt: string; className: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <ImageIcon className="h-6 w-6 text-gray-400" />
      </div>
    )
  }
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
}

// Sortable Slide Item Component
function SortableSlideItem({ 
  slide, 
  onEdit, 
  onDelete, 
  onToggle,
  deleting,
  toggling
}: { 
  slide: CarouselSlide
  onEdit: (slide: CarouselSlide) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
  deleting: boolean
  toggling: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: slide.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isExpired = slide.endDate && new Date(slide.endDate) < new Date()
  const isScheduled = slide.startDate && new Date(slide.startDate) > new Date()

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Image Preview */}
      <div className="relative w-24 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
        <SlideImage src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-gray-900 truncate">{slide.title}</h4>
          <Badge variant={slide.isActive ? 'default' : 'secondary'}>
            {slide.isActive ? 'Active' : 'Inactive'}
          </Badge>
          {isExpired && <Badge variant="secondary" className="bg-red-100 text-red-800">Expired</Badge>}
          {isScheduled && <Badge variant="outline">Scheduled</Badge>}
        </div>
        {slide.subtitle && (
          <p className="text-sm text-gray-500 truncate">{slide.subtitle}</p>
        )}
        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
          <span>Order: {slide.displayOrder}</span>
          {slide.actionType !== 'none' && (
            <span>Action: {slide.actionType} → {slide.actionTarget}</span>
          )}
          {(slide.viewCount !== undefined) && (
            <span>👁 {slide.viewCount} | 🖱 {slide.clickCount || 0}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white/90 p-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggle(slide.id)}
          className="cursor-pointer text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          disabled={toggling || deleting}
          aria-label={slide.isActive ? 'Deactivate slide' : 'Activate slide'}
          title={slide.isActive ? 'Deactivate slide' : 'Activate slide'}
        >
          {toggling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : slide.isActive ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(slide)}
          className="cursor-pointer text-gray-700 hover:text-gray-900 hover:bg-blue-50"
          disabled={deleting || toggling}
          aria-label="Edit slide"
          title="Edit slide"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(slide.id)}
          className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
          disabled={deleting || toggling}
          aria-label="Delete slide"
          title="Delete slide"
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}

// Slide Form Component
function SlideForm({ 
  slide, 
  onSave, 
  onCancel,
  saving
}: { 
  slide?: CarouselSlide
  onSave: (data: any) => void
  onCancel: () => void
  saving: boolean
}) {
  const toDateTimeLocal = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  const detectDurationPreset = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return 'custom'
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffMs = end.getTime() - start.getTime()
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24))
    if (days === 5) return '5'
    if (days === 30) return '30'
    return 'custom'
  }

  const getDefaultWindow = (days: number) => {
    const start = new Date()
    const end = new Date(start)
    end.setDate(end.getDate() + days)
    return {
      startDate: toDateTimeLocal(start),
      endDate: toDateTimeLocal(end),
    }
  }

  const defaultWindow = getDefaultWindow(30)

  const [formData, setFormData] = useState({
    title: slide?.title || '',
    subtitle: slide?.subtitle || '',
    imageUrl: slide?.imageUrl || '',
    imageBase64: '',
    actionType: slide?.actionType || 'none',
    actionTarget: slide?.actionTarget || '',
    isActive: slide?.isActive ?? true,
    alwaysShow: slide?.alwaysShow ?? false,
    startDate: slide?.startDate
      ? new Date(slide.startDate).toISOString().slice(0, 16)
      : defaultWindow.startDate,
    endDate: slide?.endDate
      ? new Date(slide.endDate).toISOString().slice(0, 16)
      : defaultWindow.endDate,
  })
  const [imagePreview, setImagePreview] = useState(slide?.imageUrl || '')
  const [scheduleMode, setScheduleMode] = useState<'always' | 'duration'>(
    slide ? (slide.alwaysShow ? 'always' : 'duration') : 'duration'
  )
  const [durationPreset, setDurationPreset] = useState<'5' | '30' | 'custom'>(
    slide
      ? (detectDurationPreset(slide?.startDate, slide?.endDate) as '5' | '30' | 'custom')
      : '30'
  )

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setFormData(prev => ({ ...prev, imageBase64: base64 }))
        setImagePreview(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
      {/* Image Upload */}
      <div className="space-y-2">
        <Label>Slide Image</Label>
        <div className="flex gap-4">
          <div className="relative w-40 h-24 rounded-lg overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300">
            {imagePreview ? (
              <img 
                src={imagePreview} 
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="h-8 w-8 mb-1" />
                <span className="text-xs">No image</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mb-2"
            />
            <p className="text-xs text-gray-500">
              Recommended: 1200x600px, JPG or PNG
            </p>
          </div>
        </div>
      </div>

      {/* Title & Subtitle */}
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Summer Sale"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtitle">Subtitle</Label>
        <Input
          id="subtitle"
          value={formData.subtitle}
          onChange={e => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
          placeholder="Up to 50% off all items"
        />
      </div>

      {/* Action Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Action Type</Label>
            <Select
              value={formData.actionType}
              onValueChange={(value: 'product' | 'category' | 'url' | 'none') =>
                setFormData(prev => ({ ...prev, actionType: value }))
              }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Action</SelectItem>
              <SelectItem value="product">Go to Product</SelectItem>
              <SelectItem value="category">Go to Category</SelectItem>
              <SelectItem value="url">External URL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.actionType !== 'none' && (
          <div className="space-y-2">
            <Label htmlFor="actionTarget">
              {formData.actionType === 'product' && 'Product ID'}
              {formData.actionType === 'category' && 'Category ID'}
              {formData.actionType === 'url' && 'URL'}
            </Label>
            <Input
              id="actionTarget"
              value={formData.actionTarget}
              onChange={e => setFormData(prev => ({ ...prev, actionTarget: e.target.value }))}
              placeholder={
                formData.actionType === 'url' ? 'https://...' : 'Enter ID'
              }
            />
          </div>
        )}
      </div>

      {/* Scheduling */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Scheduling
          </Label>
          <div className="flex items-center gap-2">
            <Switch
              checked={scheduleMode === 'duration'}
              onCheckedChange={(checked) => {
                const mode = checked ? 'duration' : 'always'
                setScheduleMode(mode)
                setFormData((prev) => ({
                  ...prev,
                  alwaysShow: mode === 'always',
                  ...(mode === 'always' ? { startDate: '', endDate: '' } : {}),
                }))
              }}
            />
            <span className="text-sm text-gray-600">Run for a limited time</span>
          </div>
        </div>

        {scheduleMode === 'duration' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select
                value={durationPreset}
                onValueChange={(value: '5' | '30' | 'custom') => {
                  setDurationPreset(value)
                  if (value === 'custom') return
                  const start = new Date()
                  const end = new Date(start)
                  end.setDate(end.getDate() + Number(value))
                  setFormData((prev) => ({
                    ...prev,
                    alwaysShow: false,
                    startDate: toDateTimeLocal(start),
                    endDate: toDateTimeLocal(end),
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="custom">Custom dates</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {durationPreset === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
            )}
            <div className="text-xs text-gray-500">
              Tip: choose 5 or 30 days for quick scheduling, or use custom dates for exact timing.
            </div>
          </div>
        )}
      </div>

      {/* Active Status */}
      <div className="flex items-center gap-2 border-t pt-4">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
        />
        <Label>Slide is active</Label>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1 cursor-pointer disabled:cursor-not-allowed" disabled={saving}>
          <Check className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : slide ? 'Update Slide' : 'Create Slide'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving} className="cursor-pointer disabled:cursor-not-allowed">
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  )
}

// Main Carousel Page
export function CarouselPage() {
  const { apiFetchAuth } = useAuth()
  const API_BASE = import.meta.env.VITE_API_URL || ''
  const [slides, setSlides] = useState<CarouselSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | undefined>()
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [previewSlideId, setPreviewSlideId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({})
  const [togglingIds, setTogglingIds] = useState<Record<string, boolean>>({})

  const resolveImageUrl = useCallback((value?: string) => {
    if (!value) return ''
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) return value
    if (value.startsWith('/')) return `${API_BASE}${value}`
    return value
  }, [API_BASE])

  const normalizeSlide = useCallback((raw: any): CarouselSlide => {
    const imageCandidate =
      raw.imageUrl ||
      raw.imageURL ||
      raw.image ||
      raw.bannerImage ||
      raw.banner ||
      ''

    return {
      ...raw,
      imageUrl: resolveImageUrl(imageCandidate),
    } as CarouselSlide
  }, [resolveImageUrl])

  // Fetch slides
  const fetchSlides = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      const response = await apiFetchAuth('/api/admin/carousel')
      if (!response.ok) throw new Error('Failed to load carousel slides')
      const data = await response.json()
      if (data.status === 'success') {
        setSlides(Array.isArray(data.data) ? data.data.map(normalizeSlide) : [])
      }
    } catch (error) {
      toast.error('Failed to load carousel slides')
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }, [apiFetchAuth, normalizeSlide])

  useEffect(() => {
    fetchSlides()
  }, [fetchSlides])

  // Handle drag end
  const handleDragEnd = useCallback(async (event: any) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    if (active.id !== over.id) {
      setSlides((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id)
        const newIndex = items.findIndex(item => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        
        // Update display order
        const reordered = newItems.map((item, index) => ({
          id: item.id,
          displayOrder: index + 1
        }))

        // Send reorder API call
        setReordering(true)
        apiFetchAuth('/api/admin/carousel/reorder', {
          method: 'PATCH',
          body: JSON.stringify({ slideOrders: reordered }),
        }).then(() => {
          toast.success('Order updated')
        }).catch(() => {
          toast.error('Failed to update order')
        }).finally(() => {
          setReordering(false)
        })

        return newItems.map((item, index) => ({ ...item, displayOrder: index + 1 }))
      })
    }
  }, [apiFetchAuth])

  // Create/Update slide
  const handleSave = async (formData: any) => {
    if (saving) return
    try {
      setSaving(true)
      const isEditing = !!editingSlide
      const path = isEditing 
        ? `/api/admin/carousel/${editingSlide.id}`
        : '/api/admin/carousel'

      const response = await apiFetchAuth(path, {
        method: isEditing ? 'PUT' : 'POST',
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.status === 'success') {
        toast.success(isEditing ? 'Slide updated' : 'Slide created')
        setDialogOpen(false)
        setEditingSlide(undefined)
        fetchSlides()
      } else {
        toast.error(data.message || 'Failed to save slide')
      }
    } catch (error) {
      toast.error('Failed to save slide')
    } finally {
      setSaving(false)
    }
  }

  // Delete slide
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slide?')) return

    try {
      setDeletingIds((prev) => ({ ...prev, [id]: true }))
      const response = await apiFetchAuth(`/api/admin/carousel/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (data.status === 'success') {
        toast.success('Slide deleted')
        fetchSlides()
      } else {
        toast.error(data.message || 'Failed to delete slide')
      }
    } catch (error) {
      toast.error('Failed to delete slide')
    } finally {
      setDeletingIds((prev) => ({ ...prev, [id]: false }))
    }
  }

  // Toggle status
  const handleToggle = async (id: string) => {
    try {
      setTogglingIds((prev) => ({ ...prev, [id]: true }))
      const response = await apiFetchAuth(`/api/admin/carousel/${id}/toggle`, {
        method: 'PATCH',
      })

      const data = await response.json()
      if (data.status === 'success') {
        toast.success(data.message)
        fetchSlides()
      } else {
        toast.error(data.message || 'Failed to toggle status')
      }
    } catch (error) {
      toast.error('Failed to toggle status')
    } finally {
      setTogglingIds((prev) => ({ ...prev, [id]: false }))
    }
  }

  // Edit slide
  const handleEdit = (slide: CarouselSlide) => {
    setEditingSlide(slide)
    setDialogOpen(true)
  }

  // Create new slide
  const handleCreate = () => {
    setEditingSlide(undefined)
    setDialogOpen(true)
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const activeSlides = slides.filter(s => s.isActive).length
  const scheduledSlides = slides.filter(s => {
    if (s.alwaysShow || !s.startDate) return false
    return new Date(s.startDate) > new Date()
  }).length
  const filteredSlides = useMemo(
    () =>
      slides.filter((slide) => {
        if (statusFilter === 'active') return slide.isActive
        if (statusFilter === 'inactive') return !slide.isActive
        return true
      }),
    [slides, statusFilter]
  )
  const previewSlide =
    slides.find((slide) => slide.id === previewSlideId) ||
    slides.find((slide) => slide.isActive) ||
    null

  return (
    <AdminShell 
      title="Promotional Carousel" 
      subtitle="Manage homepage banners and promotional slides for the buyer app"
    >
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Slides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{slides.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeSlides}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{scheduledSlides}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {slides.length - activeSlides}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div className="text-sm text-gray-500">
          {reordering ? 'Updating order...' : 'Drag to reorder slides. Max 10 slides allowed.'}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Filter slides" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Slides</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => fetchSlides(true)}
            disabled={refreshing}
            className="cursor-pointer disabled:cursor-not-allowed"
          >
            {refreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Refresh
          </Button>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate} className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Add Slide
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingSlide ? 'Edit Slide' : 'Create New Slide'}
              </DialogTitle>
            </DialogHeader>
            <SlideForm
              slide={editingSlide}
              onSave={handleSave}
              saving={saving}
              onCancel={() => {
                setDialogOpen(false)
                setEditingSlide(undefined)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Slides List */}
      <Card>
        <CardHeader>
          <CardTitle>Carousel Slides</CardTitle>
          <CardDescription>
            Manage slides that appear on the buyer app homepage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : filteredSlides.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No slides match this filter.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredSlides.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {filteredSlides.map((slide) => (
                    <div
                      key={slide.id}
                      onClick={() => setPreviewSlideId(slide.id)}
                      className="rounded-lg ring-offset-background focus-within:ring-2 focus-within:ring-ring"
                    >
                      <SortableSlideItem
                        slide={slide}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggle={handleToggle}
                        deleting={!!deletingIds[slide.id]}
                        toggling={!!togglingIds[slide.id]}
                      />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Mobile Preview</CardTitle>
          <CardDescription>
            This is how the carousel appears on the buyer app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="w-[375px] h-[200px] bg-gray-100 rounded-2xl overflow-hidden border-4 border-gray-800 relative">
              {previewSlide ? (
                <div className="relative w-full h-full">
                  <SlideImage src={previewSlide.imageUrl} alt="Carousel preview" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <h3 className="text-white font-semibold">
                      {previewSlide.title}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {previewSlide.subtitle}
                    </p>
                  </div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {slides.filter(s => s.isActive).slice(0, 5).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i === 0 ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No active slides to preview
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  )
}
