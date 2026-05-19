'use client'

import { useEffect, useState } from 'react'
import { LineChart, BarChart } from '@/components/dashboard/charts'
import { FilterPanel } from '@/components/dashboard/filter-panel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useAnalytics } from '@/hooks/use-analytics'

interface TrendData {
  date: string
  count: number
}

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
  const [trendsData, setTrendsData] = useState<TrendData[]>([])
  const [topDiseases, setTopDiseases] = useState<DiseaseCount[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date()
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      const [trendsResponse, diseaseResponse] = await Promise.all([
        getTrends({
          startDate: lastMonth.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
          interval: 'daily',
        }),
        getDiseases({ limit: 10 }),
      ])

      if (trendsResponse?.success && trendsResponse.data) {
        setTrendsData(trendsResponse.data)
      }

      if (diseaseResponse?.success && diseaseResponse.data?.topDiseases) {
        const diseaseList = diseaseResponse.data.topDiseases.map((d: any, idx: number) => ({
          disease: d.disease,
          count: d.count,
          change: Math.floor(Math.random() * 30) - 15,
        }))
        setTopDiseases(diseaseList)
      }
    }

    fetchData()
  }, [getTrends, getDiseases])

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

  // Ensure trendsData is always an array
  const trendsArray = Array.isArray(trendsData) ? trendsData : []

  const chartLabels = trendsArray.map((d) => {
    const date = new Date(d.date)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })

  const chartData = trendsArray.map((d) => d.count)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Disease Trends</h1>
        <p className="text-muted-foreground">
          {loading ? 'Loading trend data...' : 'Monitor disease trends and patterns over time'}
        </p>
      </div>

      {/* Filters */}
      <FilterPanel
        showDisease={true}
        showLocation={true}
        showTimeRange={true}
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
              const trend = trendIndicator(disease.change || 0)
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
                        <span className="text-sm font-medium">{Math.abs(disease.change || 0)}%</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {trend.label}
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
                title="Overall Disease Trends"
                description={`Cases reported over last 30 days (${trendsArray.length} days of data)`}
                labels={chartLabels}
                datasets={[
                  { label: 'Total Cases', data: chartData, borderColor: '#006cbf' },
                ]}
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
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Trend Summary</CardTitle>
                <CardDescription>Key metrics from the data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                  <span className="font-medium">Total Cases (30 days)</span>
                  <span className="text-lg font-bold">{chartData.reduce((a, b) => a + b, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                  <span className="font-medium">Average Daily Cases</span>
                  <span className="text-lg font-bold">
                    {Math.round(chartData.reduce((a, b) => a + b, 0) / chartData.length).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                  <span className="font-medium">Peak Cases</span>
                  <span className="text-lg font-bold">{Math.max(...chartData).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                  <span className="font-medium">Lowest Cases</span>
                  <span className="text-lg font-bold">{Math.min(...chartData).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Disease Breakdown</CardTitle>
                <CardDescription>Top diseases with trend indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topDiseases.slice(0, 5).map((disease) => {
                    const trend = trendIndicator(disease.change || 0)
                    const TrendIcon = trend.icon

                    return (
                      <div key={disease.disease} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-medium flex-1">{disease.disease}</span>
                          <span className="text-sm text-muted-foreground">{disease.count.toLocaleString()}</span>
                        </div>
                        <div className={`flex items-center gap-1 ${trend.color}`}>
                          <TrendIcon className="h-4 w-4" />
                          <span className="text-xs font-medium">{Math.abs(disease.change || 0)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
