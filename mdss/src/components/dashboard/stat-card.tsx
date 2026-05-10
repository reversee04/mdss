'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: LucideIcon
  description?: string
  className?: string
}

export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  description,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        {(change || description) && (
          <p className="text-xs text-muted-foreground mt-1">
            {change && (
              <span
                className={cn(
                  'font-medium',
                  changeType === 'positive' && 'text-green-600 dark:text-green-400',
                  changeType === 'negative' && 'text-red-600 dark:text-red-400'
                )}
              >
                {change}
              </span>
            )}
            {change && description && ' '}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
