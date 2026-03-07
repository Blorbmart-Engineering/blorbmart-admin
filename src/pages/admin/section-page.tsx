import { ArrowUpRight } from 'lucide-react'

import { AdminShell } from '@/components/admin/admin-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type AdminSectionKey, adminSections } from '@/data/admin'

type SectionPageProps = {
  sectionKey: AdminSectionKey
}

export function SectionPage({ sectionKey }: SectionPageProps) {
  const section = adminSections[sectionKey]

  return (
    <AdminShell title={section.title} subtitle={section.summary}>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {section.highlights.map((highlight) => (
              <div key={highlight} className="rounded-2xl border border-border/60 p-4">
                <p className="font-medium">{highlight}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Core features</CardTitle>
            <CardDescription>Frontend-ready blocks for this admin area.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {section.features.map((feature) => (
              <div key={feature} className="rounded-2xl border border-border/60 p-4">
                <p className="text-sm text-muted-foreground">{feature}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Available actions</CardTitle>
            <CardDescription>Example buttons you can later connect to API actions.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {['Review queue', 'Create new entry', 'Export current data', 'Open audit log'].map((action) => (
              <Button key={action} variant="outline" className="justify-between">
                {action}
                <ArrowUpRight className="size-4" />
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status badges</CardTitle>
            <CardDescription>Useful placeholder states for page-level UI.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {['Active', 'Pending', 'Needs Review', 'Suspended', 'Export Ready'].map((badge) => (
              <Badge key={badge} variant={badge === 'Active' ? 'secondary' : 'outline'}>
                {badge}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}
