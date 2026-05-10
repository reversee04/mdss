'use client'

import { StatCard } from '@/components/dashboard/stat-card'
import { LineChart, BarChart, PieChart } from '@/components/dashboard/charts'
import { FilterPanel } from '@/components/dashboard/filter-panel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  Heart,
  Skull,
  Stethoscope,
} from 'lucide-react'
import { overviewStats, diseaseStats, generateTimeSeriesData, ageDistribution, sexDistribution } from '@/lib/mock-data'

const timeSeriesData = generateTimeSeriesData(12)

export default function AnalystDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Disease Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive disease surveillance data and trend analysis
          </p>
        </div>
        <Badge variant="outline" className="w-fit bg-amber-100 text-amber-800 border-amber-300">
          SIMULATED DATA
        </Badge>
      </div>

      {/* Filters */}
      <FilterPanel
        showDisease={true}
        showLocation={true}
        showTimeRange={true}
        showFacility={false}
      />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Cases"
          value={overviewStats.totalCases}
          change="+8.2%"
          changeType="negative"
          description="vs last month"
          icon={Activity}
        />
        <StatCard
          title="Active Cases"
          value={overviewStats.activeCases}
          change="-12.4%"
          changeType="positive"
          description="vs last month"
          icon={Stethoscope}
        />
        <StatCard
          title="Recoveries"
          value={overviewStats.totalRecoveries}
          change="+15.3%"
          changeType="positive"
          description="vs last month"
          icon={Heart}
        />
        <StatCard
          title="Deaths"
          value={overviewStats.totalDeaths}
          change="-5.2%"
          changeType="positive"
          description="vs last month"
          icon={Skull}
        />
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Disease Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <LineChart
              title="Disease Cases Over Time"
              description="Monthly case counts by disease type"
              labels={timeSeriesData.map((d) => d.month)}
              datasets={[
                { label: 'HIV/AIDS', data: timeSeriesData.map((d) => d.hiv) },
                { label: 'Malaria', data: timeSeriesData.map((d) => d.malaria) },
                { label: 'TB', data: timeSeriesData.map((d) => d.tb) },
                { label: 'Cholera', data: timeSeriesData.map((d) => d.cholera) },
              ]}
            />
            <BarChart
              title="Cases by Disease Type"
              description="Total cases for current period"
              labels={diseaseStats.map((d) => d.disease)}
              datasets={[
                {
                  label: 'Cases',
                  data: diseaseStats.map((d) => d.cases),
                },
              ]}
            />
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <PieChart
              title="Cases by Disease"
              description="Proportion of total cases"
              labels={diseaseStats.map((d) => d.disease)}
              data={diseaseStats.map((d) => d.cases)}
            />
            <PieChart
              title="Outcomes Distribution"
              description="Recovery vs deaths vs active"
              labels={['Recovered', 'Active Cases', 'Deaths']}
              data={[overviewStats.totalRecoveries, overviewStats.activeCases, overviewStats.totalDeaths]}
              doughnut
            />
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <BarChart
              title="Cases by Age Group"
              description="Distribution across age groups"
              labels={ageDistribution.map((d) => d.ageGroup)}
              datasets={[
                {
                  label: 'Cases',
                  data: ageDistribution.map((d) => d.cases),
                },
              ]}
            />
            <PieChart
              title="Cases by Sex"
              description="Male vs Female distribution"
              labels={sexDistribution.map((d) => d.sex)}
              data={sexDistribution.map((d) => d.cases)}
              doughnut
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Disease Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Disease Statistics Summary</CardTitle>
          <CardDescription>Key metrics and treatment effectiveness by disease</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium p-3">Disease</th>
                  <th className="text-right font-medium p-3">Cases</th>
                  <th className="text-right font-medium p-3">Deaths</th>
                  <th className="text-right font-medium p-3">Recoveries</th>
                  <th className="text-right font-medium p-3">
                    <span className="cursor-help border-b border-dashed" title="Treatment Success Rate">
                      TSR
                    </span>
                  </th>
                  <th className="text-right font-medium p-3">
                    <span className="cursor-help border-b border-dashed" title="Case Fatality Rate">
                      CFR
                    </span>
                  </th>
                  <th className="text-right font-medium p-3">Median Recovery</th>
                </tr>
              </thead>
              <tbody>
                {diseaseStats.map((disease) => (
                  <tr key={disease.disease} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">{disease.disease}</td>
                    <td className="p-3 text-right">{disease.cases.toLocaleString()}</td>
                    <td className="p-3 text-right text-red-600">{disease.deaths.toLocaleString()}</td>
                    <td className="p-3 text-right text-green-600">{disease.recoveries.toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <Badge
                        variant="outline"
                        className={
                          disease.tsr >= 85
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : disease.tsr >= 75
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-red-100 text-red-800 border-red-300'
                        }
                      >
                        {disease.tsr}%
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Badge
                        variant="outline"
                        className={
                          disease.cfr <= 2
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : disease.cfr <= 10
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-red-100 text-red-800 border-red-300'
                        }
                      >
                        {disease.cfr}%
                      </Badge>
                    </td>
                    <td className="p-3 text-right">{disease.medianRecoveryDays} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
