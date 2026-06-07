'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { FilterPanel } from '@/components/dashboard/filter-panel'
import { LineChart, BarChart, PieChart } from '@/components/dashboard/charts'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  FileText,
  Download,
  Plus,
  Calendar,
  BarChart3,
  PieChartIcon,
  LineChartIcon,
  Save,
  Trash2,
  TableProperties
} from 'lucide-react'
import { diseaseStats, generateTimeSeriesData, regionalData } from '@/lib/mock-data'
import { useToast } from '@/components/ui/use-toast'

const timeSeriesData = generateTimeSeriesData(6)

export default function ReportsPage() {
  const { toast } = useToast()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedChartType, setSelectedChartType] = useState('line')
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportName, setReportName] = useState('')
  const [reportFormat, setReportFormat] = useState('csv')
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduleFrequency, setScheduleFrequency] = useState('weekly')
  
  const [templates, setTemplates] = useState<any[]>([])
  const [previewData, setPreviewData] = useState<any>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  useEffect(() => {
    fetchTemplates()
    fetchPreview()
  }, [])

  const fetchPreview = async () => {
    setLoadingPreview(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'json', filters: {}, reportName: 'preview' }),
      })
      const data = await res.json()
      if (data.success) setPreviewData(data.data)
    } catch (error) {
      console.error('Preview load failed', error)
    } finally {
      setLoadingPreview(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/reports/templates')
      const data = await res.json()
      if (data.success) {
        setTemplates(data.data)
      }
    } catch (error) {
      console.error('Failed to load templates', error)
    }
  }

  const handleCreateTemplate = async () => {
    try {
      const res = await fetch('/api/reports/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_name: reportName,
          report_type: 'surveillance',
          export_format: reportFormat,
          schedule_enabled: scheduleEnabled,
          schedule_frequency: scheduleFrequency,
        })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Success', description: 'Report template saved.' })
        setIsCreateDialogOpen(false)
        fetchTemplates()
      } else {
        toast({ variant: 'destructive', title: 'Error', description: data.error })
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create template.' })
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return
    try {
      const res = await fetch(`/api/reports/templates/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Success', description: 'Template deleted.' })
        fetchTemplates()
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete template.' })
    }
  }

  const handleGenerateReport = async (format: string, templateId: string | null = null) => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          filters: {}, // In a real app, gather from FilterPanel state
          reportName: reportName || 'surveillance-report',
          templateId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      // Read as blob for file download
      const blob = await response.blob()
      
      const fileExt = format === 'excel' ? 'xlsx' : format
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportName || 'surveillance-report'}-${new Date().toISOString().split('T')[0]}.${fileExt}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({ title: 'Success', description: `Report exported as ${format.toUpperCase()}` })
    } catch (error) {
      console.error('Error generating report:', error)
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate report. Please try again.' })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate, configure, and export surveillance reports
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Report Template</DialogTitle>
              <DialogDescription>
                Configure a new report template for regular generation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reportName">Template Name</Label>
                <Input
                  id="reportName"
                  placeholder="e.g., Monthly Malaria Summary"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="format">Default Format</Label>
                <Select value={reportFormat} onValueChange={setReportFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Enable Schedule</Label>
                  <p className="text-xs text-muted-foreground">Automatically generate this report</p>
                </div>
                <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
              </div>
              {scheduleEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate}>
                Save Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
          <TabsTrigger value="saved">Saved Templates</TabsTrigger>
        </TabsList>

        {/* Generate Report Tab */}
        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>Configure filters and parameters for your report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FilterPanel
                showDisease={true}
                showLocation={true}
                showTimeRange={true}
                showDateRange={true}
              />
              <div className="flex gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Chart Type</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedChartType === 'line' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedChartType('line')}
                    >
                      <LineChartIcon className="h-4 w-4 mr-1" /> Line
                    </Button>
                    <Button
                      variant={selectedChartType === 'bar' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedChartType('bar')}
                    >
                      <BarChart3 className="h-4 w-4 mr-1" /> Bar
                    </Button>
                    <Button
                      variant={selectedChartType === 'pie' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedChartType('pie')}
                    >
                      <PieChartIcon className="h-4 w-4 mr-1" /> Pie
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Report Preview</CardTitle>
              <CardDescription>Preview how your report will look</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {selectedChartType === 'line' && (
                  <LineChart
                    title="Disease Trends"
                    description="Cases over time"
                    labels={timeSeriesData.map((d) => d.month)}
                    datasets={[
                      { label: 'HIV/AIDS', data: timeSeriesData.map((d) => d.hiv) },
                      { label: 'Malaria', data: timeSeriesData.map((d) => d.malaria) },
                    ]}
                  />
                )}
                {selectedChartType === 'bar' && (
                  <BarChart
                    title="Cases by Disease"
                    description="Total cases comparison"
                    labels={diseaseStats.map((d) => d.disease)}
                    datasets={[
                      { label: 'Cases', data: diseaseStats.map((d) => d.cases) },
                    ]}
                  />
                )}
                {selectedChartType === 'pie' && (
                  <PieChart
                    title="Regional Distribution"
                    description="Cases by region"
                    labels={regionalData.map((r) => r.region)}
                    data={regionalData.map((r) => r.cases)}
                  />
                )}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Summary Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingPreview ? (
                      <p className="text-sm text-muted-foreground">Loading preview...</p>
                    ) : previewData ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Encounters</span>
                          <span className="font-medium">{previewData.encounters?.totalEncounters?.toLocaleString() ?? '—'}</span>
                        </div>
                        {previewData.caseFatalityRate?.byDisease && Object.entries(previewData.caseFatalityRate.byDisease).slice(0, 3).map(([disease, cfr]: [string, any]) => (
                          <div key={disease} className="flex justify-between">
                            <span className="text-muted-foreground text-xs">{disease} CFR</span>
                            <span className="font-medium text-red-600 text-sm">{cfr}%</span>
                          </div>
                        ))}
                        {previewData.treatmentSuccessRate?.byDisease && Object.entries(previewData.treatmentSuccessRate.byDisease).slice(0, 3).map(([disease, tsr]: [string, any]) => (
                          <div key={disease} className="flex justify-between">
                            <span className="text-muted-foreground text-xs">{disease} TSR</span>
                            <span className="font-medium text-green-600 text-sm">{tsr}%</span>
                          </div>
                        ))}
                        <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                          Districts with data: {previewData.diseaseByDistrict?.length ? [...new Set(previewData.diseaseByDistrict.map((d: any) => d.district))].length : '—'}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Cases</span>
                          <span className="font-medium">45,672</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Deaths</span>
                          <span className="font-medium text-red-600">1,234</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Report</CardTitle>
              <CardDescription>Download the report in your preferred format</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" onClick={() => handleGenerateReport('csv')} disabled={isGenerating}>
                  <Download className="mr-2 h-4 w-4" /> CSV
                </Button>
                <Button variant="outline" onClick={() => handleGenerateReport('pdf')} disabled={isGenerating}>
                  <FileText className="mr-2 h-4 w-4" /> PDF
                </Button>
                <Button variant="outline" onClick={() => handleGenerateReport('excel')} disabled={isGenerating}>
                  <TableProperties className="mr-2 h-4 w-4" /> Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Saved Reports Tab */}
        <TabsContent value="saved">
          <Card>
            <CardHeader>
              <CardTitle>Saved Report Templates</CardTitle>
              <CardDescription>Previously configured report templates</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={templates}
                columns={[
                  { key: 'template_name', header: 'Template Name' },
                  {
                    key: 'export_format',
                    header: 'Format',
                    render: (item) => <Badge variant="outline" className="uppercase">{item.export_format}</Badge>,
                  },
                  { 
                    key: 'schedule', 
                    header: 'Schedule',
                    render: (item) => (
                      item.schedule_enabled ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          <span className="capitalize">{item.schedule_frequency}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">None</span>
                      )
                    )
                  },
                  {
                    key: 'created_at',
                    header: 'Created',
                    render: (item) => new Date(item.created_at).toLocaleDateString(),
                  },
                  {
                    key: 'actions',
                    header: '',
                    render: (item) => (
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => handleGenerateReport(item.export_format, item.id)}>
                          Run Now
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(item.id)} className="text-red-500 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ),
                  },
                ]}
                searchPlaceholder="Search saved templates..."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
