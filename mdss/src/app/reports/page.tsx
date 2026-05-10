'use client'

import { useState } from 'react'
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
import {
  FileText,
  Download,
  Plus,
  Calendar,
  BarChart3,
  PieChartIcon,
  LineChartIcon,
  Save,
} from 'lucide-react'
import { savedReports, diseaseStats, generateTimeSeriesData, regionalData } from '@/lib/mock-data'

const timeSeriesData = generateTimeSeriesData(6)

export default function ReportsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedChartType, setSelectedChartType] = useState('line')

  return (
    <DashboardLayout role="analyst">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
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
                New Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Report</DialogTitle>
                <DialogDescription>
                  Configure a new report template for regular generation.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="reportName">Report Name</Label>
                  <Input id="reportName" placeholder="e.g., Monthly Malaria Summary" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disease">Disease</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select disease" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Diseases</SelectItem>
                      <SelectItem value="hiv">HIV/AIDS</SelectItem>
                      <SelectItem value="malaria">Malaria</SelectItem>
                      <SelectItem value="tb">Tuberculosis</SelectItem>
                      <SelectItem value="cholera">Cholera</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(false)}>
                  Create Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="generate" className="space-y-4">
          <TabsList>
            <TabsTrigger value="generate">Generate Report</TabsTrigger>
            <TabsTrigger value="saved">Saved Reports</TabsTrigger>
          </TabsList>

          {/* Generate Report Tab */}
          <TabsContent value="generate" className="space-y-6">
            {/* Report Configuration */}
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
                        <LineChartIcon className="h-4 w-4 mr-1" />
                        Line
                      </Button>
                      <Button
                        variant={selectedChartType === 'bar' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedChartType('bar')}
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Bar
                      </Button>
                      <Button
                        variant={selectedChartType === 'pie' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedChartType('pie')}
                      >
                        <PieChartIcon className="h-4 w-4 mr-1" />
                        Pie
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview Charts */}
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
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Cases</span>
                          <span className="font-medium">45,672</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Deaths</span>
                          <span className="font-medium text-red-600">1,234</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Recovery Rate</span>
                          <span className="font-medium text-green-600">85.3%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg. TSR</span>
                          <span className="font-medium">87.2%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card>
              <CardHeader>
                <CardTitle>Export Report</CardTitle>
                <CardDescription>Download the report in your preferred format</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export as CSV
                  </Button>
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Export as PDF
                  </Button>
                  <Button variant="outline">
                    <Save className="mr-2 h-4 w-4" />
                    Save Configuration
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
                  data={savedReports}
                  columns={[
                    { key: 'name', header: 'Report Name' },
                    {
                      key: 'disease',
                      header: 'Disease',
                      render: (item) => <Badge variant="outline">{item.disease}</Badge>,
                    },
                    { key: 'frequency', header: 'Frequency' },
                    {
                      key: 'lastRun',
                      header: 'Last Generated',
                      render: (item) => (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {item.lastRun}
                        </span>
                      ),
                    },
                    { key: 'createdBy', header: 'Created By' },
                    {
                      key: 'actions',
                      header: '',
                      render: () => (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            Run Now
                          </Button>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                  searchPlaceholder="Search saved reports..."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
