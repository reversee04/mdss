'use client'

import { useEffect, useState } from 'react'
import { BarChart, PieChart } from '@/components/dashboard/charts'
import { FilterPanel } from '@/components/dashboard/filter-panel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { MapPin } from 'lucide-react'
import { useAnalytics } from '@/hooks/use-analytics'

interface RegionalData {
  region: string
  cases: number
  percentage: number
}

interface DistrictData {
  district: string
  region: string
  cases: number
  severity: 'high' | 'medium' | 'low'
}

export default function GeographicAnalysisPage() {
  const { getFacilities, loading, error } = useAnalytics()
  const [regionalData, setRegionalData] = useState<RegionalData[]>([])
  const [districtData, setDistrictData] = useState<DistrictData[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const response = await getFacilities()
      if (response?.success && response.data) {
        // Group by region and calculate totals
        const regionMap = new Map<string, number>()
        const districts: DistrictData[] = []

        response.data.forEach((facility: any) => {
          const current = regionMap.get(facility.region) || 0
          regionMap.set(facility.region, current + facility.totalEncounters)

          districts.push({
            district: facility.district,
            region: facility.region,
            cases: facility.totalEncounters,
            severity:
              facility.totalEncounters > 1000 ? 'high'
              : facility.totalEncounters > 500 ? 'medium'
              : 'low',
          })
        })

        // Calculate regional data
        const totalCases = Array.from(regionMap.values()).reduce((a, b) => a + b, 0)
        const regional: RegionalData[] = Array.from(regionMap.entries()).map(
          ([region, cases]) => ({
            region,
            cases,
            percentage: totalCases > 0 ? Math.round((cases / totalCases) * 100) : 0,
          })
        )

        setRegionalData(regional)
        setDistrictData(districts.sort((a, b) => b.cases - a.cases))
      }
    }
    fetchData()
  }, [getFacilities])

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Geographic Analysis</h1>
          <p className="text-destructive">Error: {error}</p>
        </div>
      </div>
    )
  }

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
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">{region.cases.toLocaleString()}</span>
                  <Badge variant="outline">
                    {region.percentage}%
                  </Badge>
                </div>
                <Progress value={region.percentage} className="h-2" />
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium p-3">District</th>
                  <th className="text-center font-medium p-3">Region</th>
                  <th className="text-center font-medium p-3">Cases</th>
                  <th className="text-center font-medium p-3">Severity</th>
                </tr>
              </thead>
              <tbody>
                {districtData.slice(0, 10).map((district) => (
                  <tr key={district.district} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{district.district}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">{district.region}</td>
                    <td className="p-3 text-center">
                      <Badge variant="outline">{district.cases.toLocaleString()}</Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Badge
                        variant="outline"
                        className={
                          district.severity === 'high'
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : district.severity === 'medium'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-green-100 text-green-800 border-green-300'
                        }
                      >
                        {district.severity}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            {districtData.slice(0, 5).map((district, index) => {
              const maxCases = districtData[0]?.cases || 1
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
