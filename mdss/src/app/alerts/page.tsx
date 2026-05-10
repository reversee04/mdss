'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DataTable } from '@/components/dashboard/data-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  AlertTriangle,
  CheckCircle,
  ArrowUpCircle,
  Bell,
  Calendar,
  MapPin,
  Activity,
} from 'lucide-react'
import { alerts } from '@/lib/mock-data'

export default function AlertsPage() {
  const [selectedAlert, setSelectedAlert] = useState<typeof alerts[0] | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const activeAlerts = alerts.filter((a) => a.status === 'active')
  const acknowledgedAlerts = alerts.filter((a) => a.status === 'acknowledged')
  const escalatedAlerts = alerts.filter((a) => a.status === 'escalated')

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case 'medium':
        return <Activity className="h-5 w-5 text-amber-500" />
      default:
        return <Bell className="h-5 w-5 text-blue-500" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    const styles = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-amber-100 text-amber-800 border-amber-300',
      low: 'bg-blue-100 text-blue-800 border-blue-300',
    }
    return (
      <Badge variant="outline" className={styles[severity as keyof typeof styles] || ''}>
        {severity}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-red-100 text-red-800 border-red-300',
      acknowledged: 'bg-amber-100 text-amber-800 border-amber-300',
      escalated: 'bg-purple-100 text-purple-800 border-purple-300',
    }
    return (
      <Badge variant="outline" className={styles[status as keyof typeof styles] || ''}>
        {status}
      </Badge>
    )
  }

  const openAlertDetails = (alert: typeof alerts[0]) => {
    setSelectedAlert(alert)
    setIsDialogOpen(true)
  }

  const AlertList = ({ alertList }: { alertList: typeof alerts }) => (
    <div className="space-y-4">
      {alertList.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No alerts in this category
        </div>
      ) : (
        alertList.map((alert) => (
          <Card
            key={alert.id}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => openAlertDetails(alert)}
          >
            <CardContent className="flex items-start gap-4 py-4">
              <div className="p-2 rounded-full bg-muted">
                {getSeverityIcon(alert.severity)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{alert.title}</h4>
                  {getSeverityBadge(alert.severity)}
                  {getStatusBadge(alert.status)}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {alert.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {alert.dateDetected}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {alert.location}
                  </span>
                  {alert.casesReported > 0 && (
                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {alert.casesReported} cases
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )

  return (
    <DashboardLayout role="analyst">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Alerts & Monitoring</h1>
            <p className="text-muted-foreground">
              Outbreak detection and abnormal trend alerts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
              {activeAlerts.length} Active
            </Badge>
            <Badge variant="outline">
              {acknowledgedAlerts.length} Acknowledged
            </Badge>
            <Badge variant="secondary">
              {escalatedAlerts.length} Escalated
            </Badge>
          </div>
        </div>

        {/* Alert Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts.length}</div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {alerts.filter((a) => a.severity === 'critical').length}
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">High</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {alerts.filter((a) => a.severity === 'high').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.4 hrs</div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Tabs */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active" className="relative">
              Active
              {activeAlerts.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {activeAlerts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="acknowledged">Acknowledged</TabsTrigger>
            <TabsTrigger value="escalated">Escalated</TabsTrigger>
            <TabsTrigger value="all">All Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <AlertList alertList={activeAlerts} />
          </TabsContent>
          <TabsContent value="acknowledged">
            <AlertList alertList={acknowledgedAlerts} />
          </TabsContent>
          <TabsContent value="escalated">
            <AlertList alertList={escalatedAlerts} />
          </TabsContent>
          <TabsContent value="all">
            <AlertList alertList={alerts} />
          </TabsContent>
        </Tabs>

        {/* Alert Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            {selectedAlert && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(selectedAlert.severity)}
                    <div>
                      <DialogTitle>{selectedAlert.title}</DialogTitle>
                      <DialogDescription>
                        Alert ID: #{selectedAlert.id} | Detected: {selectedAlert.dateDetected}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    {getSeverityBadge(selectedAlert.severity)}
                    {getStatusBadge(selectedAlert.status)}
                    <Badge variant="outline">{selectedAlert.disease}</Badge>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p>{selectedAlert.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Location</Label>
                      <p className="font-medium">{selectedAlert.location}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Cases Reported</Label>
                      <p className="font-medium">{selectedAlert.casesReported || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Add Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add investigation notes or actions taken..."
                      className="mt-1"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Close
                  </Button>
                  {selectedAlert.status === 'active' && (
                    <>
                      <Button variant="secondary">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Acknowledge
                      </Button>
                      <Button variant="destructive">
                        <ArrowUpCircle className="mr-2 h-4 w-4" />
                        Escalate
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
