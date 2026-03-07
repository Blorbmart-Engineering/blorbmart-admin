import { ArrowUpRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Stat = {
  label: string
  value: string
  change: string
}

export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-3">
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl">{item.value}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="gap-1">
              <ArrowUpRight className="size-3.5" />
              {item.change}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
