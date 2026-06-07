'use client'

import { useEffect, useState } from 'react'
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
  Loader2,
} from 'lucide-react'

type Pipeline = {
  id: string
  name: string
  status: 'completed' | 'running' | 'failed' | 'scheduled' | string
  description?: string
  progress?: number
  error?: string
  frequency?: string
  lastRun?: string
  nextRun?: string
  recordsProcessed?: number
}

type EtlLog = {
  timestamp: string
  source: string
  status: string
  records: number | string
  duration: string
  error?: string
}

type EtlMetrics = {
  totalPipelines?: number
  activePipelines?: number
  failedToday?: number
  recordsToday?: number
  avgProcessingTime?: string | number
  successRate?: number
}

type EtlData = {
  pipelines: Pipeline[]
  etlMetrics: EtlMetrics
  etlLogs: EtlLog[]
}

export default function ETLMonitoringPage() {
  const [loading, setLoading] = useState(true);
  const [etlData, setEtlData] = useState<EtlData | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/etl');
        const data = await response.json();
        if (data.success) {
          setEtlData(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch ETL data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRunAllPipelines = async () => {
    setSyncing(true);
    try {
      // Trigger the sync endpoint
      const response = await fetch('http://127.0.0.1:4000/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patients: [],
          encounters: [],
          diseases: [],
          facilities: []
        })
      });

      if (response.ok) {
        // Refresh ETL data after sync
        const etlResponse = await fetch('/api/admin/etl');
        const etlData = await etlResponse.json();
        if (etlData.success) {
          setEtlData(etlData.data);
        }
      }
    } catch (error) {
      console.error('Failed to run pipelines:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading ETL data...</p>
        </div>
      </div>
    );
  }

  const pipelines = etlData?.pipelines || [];
  const etlMetrics = etlData?.etlMetrics || {};
  const etlLogs = etlData?.etlLogs || [];

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
          <Button onClick={handleRunAllPipelines} disabled={syncing}>
            {syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {syncing ? 'Running...' : 'Run All Pipelines'}
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
                <p className="text-2xl font-bold">{etlMetrics.totalPipelines || 0}</p>
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
                <p className="text-2xl font-bold text-green-600">{etlMetrics.activePipelines || 0}</p>
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
                <p className="text-2xl font-bold text-red-600">{etlMetrics.failedToday || 0}</p>
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
                <p className="text-2xl font-bold">{(etlMetrics.recordsToday || 0).toLocaleString()}</p>
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
                <p className="text-2xl font-bold">{etlMetrics.avgProcessingTime || 'N/A'}</p>
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
                <p className="text-2xl font-bold text-green-600">{etlMetrics.successRate || 0}%</p>
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
                          <p className="font-medium">{pipeline.recordsProcessed !== undefined ? pipeline.recordsProcessed.toLocaleString() : '0'}</p>
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
