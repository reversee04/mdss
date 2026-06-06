'use client'

import { useEffect, useState } from 'react'
import { BarChart } from '@/components/dashboard/charts'
import { FilterPanel, type FilterState } from '@/components/dashboard/filter-panel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { MapPin } from 'lucide-react'
import { useAnalytics } from '@/hooks/use-analytics'
import { formatFilterSummary, getTimestampLabel } from '@/lib/surveillance-dashboard'

interface DistrictData {
  district: string
  region: string
  cases: number
  diseases?: Record<string, number>
}

export default function GeographicAnalysisPage() {
  const { getDemographics, loading, error } = useAnalytics()
  const [districtData, setDistrictData] = useState<DistrictData[]>([])
  const [filters, setFilters] = useState<FilterState>({})
  const [timestamp, setTimestamp] = useState<string>()

  useEffect(() => {
    const fetchData = async () => {
      const response = await getDemographics({
        ...filters,
        startDate: filters.startDate ? filters.startDate.toISOString().split('T')[0] : undefined,
        endDate: filters.endDate ? filters.endDate.toISOString().split('T')[0] : undefined,
      })

      if (response?.success && response.data) {
        setDistrictData((response.data.geographicDistribution || []).sort((a: DistrictData, b: DistrictData) => b.cases - a.cases))
        setTimestamp(response.timestamp)
      }
    }

    fetchData()
  }, [getDemographics, filters])

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

  const totalCases = districtData.reduce((sum, district) => sum + district.cases, 0)
  const regionMap = new Map<string, number>()
  districtData.forEach((district) => regionMap.set(district.region, (regionMap.get(district.region) || 0) + district.cases))
  const regionalData = Array.from(regionMap.entries())
    .map(([region, cases]) => ({ region, cases, percentage: totalCases > 0 ? Math.round((cases / totalCases) * 100) : 0 }))
    .sort((a, b) => b.cases - a.cases)
  const maxDistrictCases = districtData[0]?.cases || 1

  const severityFor = (cases: number) => {
    const share = cases / maxDistrictCases
    if (share >= 0.75) return 'high'
    if (share >= 0.35) return 'medium'
    return 'low'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Geographic Analysis</h1>
        <p className="text-muted-foreground">
          Disease burden across regions and districts using actual encounter locations.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {getTimestampLabel(timestamp)} | {formatFilterSummary(filters)}
        </p>
      </div>

      <FilterPanel
        showDisease
        showLocation
        showTimeRange
        showDateRange
        onFilterChange={(newFilters) => setFilters({ ...filters, ...newFilters })}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {regionalData.map((region) => (
          <Card key={region.region}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                {region.region} Region
              </CardTitle>
              <CardDescription>{region.percentage}% of filtered cases</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{region.cases.toLocaleString()}</span>
                <Badge variant="outline">{region.percentage}%</Badge>
              </div>
              <Progress value={region.percentage} className="h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>District Heat Grid</CardTitle>
          <CardDescription>Relative case burden by district</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {districtData.map((district) => {
              const severity = severityFor(district.cases)
              return (
                <div
                  key={district.district}
                  className={
                    severity === 'high'
                      ? 'rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950'
                      : severity === 'medium'
                      ? 'rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950'
                      : 'rounded-md border p-3'
                  }
                >
                  <p className="truncate text-sm font-medium">{district.district}</p>
                  <p className="text-lg font-bold">{district.cases.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{district.region}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ranked District Burden</CardTitle>
            <CardDescription>Top districts by filtered cases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left font-medium">District</th>
                    <th className="p-3 text-left font-medium">Region</th>
                    <th className="p-3 text-center font-medium">Cases</th>
                    <th className="p-3 text-center font-medium">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {districtData.slice(0, 12).map((district) => {
                    const severity = severityFor(district.cases)
                    return (
                      <tr key={district.district} className="border-b">
                        <td className="p-3 font-medium">{district.district}</td>
                        <td className="p-3">{district.region}</td>
                        <td className="p-3 text-center">{district.cases.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className={severity === 'high' ? 'border-red-300 text-red-700' : severity === 'medium' ? 'border-amber-300 text-amber-700' : ''}>
                            {severity}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <BarChart
          title="Cases by Region"
          description="Regional totals from district encounter aggregation"
          labels={regionalData.map((region) => region.region)}
          datasets={[{ label: 'Cases', data: regionalData.map((region) => region.cases) }]}
          horizontal
        />
      </div>
    </div>
  )
}

