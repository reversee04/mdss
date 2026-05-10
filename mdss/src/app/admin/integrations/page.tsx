'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Globe, 
  RefreshCw, 
  Settings, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Clock,
  Activity,
  Database,
  Server,
  Wifi,
  WifiOff,
  ExternalLink,
  Trash2,
  Edit
} from 'lucide-react'
import { apiIntegrations } from '@/lib/mock-data'

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'connected':
      return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="w-3 h-3 mr-1" />Connected</Badge>
    case 'error':
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Error</Badge>
    case 'degraded':
      return <Badge className="bg-warning text-warning-foreground"><AlertTriangle className="w-3 h-3 mr-1" />Degraded</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'connected':
      return <Wifi className="h-5 w-5 text-success" />
    case 'error':
      return <WifiOff className="h-5 w-5 text-destructive" />
    case 'degraded':
      return <AlertTriangle className="h-5 w-5 text-warning" />
    default:
      return <Globe className="h-5 w-5 text-muted-foreground" />
  }
}

export default function IntegrationsPage() {
  const connectedCount = apiIntegrations.filter(i => i.status === 'connected').length
  const errorCount = apiIntegrations.filter(i => i.status === 'error').length
  const degradedCount = apiIntegrations.filter(i => i.status === 'degraded').length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Integrations</h1>
          <p className="text-muted-foreground">
            Manage external system connections and data sources
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Integration
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiIntegrations.length}</div>
            <p className="text-xs text-muted-foreground">External systems connected</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{connectedCount}</div>
            <p className="text-xs text-muted-foreground">Operating normally</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Degraded</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{degradedCount}</div>
            <p className="text-xs text-muted-foreground">Performance issues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{errorCount}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Integrations Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Integrations</TabsTrigger>
          <TabsTrigger value="dhis2">DHIS2</TabsTrigger>
          <TabsTrigger value="openmrs">OpenMRS</TabsTrigger>
          <TabsTrigger value="other">Other Systems</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Integrations</CardTitle>
                  <CardDescription>View and manage all external system connections</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiIntegrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-muted rounded-lg">
                        {getStatusIcon(integration.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{integration.name}</h4>
                          {getStatusBadge(integration.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{integration.endpoint}</p>
                        {integration.error && (
                          <p className="text-sm text-destructive mt-1">{integration.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Last sync: {integration.lastSync}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Activity className="h-3 w-3" />
                          Response: {integration.responseTime}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dhis2" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>DHIS2 Integration</CardTitle>
              <CardDescription>District Health Information System 2 connection settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Database className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">DHIS2 Central</h4>
                    <p className="text-sm text-muted-foreground">https://dhis2.health.gov.mw/api</p>
                  </div>
                </div>
                <Badge className="bg-success text-success-foreground">
                  <CheckCircle2 className="w-3 h-3 mr-1" />Connected
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">API Endpoint</label>
                  <Input defaultValue="https://dhis2.health.gov.mw/api" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">API Version</label>
                  <Input defaultValue="2.40" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Username</label>
                  <Input defaultValue="mdss_integration" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Sync Interval (minutes)</label>
                  <Input defaultValue="15" type="number" className="mt-1" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button>Save Changes</Button>
                <Button variant="outline">Test Connection</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="openmrs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>OpenMRS Instances</CardTitle>
                  <CardDescription>Hospital Electronic Medical Record system connections</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Instance
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiIntegrations
                  .filter(i => i.name.includes('OpenMRS'))
                  .map((integration) => (
                    <div
                      key={integration.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-lg">
                          <Server className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{integration.name}</h4>
                            {getStatusBadge(integration.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">{integration.endpoint}</p>
                          {integration.error && (
                            <p className="text-sm text-destructive mt-1">{integration.error}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="mr-2 h-4 w-4" />
                          Configure
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="other" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Other Systems</CardTitle>
              <CardDescription>Additional integrated systems and services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiIntegrations
                  .filter(i => !i.name.includes('OpenMRS') && !i.name.includes('DHIS2'))
                  .map((integration) => (
                    <div
                      key={integration.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-lg">
                          {getStatusIcon(integration.status)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{integration.name}</h4>
                            {getStatusBadge(integration.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">{integration.endpoint}</p>
                          {integration.error && (
                            <p className="text-sm text-destructive mt-1">{integration.error}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">Configure</Button>
                        <Button variant="ghost" size="sm">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
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
