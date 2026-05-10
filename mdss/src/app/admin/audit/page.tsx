'use client'

import { DataTable } from '@/components/dashboard/data-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FilterPanel } from '@/components/dashboard/filter-panel'
import { Download, FileText, User, Database, Settings, Bell } from 'lucide-react'
import { auditLogs } from '@/lib/mock-data'

const getResourceIcon = (resource: string) => {
  switch (resource) {
    case 'Users':
      return <User className="h-4 w-4" />
    case 'Reports':
      return <FileText className="h-4 w-4" />
    case 'Data Pipeline':
    case 'Database':
      return <Database className="h-4 w-4" />
    case 'Alerts':
      return <Bell className="h-4 w-4" />
    case 'System Config':
    case 'Application':
      return <Settings className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all system activities and user actions
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <FilterPanel
            showDisease={false}
            showLocation={false}
            showDateRange={true}
            showTimeRange={false}
          />
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Complete history of system events and user actions</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={auditLogs}
            columns={[
              { key: 'timestamp', header: 'Timestamp' },
              {
                key: 'user',
                header: 'User',
                render: (item) => (
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">
                        {item.user === 'System' ? 'S' : item.user.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <span className={item.user === 'System' ? 'text-muted-foreground italic' : ''}>
                      {item.user}
                    </span>
                  </div>
                ),
              },
              {
                key: 'action',
                header: 'Action',
                render: (item) => (
                  <Badge variant="outline">{item.action}</Badge>
                ),
              },
              {
                key: 'resource',
                header: 'Resource',
                render: (item) => (
                  <div className="flex items-center gap-2">
                    {getResourceIcon(item.resource)}
                    <span>{item.resource}</span>
                  </div>
                ),
              },
              {
                key: 'details',
                header: 'Details',
                render: (item) => (
                  <span className="text-sm text-muted-foreground max-w-xs truncate block">
                    {item.details}
                  </span>
                ),
              },
            ]}
            searchPlaceholder="Search audit logs..."
            pageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  )
}
