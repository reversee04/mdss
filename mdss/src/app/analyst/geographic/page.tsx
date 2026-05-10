'use client'

import { BarChart, PieChart } from '@/components/dashboard/charts'
import { FilterPanel } from '@/components/dashboard/filter-panel'
import { DataTable } from '@/components/dashboard/data-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { MapPin } from 'lucide-react'
import { regionalData, districtHeatmapData } from '@/lib/mock-data'

export default function GeographicAnalysisPage() {
  const totalCases = regionalData.reduce((sum, r) => sum + r.cases, 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Geographic Analysis</h1>
        <p className="text-muted-foreground">
          Disease distribution across regions and districts
        </p>
      </div>

      {/* Filters */}
      <FilterPanel
        showDisease={true}
        showLocation={true}
        showTimeRange={true}
      />

      {/* Regional Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        {regionalData.map((region) => (
          <Card key={region.region}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {region.region} Region
              </CardTitle>
              <CardDescription>
                Population: {(region.population / 1000000).toFixed(1)}M
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">{region.cases.toLocaleString()}</span>
                  <Badge variant="outline">
                    {((region.cases / totalCases) * 100).toFixed(1)}%
                  </Badge>
                </div>
                <Progress value={(region.cases / totalCases) * 100} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Deaths: {region.deaths}</span>
                  <span>CFR: {((region.deaths / region.cases) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <BarChart
          title="Cases by Region"
          description="Total reported cases per region"
          labels={regionalData.map((r) => r.region)}
          datasets={[
            {
              label: 'Cases',
              data: regionalData.map((r) => r.cases),
            },
          ]}
        />
        <PieChart
          title="Regional Distribution"
          description="Proportion of cases by region"
          labels={regionalData.map((r) => r.region)}
          data={regionalData.map((r) => r.cases)}
          doughnut
        />
      </div>

      {/* District Heatmap Table */}
      <Card>
        <CardHeader>
          <CardTitle>District Disease Burden</CardTitle>
          <CardDescription>Cases and severity by district</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={districtHeatmapData.sort((a, b) => b.cases - a.cases)}
            columns={[
              {
                key: 'district',
                header: 'District',
                render: (item) => (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{item.district}</span>
                  </div>
                ),
              },
              {
                key: 'cases',
                header: 'Cases',
                render: (item) => item.cases.toLocaleString(),
              },
              {
                key: 'proportion',
                header: 'Proportion',
                render: (item) => {
                  const maxCases = Math.max(...districtHeatmapData.map((d) => d.cases))
                  const proportion = (item.cases / maxCases) * 100
                  return (
                    <div className="flex items-center gap-3 min-w-[150px]">
                      <Progress value={proportion} className="h-2 flex-1" />
                      <span className="text-sm text-muted-foreground w-12">
                        {proportion.toFixed(0)}%
                      </span>
                    </div>
                  )
                },
              },
              {
                key: 'severity',
                header: 'Severity',
                render: (item) => (
                  <Badge
                    variant="outline"
                    className={
                      item.severity === 'high'
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : item.severity === 'medium'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-green-100 text-green-800 border-green-300'
                    }
                  >
                    {item.severity}
                  </Badge>
                ),
              },
              {
                key: 'incidence',
                header: 'Incidence Rate',
                render: (item) => {
                  const rate = (item.cases / 100000 * 10).toFixed(1)
                  return `${rate} per 100k`
                },
              },
            ]}
            searchPlaceholder="Search districts..."
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Top Affected Districts */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Affected Districts</CardTitle>
          <CardDescription>Districts with highest disease burden</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {districtHeatmapData
              .sort((a, b) => b.cases - a.cases)
              .slice(0, 5)
              .map((district, index) => {
                const maxCases = districtHeatmapData[0].cases
                return (
                  <div key={district.district} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{district.district}</span>
                        <span className="text-muted-foreground">{district.cases.toLocaleString()} cases</span>
                      </div>
                      <Progress value={(district.cases / maxCases) * 100} className="h-2" />
                    </div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
