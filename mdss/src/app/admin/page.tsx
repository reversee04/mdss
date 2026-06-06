'use client'

import { useEffect, useState } from 'react'
import { StatCard } from '@/components/dashboard/stat-card'
import { DataTable } from '@/components/dashboard/data-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Database,
  Users,
  Building2,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { systemHealth, systemNotifications, apiIntegrations } from '@/lib/mock-data'

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [etlData, setEtlData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [encountersRes, facilitiesRes, etlRes] = await Promise.all([
          fetch('/api/analytics/encounters').then(r => r.json()),
          fetch('/api/analytics/facilities').then(r => r.json()),
          fetch('/api/admin/etl').then(r => r.json()),
        ]);

        setData({
          encounters: encountersRes.data,
          facilities: facilitiesRes.data,
        });

        if (etlRes.success) {
          setEtlData(etlRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch admin dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading system data...</p>
        </div>
      </div>
    );
  }

  const totalRecords = data.encounters?.totalEncounters || 0;
  const activeFacilitiesCount = Array.isArray(data.facilities) ? data.facilities.length : 0;
  // Mock total facilities based on the current system, since it's not provided by API
  const totalFacilities = 892;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Administration</h1>
        <p className="text-muted-foreground">
          Monitor system health, manage users, and oversee data pipelines
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Records"
          value={totalRecords}
          change="Live"
          changeType="neutral"
          description="from all encounters"
          icon={Database}
        />
        <StatCard
          title="Facilities Reporting"
          value={`${activeFacilitiesCount}/${totalFacilities}`}
          change={`${totalFacilities > 0 ? ((activeFacilitiesCount / totalFacilities) * 100).toFixed(1) : 0}%`}
          changeType="positive"
          description="compliance rate"
          icon={Building2}
        />
        <StatCard
          title="Active Users"
          value={127}
          change="+5"
          changeType="positive"
          description="online now"
          icon={Users}
        />
        <StatCard
          title="System Uptime"
          value={systemHealth.uptime}
          description="Last restart: 15 days ago"
          icon={Server}
        />
      </div>

      {/* System Health */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>Real-time monitoring of system resources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  CPU Usage
                </span>
                <span className="font-medium">{systemHealth.cpu}%</span>
              </div>
              <Progress value={systemHealth.cpu} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <MemoryStick className="h-4 w-4 text-muted-foreground" />
                  Memory
                </span>
                <span className="font-medium">{systemHealth.memory}%</span>
              </div>
              <Progress value={systemHealth.memory} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  Disk
                </span>
                <span className="font-medium">{systemHealth.disk}%</span>
              </div>
              <Progress value={systemHealth.disk} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Database Size</span>
                <span className="font-medium">{systemHealth.databaseSize}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Active Connections</span>
                <span className="font-medium">{systemHealth.activeConnections}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card> */}

      <Tabs defaultValue="etl" className="space-y-4">
        <TabsList>
          <TabsTrigger value="etl">ETL Monitoring</TabsTrigger>
          <TabsTrigger value="integrations">API Integrations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* ETL Monitoring */}
        <TabsContent value="etl" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>ETL Pipeline Status</CardTitle>
                <CardDescription>Data extraction, transformation, and loading logs</CardDescription>
              </div>
              <Button>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Failed
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                data={etlData?.etlLogs || []}
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

        {/* API Integrations */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Integration Status</CardTitle>
              <CardDescription>External system connections and sync status</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={apiIntegrations}
                columns={[
                  { key: 'name', header: 'Integration' },
                  {
                    key: 'endpoint',
                    header: 'Endpoint',
                    render: (item) => (
                      <code className="text-xs bg-muted px-2 py-1 rounded">{item.endpoint}</code>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (item) => (
                      <Badge
                        variant={
                          item.status === 'connected'
                            ? 'default'
                            : item.status === 'error'
                              ? 'destructive'
                              : 'secondary'
                        }
                        className={
                          item.status === 'connected'
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : item.status === 'degraded'
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                              : ''
                        }
                      >
                        {item.status}
                      </Badge>
                    ),
                  },
                  { key: 'lastSync', header: 'Last Sync' },
                  { key: 'responseTime', header: 'Response Time' },
                ]}
                searchPlaceholder="Search integrations..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Notifications</CardTitle>
              <CardDescription>Alerts, errors, and system messages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${!notification.read ? 'bg-muted/50' : ''
                      }`}
                  >
                    <div
                      className={`p-2 rounded-full ${notification.type === 'error'
                        ? 'bg-red-100 text-red-600'
                        : notification.type === 'warning'
                          ? 'bg-amber-100 text-amber-600'
                          : notification.type === 'success'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}
                    >
                      {notification.type === 'error' && <XCircle className="h-4 w-4" />}
                      {notification.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
                      {notification.type === 'success' && <CheckCircle className="h-4 w-4" />}
                      {notification.type === 'info' && <Activity className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{notification.title}</p>
                        <span className="text-xs text-muted-foreground">{notification.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
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
