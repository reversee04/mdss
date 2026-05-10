'use client'

import { StatCard } from '@/components/dashboard/stat-card'
import { LineChart, BarChart, PieChart } from '@/components/dashboard/charts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, TrendingUp, TrendingDown, Users, Building2, Activity } from 'lucide-react'
import { overviewStats, diseaseStats, regionalData, generateTimeSeriesData } from '@/lib/mock-data'

const timeSeriesData = generateTimeSeriesData(12)

export default function NationalOverviewPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">National Statistics</h1>
          <p className="text-muted-foreground">
            Comprehensive national health statistics and trends
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Population"
          value="17.5M"
          description="2024 estimate"
          icon={Users}
        />
        <StatCard
          title="Health Facilities"
          value={overviewStats.totalFacilities}
          description="nationwide"
          icon={Building2}
        />
        <StatCard
          title="Total Cases (YTD)"
          value={overviewStats.totalCases}
          change="+5.2%"
          changeType="negative"
          description="vs last year"
          icon={Activity}
        />
        <StatCard
          title="National CFR"
          value="2.7%"
          change="-0.3%"
          changeType="positive"
          description="improving trend"
          icon={TrendingDown}
        />
        <StatCard
          title="Recovery Rate"
          value="85.3%"
          change="+2.1%"
          changeType="positive"
          description="vs last year"
          icon={TrendingUp}
        />
      </div>

      {/* Disease Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Disease Overview</CardTitle>
          <CardDescription>Summary statistics for tracked diseases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            {diseaseStats.map((disease) => (
              <div key={disease.disease} className="text-center p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2">{disease.disease}</h4>
                <p className="text-3xl font-bold mb-1">{disease.cases.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mb-2">total cases</p>
                <div className="flex justify-center gap-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    TSR: {disease.tsr}%
                  </Badge>
                  <Badge variant="outline" className={disease.cfr > 5 ? 'bg-red-100 text-red-800' : ''}>
                    CFR: {disease.cfr}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trend Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <LineChart
          title="Annual Disease Trends"
          description="Cases over the last 12 months"
          labels={timeSeriesData.map((d) => d.month)}
          datasets={[
            { label: 'Total Cases', data: timeSeriesData.map((d) => d.hiv + d.malaria + d.tb + d.cholera) },
          ]}
        />
        <BarChart
          title="Cases by Disease"
          description="Current period totals"
          labels={diseaseStats.map((d) => d.disease)}
          datasets={[
            { label: 'Cases', data: diseaseStats.map((d) => d.cases) },
          ]}
        />
      </div>

      {/* Regional Comparison */}
      <div className="grid gap-4 md:grid-cols-2">
        <BarChart
          title="Cases by Region"
          description="Regional distribution"
          labels={regionalData.map((r) => r.region)}
          datasets={[
            { label: 'Cases', data: regionalData.map((r) => r.cases) },
            { label: 'Deaths', data: regionalData.map((r) => r.deaths), backgroundColor: '#ef4444' },
          ]}
        />
        <PieChart
          title="Regional Case Distribution"
          description="Percentage by region"
          labels={regionalData.map((r) => r.region)}
          data={regionalData.map((r) => r.cases)}
        />
      </div>

      {/* National Targets */}
      <Card>
        <CardHeader>
          <CardTitle>National Health Targets 2024</CardTitle>
          <CardDescription>Progress towards key health indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[
              { name: 'HIV Treatment Coverage', current: 85, target: 95, unit: '%' },
              { name: 'Malaria Incidence Reduction', current: 72, target: 90, unit: '%' },
              { name: 'TB Detection Rate', current: 68, target: 80, unit: '%' },
              { name: 'Facility Reporting Compliance', current: 95, target: 100, unit: '%' },
            ].map((target) => (
              <div key={target.name} className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">{target.name}</span>
                  <span className="text-sm">
                    <span className="font-semibold">{target.current}%</span>
                    <span className="text-muted-foreground"> / {target.target}%</span>
                  </span>
                </div>
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-primary rounded-full"
                    style={{ width: `${(target.current / target.target) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
