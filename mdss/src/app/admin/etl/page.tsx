'use client'

import { DataTable } from '@/components/dashboard/data-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  Pause,
  Clock,
  ArrowDownToLine,
  ArrowRightLeft,
  ArrowUpFromLine,
  Calendar,
} from 'lucide-react'
import { etlLogs } from '@/lib/mock-data'

const pipelines = [
  {
    id: 1,
    name: 'DHIS2 Import',
    description: 'Daily import from District Health Information System',
    status: 'running',
    progress: 67,
    lastRun: '2024-01-15 08:00:00',
    nextRun: '2024-01-16 08:00:00',
    frequency: 'Daily at 08:00',
    recordsProcessed: 15420,
  },
  {
    id: 2,
    name: 'Laboratory Results Sync',
    description: 'Real-time sync from central lab system',
    status: 'completed',
    progress: 100,
    lastRun: '2024-01-15 10:30:00',
    nextRun: '2024-01-15 11:00:00',
    frequency: 'Every 30 minutes',
    recordsProcessed: 2845,
  },
  {
    id: 3,
    name: 'Facility Reports ETL',
    description: 'Weekly aggregation of facility reports',
    status: 'scheduled',
    progress: 0,
    lastRun: '2024-01-08 00:00:00',
    nextRun: '2024-01-15 00:00:00',
    frequency: 'Weekly on Sunday',
    recordsProcessed: 0,
  },
  {
    id: 4,
    name: 'WHO API Sync',
    description: 'External data sync from WHO disease database',
    status: 'failed',
    progress: 45,
    lastRun: '2024-01-15 06:00:00',
    nextRun: '2024-01-15 12:00:00',
    frequency: 'Every 6 hours',
    recordsProcessed: 1200,
    error: 'Connection timeout after 30s',
  },
  {
    id: 5,
    name: 'Data Quality Check',
    description: 'Validation and deduplication process',
    status: 'completed',
    progress: 100,
    lastRun: '2024-01-15 09:00:00',
    nextRun: '2024-01-15 21:00:00',
    frequency: 'Twice daily',
    recordsProcessed: 45000,
  },
]

const etlMetrics = {
  totalPipelines: 12,
  activePipelines: 8,
  failedToday: 2,
  recordsToday: 125450,
  avgProcessingTime: '4.2s',
  successRate: 94.5,
}

