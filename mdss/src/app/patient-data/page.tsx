'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { FilterPanel } from '@/components/dashboard/filter-panel'
import { DataTable } from '@/components/dashboard/data-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  AlertTriangle,
  User,
  Calendar,
  MapPin,
  Building2,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'

interface Patient {
  id: string
  age: number
  sex: string
  district: string
  facility: string
  disease: string
  diagnosisDate: string
  status: string
  events: Array<{
    date: string
    type: string
    description: string
  }>
  anomaly: boolean
  anomalyReason?: string
}

export default function PatientDataPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/patients')
      const result = await response.json()

      if (result.success) {
        setPatients(result.data)
      } else {
        setError(result.error || 'Failed to fetch patient data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const openPatientDetails = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'On Treatment': 'bg-blue-100 text-blue-800 border-blue-300',
      'Recovered': 'bg-green-100 text-green-800 border-green-300',
      'Admitted': 'bg-amber-100 text-amber-800 border-amber-300',
      'Treatment Failure': 'bg-red-100 text-red-800 border-red-300',
    }
    return (
      <Badge variant="outline" className={styles[status] || ''}>
        {status}
      </Badge>
    )
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'Diagnosis':
        return <Activity className="h-4 w-4 text-blue-500" />
      case 'Treatment Start':
      case 'Treatment':
      case 'Regimen Change':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'Admission':
        return <Building2 className="h-4 w-4 text-amber-500" />
      case 'Discharge':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'Follow-up':
        return <Clock className="h-4 w-4 text-purple-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <DashboardLayout role="analyst">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient Data</h1>
          <p className="text-muted-foreground">
            De-identified patient history and clinical timeline
          </p>
          <Badge variant="outline" className="mt-2 bg-amber-100 text-amber-800 border-amber-300">
            SIMULATED DATA - All records are de-identified
          </Badge>
        </div>

        {/* Filters */}
        <FilterPanel
          showDisease={true}
          showLocation={true}
          showFacility={true}
          showDateRange={true}
          showTimeRange={false}
        />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : patients.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">On Treatment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : patients.filter((p) => p.status === 'On Treatment').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recovered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loading ? '...' : patients.filter((p) => p.status === 'Recovered').length}
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200">
                <AlertTriangle className="inline h-4 w-4 mr-1" />
                Flagged Anomalies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {loading ? '...' : patients.filter((p) => p.anomaly).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patient Table */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Records</CardTitle>
            <CardDescription>De-identified patient data and treatment history</CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8 text-red-600">
                Error loading patient data: {error}
              </div>
            ) : loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading patient data...
              </div>
            ) : (
              <DataTable
                data={patients as unknown as Record<string, unknown>[]}
                columns={[
                  {
                    key: 'id',
                    header: 'Patient ID',
                    render: (item) => (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{String(item.id)}</span>
                        {item.anomaly === true && (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    ),
                  },
                  {
                    key: 'demographics',
                    header: 'Demographics',
                    render: (item) => (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{String(item.age)}y, {String(item.sex)}</span>
                      </div>
                    ),
                  },
                  {
                    key: 'disease',
                    header: 'Disease',
                    render: (item) => <Badge variant="outline">{String(item.disease)}</Badge>,
                  },
                  {
                    key: 'facility',
                    header: 'Facility',
                    render: (item) => (
                      <div className="max-w-[200px] truncate" title={String(item.facility)}>
                        {String(item.facility)}
                      </div>
                    ),
                  },
                  { key: 'diagnosisDate', header: 'Diagnosis Date' },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (item) => getStatusBadge(String(item.status)),
                  },
                  {
                    key: 'actions',
                    header: '',
                    render: (item) => (
                      <Button variant="ghost" size="sm" onClick={() => openPatientDetails(item as unknown as Patient)}>
                        View History
                      </Button>
                    ),
                  },
                ]}
                searchPlaceholder="Search by ID, disease, or facility..."
              />
            )}
          </CardContent>
        </Card>

        {/* Patient Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            {selectedPatient && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    Patient Timeline
                    {selectedPatient.anomaly && (
                      <Badge className="bg-amber-100 text-amber-800">Anomaly Flagged</Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription>
                    De-identified record: {selectedPatient.id}
                  </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh]">
                  <div className="space-y-6 pr-4">
                    {/* Patient Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedPatient.age} years, {selectedPatient.sex}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedPatient.disease}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedPatient.district}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedPatient.facility}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Current Status:</span>
                      {getStatusBadge(selectedPatient.status)}
                    </div>

                    {/* Anomaly Alert */}
                    {selectedPatient.anomaly && (
                      <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                          <span className="font-medium text-amber-800 dark:text-amber-200">Anomaly Detected</span>
                        </div>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          {selectedPatient.anomalyReason}
                        </p>
                      </div>
                    )}

                    <Separator />

                    {/* Timeline */}
                    <div>
                      <h4 className="font-medium mb-4">Clinical Timeline</h4>
                      <div className="relative pl-6 space-y-6">
                        <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
                        {selectedPatient.events.map((event, index) => (
                          <div key={index} className="relative">
                            <div className="absolute -left-6 p-1 bg-background rounded-full border">
                              {getEventIcon(event.type)}
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{event.type}</span>
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {event.date}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{event.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
