import { useCallback, useEffect, useState } from 'react'
import {
  Bell,
  Mail,
  Megaphone,
  Send,
  Users,
  Loader2,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { AdminShell } from '@/components/admin/admin-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'

type BroadcastType = 'push' | 'email' | 'both'
type Audience = 'all' | 'buyers' | 'vendors'

interface BroadcastRecord {
  id: string
  type: BroadcastType
  title?: string
  subject?: string
  body: string
  audience: Audience
  result: {
    push?: { sentCount: number; failedCount: number; totalTokens: number; skipped?: boolean }
    email?: { sentCount: number; failedCount: number; totalEmails: number; skipped?: boolean }
  }
  sentAt?: { _seconds: number }
  createdAt?: string
}

const TYPE_OPTIONS: { value: BroadcastType; label: string; icon: typeof Bell; desc: string }[] = [
  { value: 'push', label: 'Push Notification', icon: Bell, desc: 'Sends to all devices with the app installed' },
  { value: 'email', label: 'Email', icon: Mail, desc: 'Sends an email to all matching accounts' },
  { value: 'both', label: 'Push + Email', icon: Megaphone, desc: 'Sends both at the same time' },
]

const AUDIENCE_OPTIONS: { value: Audience; label: string; desc: string }[] = [
  { value: 'all', label: 'Everyone', desc: 'All registered users' },
  { value: 'buyers', label: 'Buyers only', desc: 'Customer accounts' },
  { value: 'vendors', label: 'Vendors only', desc: 'Seller and kitchen accounts' },
]

function formatDate(record: BroadcastRecord) {
  const secs = record.sentAt?._seconds
  if (secs) return new Date(secs * 1000).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
  if (record.createdAt) return new Date(record.createdAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
  return '—'
}

function ResultBadge({ result }: { result: BroadcastRecord['result'] }) {
  const parts: string[] = []
  if (result.push && !result.push.skipped) parts.push(`${result.push.sentCount} push`)
  if (result.email && !result.email.skipped) parts.push(`${result.email.sentCount} email`)
  if (!parts.length) return <Badge variant="secondary">0 sent</Badge>
  return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{parts.join(' + ')} delivered</Badge>
}

export function BroadcastPage() {
  const { apiFetchAuth } = useAuth()

  const [type, setType] = useState<BroadcastType>('push')
  const [audience, setAudience] = useState<Audience>('all')
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [history, setHistory] = useState<BroadcastRecord[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const needsTitle = type === 'push' || type === 'both'
  const needsSubject = type === 'email' || type === 'both'

  const isValid =
    body.trim().length > 0 &&
    (!needsTitle || title.trim().length > 0) &&
    (!needsSubject || subject.trim().length > 0)

  const typeLabel = TYPE_OPTIONS.find((t) => t.value === type)?.label ?? type
  const audienceLabel = AUDIENCE_OPTIONS.find((a) => a.value === audience)?.label ?? audience

  const fetchHistory = useCallback(async () => {
    try {
      const res = await apiFetchAuth('/api/admin/broadcast/history')
      const data = await res.json().catch(() => ({}))
      if (data.status === 'success') setHistory(data.data ?? [])
    } catch {
      // non-fatal
    } finally {
      setLoadingHistory(false)
    }
  }, [apiFetchAuth])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const executeSend = async () => {
    setConfirmOpen(false)
    setSending(true)
    try {
      const res = await apiFetchAuth('/api/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify({ type, title, subject, body, audience }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Broadcast failed')

      const r = data.data ?? {}
      const pushSent = r.push?.sentCount ?? 0
      const emailSent = r.email?.sentCount ?? 0
      const total = pushSent + emailSent
      toast.success(`Broadcast sent to ${total} recipient${total !== 1 ? 's' : ''}`)

      setTitle('')
      setSubject('')
      setBody('')
      fetchHistory()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Broadcast failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <AdminShell
      title="Broadcast"
      subtitle="Send push notifications or emails to your entire user base"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

        {/* Compose panel */}
        <div className="space-y-5">

          {/* Channel selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Channel</CardTitle>
              <CardDescription>Choose how to reach your users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {TYPE_OPTIONS.map(({ value, label, icon: Icon, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    className={[
                      'flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all',
                      type === value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30'
                        : 'border-border hover:border-indigo-300 hover:bg-muted/40',
                    ].join(' ')}
                  >
                    <div className={[
                      'flex size-8 items-center justify-center rounded-lg',
                      type === value ? 'bg-indigo-500 text-white' : 'bg-muted text-muted-foreground',
                    ].join(' ')}>
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{label}</div>
                      <div className="text-xs text-muted-foreground">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Audience selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Audience</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {AUDIENCE_OPTIONS.map(({ value, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAudience(value)}
                    className={[
                      'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
                      audience === value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/30'
                        : 'border-border hover:border-indigo-300 hover:bg-muted/40',
                    ].join(' ')}
                  >
                    <Users className={['size-4 shrink-0', audience === value ? 'text-indigo-500' : 'text-muted-foreground'].join(' ')} />
                    <div>
                      <div className="text-sm font-semibold">{label}</div>
                      <div className="text-xs text-muted-foreground">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Message composer */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {needsTitle && (
                <div className="space-y-1.5">
                  <Label htmlFor="bc-title">
                    Notification Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bc-title"
                    placeholder="e.g. New feature available!"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">{title.length}/100</p>
                </div>
              )}

              {needsSubject && (
                <div className="space-y-1.5">
                  <Label htmlFor="bc-subject">
                    Email Subject <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bc-subject"
                    placeholder="e.g. Important update from Blorbmart"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={150}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="bc-body">
                  Message Body <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="bc-body"
                  rows={5}
                  placeholder="Write your message here..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={1000}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
                <p className="text-xs text-muted-foreground">{body.length}/1000</p>
              </div>

              <Button
                className="w-full"
                disabled={!isValid || sending}
                onClick={() => setConfirmOpen(true)}
              >
                {sending ? (
                  <><Loader2 className="mr-2 size-4 animate-spin" />Sending…</>
                ) : (
                  <><Send className="mr-2 size-4" />Send Broadcast</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview + History panel */}
        <div className="space-y-5">

          {/* Live preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(type === 'push' || type === 'both') && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Push notification</p>
                  <div className="rounded-2xl border border-border bg-zinc-900 p-3 shadow-lg">
                    <div className="flex items-start gap-2.5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white">
                        <Bell className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white">
                          {title || <span className="italic text-zinc-400">Notification title…</span>}
                        </div>
                        <div className="mt-0.5 text-xs text-zinc-300 line-clamp-2">
                          {body || <span className="italic text-zinc-500">Message body…</span>}
                        </div>
                      </div>
                      <span className="ml-auto shrink-0 text-[10px] text-zinc-400">now</span>
                    </div>
                  </div>
                </div>
              )}

              {(type === 'email' || type === 'both') && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email preview</p>
                  <div className="rounded-xl border border-border bg-white p-4 text-sm shadow-sm">
                    <div className="mb-3 rounded-lg bg-orange-500 px-3 py-2">
                      <span className="text-sm font-bold text-white">Blorbmart</span>
                    </div>
                    <div className="mb-2 font-semibold text-gray-900">
                      {subject || <span className="italic text-gray-400">Email subject…</span>}
                    </div>
                    <div className="whitespace-pre-wrap text-xs leading-relaxed text-gray-600">
                      {body || <span className="italic text-gray-400">Message body…</span>}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Broadcasts</CardTitle>
              <CardDescription>Last 20 messages sent</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : history.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No broadcasts yet.</p>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="rounded-xl border border-border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {item.type === 'push' && <Bell className="size-3.5 shrink-0 text-indigo-500" />}
                          {item.type === 'email' && <Mail className="size-3.5 shrink-0 text-blue-500" />}
                          {item.type === 'both' && <Megaphone className="size-3.5 shrink-0 text-orange-500" />}
                          <span className="text-sm font-semibold line-clamp-1">
                            {item.title || item.subject || '(no title)'}
                          </span>
                        </div>
                        <ResultBadge result={item.result} />
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />{formatDate(item)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="size-3" />{item.audience}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Confirm Broadcast
            </DialogTitle>
            <DialogDescription>
              This will be sent immediately and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Channel</span>
              <span className="font-semibold">{typeLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Audience</span>
              <span className="font-semibold">{audienceLabel}</span>
            </div>
            {needsTitle && title && (
              <div className="flex justify-between gap-4">
                <span className="shrink-0 text-muted-foreground">Title</span>
                <span className="text-right font-semibold">{title}</span>
              </div>
            )}
            {needsSubject && subject && (
              <div className="flex justify-between gap-4">
                <span className="shrink-0 text-muted-foreground">Subject</span>
                <span className="text-right font-semibold">{subject}</span>
              </div>
            )}
            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground line-clamp-3">{body}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmOpen(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={executeSend}
              disabled={sending}
            >
              {sending ? (
                <><Loader2 className="mr-2 size-4 animate-spin" />Sending…</>
              ) : (
                <><Send className="mr-2 size-4" />Send Now</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  )
}
