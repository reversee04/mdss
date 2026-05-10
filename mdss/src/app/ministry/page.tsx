'use client'

import { StatCard } from '@/components/dashboard/stat-card'
import { LineChart, PieChart } from '@/components/dashboard/charts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  Download,
  FileText,
  MapPin,
  Calendar,
} from 'lucide-react'
import { overviewStats, diseaseStats, regionalData, alerts, generateTimeSeriesData } from '@/lib/mock-data'

const timeSeriesData = generateTimeSeriesData(6)
const activeAlerts = alerts.filter((a) => a.status === 'active')

export default function MinistryDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">National Health Overview</h1>
          <p className="text-muted-foreground">
            Executive summary of disease surveillance data
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Jan 2024
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      {activeAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-red-800 dark:text-red-200">
                {activeAlerts.length} Active Alert{activeAlerts.length > 1 ? 's' : ''} Requiring Attention
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                {activeAlerts[0].title} - {activeAlerts[0].description.slice(0, 80)}...
              </p>
            </div>
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100" asChild>
              <a href="/alerts">View All Alerts</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Key National Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Cases (National)"
          value={overviewStats.totalCases}
          change="+5.2%"
          changeType="negative"
          description="from last month"
          icon={Activity}
        />
        <StatCard
          title="Total Deaths"
          value={overviewStats.totalDeaths}
          change="-8.5%"
          changeType="positive"
          description="from last month"
          icon={TrendingDown}
        />
        <StatCard
          title="Recovery Rate"
          value="85.3%"
          change="+2.1%"
          changeType="positive"
          description="national average"
          icon={TrendingUp}
        />
        <StatCard
          title="Facilities Reporting"
          value={`${((overviewStats.facilitiesReporting / overviewStats.totalFacilities) * 100).toFixed(0)}%`}
          description={`${overviewStats.facilitiesReporting} of ${overviewStats.totalFacilities}`}
          icon={Users}
        />
      </div>

      {/* Visual Insights */}
      <div className="grid gap-4 md:grid-cols-2">
        <LineChart
          title="National Disease Trends"
          description="Monthly case trends across all diseases"
          labels={timeSeriesData.map((d) => d.month)}
          datasets={[
            { label: 'HIV/AIDS', data: timeSeriesData.map((d) => d.hiv) },
            { label: 'Malaria', data: timeSeriesData.map((d) => d.malaria) },
            { label: 'TB', data: timeSeriesData.map((d) => d.tb) },
            { label: 'Cholera', data: timeSeriesData.map((d) => d.cholera) },
          ]}
        />
        <PieChart
          title="Cases by Region"
          description="Distribution across regions"
          labels={regionalData.map((r) => r.region)}
          data={regionalData.map((r) => r.cases)}
          doughnut
        />
      </div>

      {/* Regional Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Regional Overview
          </CardTitle>
          <CardDescription>Disease burden by region</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {regionalData.map((region) => {
              const cfrPercentage = ((region.deaths / region.cases) * 100).toFixed(1)
              const casesPerMillion = ((region.cases / region.population) * 1000000).toFixed(0)
              
              return (
                <div key={region.region} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-lg">{region.region} Region</h4>
                    <Badge variant="outline">{casesPerMillion}/M</Badge>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Total Cases</span>
                        <span className="font-medium">{region.cases.toLocaleString()}</span>
                      </div>
                      <Progress value={(region.cases / 20000) * 100} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Deaths</p>
                        <p className="font-semibold text-red-600">{region.deaths}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">CFR</p>
                        <p className="font-semibold">{cfrPercentage}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Disease Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {diseaseStats.map((disease) => (
          <Card key={disease.disease}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{disease.disease}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{disease.cases.toLocaleString()}</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Treatment Success</span>
                  <Badge
                    variant="outline"
                    className={
                      disease.tsr >= 85
                        ? 'bg-green-100 text-green-800'
                        : disease.tsr >= 75
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }
                  >
                    {disease.tsr}%
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fatality Rate</span>
                  <span className="font-medium">{disease.cfr}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Generate reports and access key documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
              <FileText className="h-6 w-6" />
              <span>Monthly Summary Report</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
              <Download className="h-6 w-6" />
              <span>Export Data (CSV)</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
              <FileText className="h-6 w-6" />
              <span>Policy Brief Template</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