export default function ETLMonitoringPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ETL Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor data pipelines, extraction jobs, and transformation processes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule
          </Button>
          <Button>
            <Play className="mr-2 h-4 w-4" />
            Run All Pipelines
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pipelines</p>
                <p className="text-2xl font-bold">{etlMetrics.totalPipelines}</p>
              </div>
              <Database className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Now</p>
                <p className="text-2xl font-bold text-green-600">{etlMetrics.activePipelines}</p>
              </div>
              <Play className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed Today</p>
                <p className="text-2xl font-bold text-red-600">{etlMetrics.failedToday}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Records Today</p>
                <p className="text-2xl font-bold">{etlMetrics.recordsToday.toLocaleString()}</p>
              </div>
              <ArrowDownToLine className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Time</p>
                <p className="text-2xl font-bold">{etlMetrics.avgProcessingTime}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{etlMetrics.successRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pipelines" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipelines">
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Pipelines
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Database className="mr-2 h-4 w-4" />
            ETL Logs
          </TabsTrigger>
          <TabsTrigger value="extraction">
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Extraction
          </TabsTrigger>
          <TabsTrigger value="loading">
            <ArrowUpFromLine className="mr-2 h-4 w-4" />
            Loading
          </TabsTrigger>
        </TabsList>

        {/* Pipelines */}
        <TabsContent value="pipelines" className="space-y-4">
          <div className="grid gap-4">
            {pipelines.map((pipeline) => (
              <Card key={pipeline.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{pipeline.name}</h3>
                        <Badge
                          variant={
                            pipeline.status === 'completed'
                              ? 'default'
                              : pipeline.status === 'running'
                              ? 'secondary'
                              : pipeline.status === 'failed'
                              ? 'destructive'
                              : 'outline'
                          }
                          className={
                            pipeline.status === 'completed'
                              ? 'bg-green-100 text-green-800 hover:bg-green-100'
                              : pipeline.status === 'running'
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                              : ''
                          }
                        >
                          {pipeline.status === 'running' && (
                            <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                          )}
                          {pipeline.status === 'completed' && <CheckCircle className="mr-1 h-3 w-3" />}
                          {pipeline.status === 'failed' && <XCircle className="mr-1 h-3 w-3" />}
                          {pipeline.status === 'scheduled' && <Clock className="mr-1 h-3 w-3" />}
                          {pipeline.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{pipeline.description}</p>

                      {pipeline.status === 'running' && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{pipeline.progress}%</span>
                          </div>
                          <Progress value={pipeline.progress} className="h-2" />
                        </div>
                      )}

                      {pipeline.error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
                          <AlertTriangle className="h-4 w-4" />
                          {pipeline.error}
                        </div>
                      )}

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Frequency</span>
                          <p className="font-medium">{pipeline.frequency}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last Run</span>
                          <p className="font-medium">{pipeline.lastRun}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Next Run</span>
                          <p className="font-medium">{pipeline.nextRun}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Records Processed</span>
                          <p className="font-medium">{pipeline.recordsProcessed.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {pipeline.status === 'running' ? (
                        <Button variant="outline" size="sm">
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {pipeline.status === 'failed' && (
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ETL Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>ETL Execution Logs</CardTitle>
                <CardDescription>Detailed logs of all ETL operations</CardDescription>
              </div>
              <Button variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Failed
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                data={etlLogs}
                columns={[
                  { key: 'timestamp', header: 'Timestamp' },
                  { key: 'source', header: 'Source' },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (item) => (
                      <Badge
                        variant={
                          item.status === 'success'
                            ? 'default'
                            : item.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className={
                          item.status === 'success'
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : item.status === 'warning'
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                            : ''
                        }
                      >
                        {item.status === 'success' && <CheckCircle className="mr-1 h-3 w-3" />}
                        {item.status === 'failed' && <XCircle className="mr-1 h-3 w-3" />}
                        {item.status === 'warning' && <AlertTriangle className="mr-1 h-3 w-3" />}
                        {item.status}
                      </Badge>
                    ),
                  },
                  { key: 'records', header: 'Records' },
                  { key: 'duration', header: 'Duration' },
                  {
                    key: 'error',
                    header: 'Error',
                    render: (item) => (
                      <span className="text-sm text-muted-foreground">{item.error || '-'}</span>
                    ),
                  },
                ]}
                searchPlaceholder="Search ETL logs..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Extraction */}
        <TabsContent value="extraction" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Extraction Sources</CardTitle>
              <CardDescription>
                Configure and monitor data extraction from external systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'DHIS2 Database', type: 'PostgreSQL', status: 'connected', records: '15.2M' },
                  { name: 'Laboratory API', type: 'REST API', status: 'connected', records: '2.8M' },
                  { name: 'WHO External API', type: 'REST API', status: 'error', records: '450K' },
                  { name: 'Facility CSV Uploads', type: 'File Upload', status: 'connected', records: '125K' },
                ].map((source, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Database className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{source.name}</p>
                        <p className="text-sm text-muted-foreground">{source.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Records</p>
                        <p className="font-medium">{source.records}</p>
                      </div>
                      <Badge
                        variant={source.status === 'connected' ? 'default' : 'destructive'}
                        className={
                          source.status === 'connected'
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : ''
                        }
                      >
                        {source.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loading */}
        <TabsContent value="loading" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Loading Destinations</CardTitle>
              <CardDescription>Target databases and data warehouses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    name: 'MDSS Primary Database',
                    type: 'PostgreSQL',
                    status: 'healthy',
                    size: '48.5 GB',
                    writes: '12.4K/min',
                  },
                  {
                    name: 'Analytics Data Warehouse',
                    type: 'PostgreSQL',
                    status: 'healthy',
                    size: '125 GB',
                    writes: '5.2K/min',
                  },
                  {
                    name: 'Backup Replica',
                    type: 'PostgreSQL',
                    status: 'syncing',
                    size: '48.5 GB',
                    writes: '12.4K/min',
                  },
                ].map((dest, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Database className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{dest.name}</p>
                        <p className="text-sm text-muted-foreground">{dest.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Size</p>
                        <p className="font-medium">{dest.size}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Write Rate</p>
                        <p className="font-medium">{dest.writes}</p>
                      </div>
                      <Badge
                        variant={dest.status === 'healthy' ? 'default' : 'secondary'}
                        className={
                          dest.status === 'healthy'
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : dest.status === 'syncing'
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                            : ''
                        }
                      >
                        {dest.status === 'syncing' && <RefreshCw className="mr-1 h-3 w-3 animate-spin" />}
                        {dest.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
