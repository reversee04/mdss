'use client'

import { useEffect, useState } from 'react'
import { LineChart, BarChart } from '@/components/dashboard/charts'
import { FilterPanel, type FilterState } from '@/components/dashboard/filter-panel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useAnalytics } from '@/hooks/use-analytics'
import {
  buildDiseaseDatasets,
  formatFilterSummary,
  formatTrendLabels,
  getAllTrendDates,
  getTimestampLabel,
  getTrendSeries,
  getTrendSummary,
} from '@/lib/surveillance-dashboard'

interface DiseaseCount {
  disease: string
  count: number
  change?: number
}

const trendIndicator = (value: number) => {
  if (value > 5) return { icon: TrendingUp, color: 'text-red-500', label: 'Increasing' }
  if (value < -5) return { icon: TrendingDown, color: 'text-green-500', label: 'Decreasing' }
  return { icon: Minus, color: 'text-gray-500', label: 'Stable' }
}

export default function TrendsPage() {
  const { getTrends, getDiseases, loading, error } = useAnalytics()
  const [trendsData, setTrendsData] = useState<any>(null)
  const [topDiseases, setTopDiseases] = useState<DiseaseCount[]>([])
  const [filters, setFilters] = useState<FilterState>({})
  const [timestamp, setTimestamp] = useState<string>()

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date()
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      const [trendsResponse, diseaseResponse] = await Promise.all([
        getTrends({
          ...filters,
          startDate: filters.startDate ? filters.startDate.toISOString().split('T')[0] : lastMonth.toISOString().split('T')[0],
          endDate: filters.endDate ? filters.endDate.toISOString().split('T')[0] : today.toISOString().split('T')[0],
          interval: 'daily',
        }),
        getDiseases({ ...filters, limit: 10 }),
      ])

      if (trendsResponse?.success && trendsResponse.data) {
        setTrendsData(trendsResponse.data)
        setTimestamp(trendsResponse.timestamp)
      }

      if (diseaseResponse?.success && diseaseResponse.data?.topDiseases) {
        const diseaseList = diseaseResponse.data.topDiseases.map((d: any, idx: number) => ({
          disease: d.disease,
          count: d.count,
          change: trendsResponse?.data?.summaryByDisease?.[d.disease]?.changePercent || 0,
        }))
        setTopDiseases(diseaseList)
      }
    }

    fetchData()
  }, [getTrends, getDiseases, filters])

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Disease Trends</h1>
          <p className="text-destructive">Error loading data: {error}</p>
        </div>
      </div>
    )
  }

  const series = getTrendSeries(trendsData)
  const summaryByDisease = getTrendSummary(trendsData)
  const dates = getAllTrendDates(series)
  const datasets = buildDiseaseDatasets(series)
  const chartLabels = formatTrendLabels(dates)

  // Calculate total and average from all datasets
  const totalCases = datasets.reduce((sum, dataset) => {
    return sum + dataset.data.reduce((a: number, b: number) => a + b, 0)
  }, 0)
  
  const allValues = datasets.flatMap(d => d.data)
  const avgDaily = allValues.length > 0 ? Math.round(totalCases / allValues.length) : 0
  const peakCases = allValues.length > 0 ? Math.max(...allValues) : 0
  const lowestCases = allValues.length > 0 ? Math.min(...(allValues.filter(v => v > 0))) : 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Disease Trends</h1>
        <p className="text-muted-foreground">
          {loading ? 'Loading trend data...' : 'Monitor disease trends and patterns over time'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {getTimestampLabel(timestamp)} | {formatFilterSummary(filters)}
        </p>
      </div>

      {/* Filters */}
      <FilterPanel
        showDisease={true}
        showLocation={true}
        showTimeRange={true}
        onFilterChange={(newFilters) => setFilters({ ...filters, ...newFilters })}
      />

      {loading && (
        <div className="grid gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && (
        <>
          {/* Trend Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            {topDiseases.slice(0, 4).map((disease) => {
              const summary = summaryByDisease[disease.disease] || {}
              const trend = trendIndicator(summary.changePercent || 0)
              const TrendIcon = trend.icon

              return (
                <Card key={disease.disease}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {disease.disease}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{disease.count.toLocaleString()}</span>
                      <div className={`flex items-center gap-1 ${trend.color}`}>
                        <TrendIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">{Math.abs(summary.changePercent || 0)}%</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {trend.label} | 7-day avg {summary.current7DayAvg || 0}
                    </Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Time Series Charts */}
          <Tabs defaultValue="monthly" className="space-y-4">
            <TabsList>
              <TabsTrigger value="monthly">Trend Overview</TabsTrigger>
              <TabsTrigger value="comparison">Disease Comparison</TabsTrigger>
            </TabsList>

            <TabsContent value="monthly" className="space-y-4">
              <LineChart
                title="Disease Trends Over Time"
                description={`Individual disease trends over the selected period (${dates.length} days of data)`}
                labels={chartLabels}
                datasets={datasets.length > 0 ? datasets : [{ label: 'No Data', data: [], borderColor: '#006cbf' }]}
              />
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              <div className="grid gap-4">
                <BarChart
                  title="Top Diseases"
                  description="Top 10 diseases by case count"
                  labels={topDiseases.slice(0, 10).map((d) => d.disease)}
                  datasets={[
                    {
                      label: 'Cases',
                      data: topDiseases.slice(0, 10).map((d) => d.count),
                    },
                  ]}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Trend Statistics */}
          <div className="space-y-6">
            {/* Overall Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Trend Summary</CardTitle>
                <CardDescription>Aggregate metrics across all diseases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-muted-foreground">Total Cases</span>
                    <span className="text-2xl font-bold">{totalCases.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-muted-foreground">Average Daily</span>
                    <span className="text-2xl font-bold">{avgDaily.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-muted-foreground">Peak Cases</span>
                    <span className="text-2xl font-bold">{peakCases.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-muted-foreground">Lowest Cases</span>
                    <span className="text-2xl font-bold">{lowestCases.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Individual Disease Statistics */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Disease-Specific Trends</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {datasets.map((dataset) => {
                  const summary = summaryByDisease[dataset.label] || {}
                  const diseaseTotal = summary.total || dataset.data.reduce((a, b) => a + b, 0)
                  const diseaseAvg = summary.current7DayAvg || 0
                  const diseasePeak = summary.peak || 0
                  const anomalyCount = summary.anomalies?.length || 0

                  return (
                    <Card key={dataset.label}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: dataset.borderColor }}
                          />
                          <CardTitle className="text-base">{dataset.label}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total</span>
                          <span className="font-semibold">{diseaseTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Average</span>
                          <span className="font-semibold">{diseaseAvg.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Peak</span>
                          <span className="font-semibold">{diseasePeak.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Anomaly days</span>
                          <span className="font-semibold">{anomalyCount.toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t">
                          <Badge 
                            variant="outline" 
                            style={{ 
                              backgroundColor: dataset.borderColor + '20',
                              borderColor: dataset.borderColor,
                              color: dataset.borderColor
                            }}
                            className="text-xs font-medium"
                          >
                            {Math.round((diseaseTotal / totalCases) * 100)}% of total
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
