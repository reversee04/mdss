'use client'

import { LineChart, BarChart } from '@/components/dashboard/charts'
import { FilterPanel } from '@/components/dashboard/filter-panel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { generateTimeSeriesData, diseaseStats } from '@/lib/mock-data'

const timeSeriesData = generateTimeSeriesData(12)
const weeklyData = generateTimeSeriesData(4)

const trendIndicator = (value: number) => {
  if (value > 5) return { icon: TrendingUp, color: 'text-red-500', label: 'Increasing' }
  if (value < -5) return { icon: TrendingDown, color: 'text-green-500', label: 'Decreasing' }
  return { icon: Minus, color: 'text-gray-500', label: 'Stable' }
}

export default function TrendsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Disease Trends</h1>
        <p className="text-muted-foreground">
          Monitor disease trends and patterns over time
        </p>
      </div>

      {/* Filters */}
      <FilterPanel
        showDisease={true}
        showLocation={true}
        showTimeRange={true}
      />

      {/* Trend Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {diseaseStats.map((disease) => {
          const change = Math.floor(Math.random() * 30) - 15
          const trend = trendIndicator(change)
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
                  <span className="text-2xl font-bold">{disease.cases.toLocaleString()}</span>
                  <div className={`flex items-center gap-1 ${trend.color}`}>
                    <TrendIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">{Math.abs(change)}%</span>
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
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          <LineChart
            title="Weekly Disease Trends"
            description="Cases reported in the last 4 weeks"
            labels={weeklyData.map((d) => d.month)}
            datasets={[
              { label: 'HIV/AIDS', data: weeklyData.map((d) => d.hiv) },
              { label: 'Malaria', data: weeklyData.map((d) => d.malaria) },
              { label: 'TB', data: weeklyData.map((d) => d.tb) },
              { label: 'Cholera', data: weeklyData.map((d) => d.cholera) },
            ]}
          />
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <LineChart
            title="Monthly Disease Trends"
            description="Cases reported over the last 12 months"
            labels={timeSeriesData.map((d) => d.month)}
            datasets={[
              { label: 'HIV/AIDS', data: timeSeriesData.map((d) => d.hiv) },
              { label: 'Malaria', data: timeSeriesData.map((d) => d.malaria) },
              { label: 'TB', data: timeSeriesData.map((d) => d.tb) },
              { label: 'Cholera', data: timeSeriesData.map((d) => d.cholera) },
            ]}
          />
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <BarChart
              title="Year-over-Year Comparison"
              description="Cases this year vs last year"
              labels={diseaseStats.map((d) => d.disease)}
              datasets={[
                {
                  label: 'This Year',
                  data: diseaseStats.map((d) => d.cases),
                },
                {
                  label: 'Last Year',
                  data: diseaseStats.map((d) => Math.floor(d.cases * (0.8 + Math.random() * 0.4))),
                  backgroundColor: '#94a3b8',
                },
              ]}
            />
            <BarChart
              title="Monthly Case Comparison"
              description="Current month vs previous month"
              labels={diseaseStats.map((d) => d.disease)}
              datasets={[
                {
                  label: 'Current Month',
                  data: diseaseStats.map((d) => Math.floor(d.cases / 12)),
                },
                {
                  label: 'Previous Month',
                  data: diseaseStats.map((d) => Math.floor((d.cases / 12) * (0.9 + Math.random() * 0.2))),
                  backgroundColor: '#94a3b8',
                },
              ]}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Individual Disease Trends */}
      <div className="grid gap-4 md:grid-cols-2">
        <LineChart
          title="HIV/AIDS Trend"
          description="Monthly HIV/AIDS cases"
          labels={timeSeriesData.map((d) => d.month)}
          datasets={[
            { label: 'Cases', data: timeSeriesData.map((d) => d.hiv), borderColor: '#006cbf' },
          ]}
        />
        <LineChart
          title="Malaria Trend"
          description="Monthly malaria cases"
          labels={timeSeriesData.map((d) => d.month)}
          datasets={[
            { label: 'Cases', data: timeSeriesData.map((d) => d.malaria), borderColor: '#22c55e' },
          ]}
        />
        <LineChart
          title="Tuberculosis Trend"
          description="Monthly TB cases"
          labels={timeSeriesData.map((d) => d.month)}
          datasets={[
            { label: 'Cases', data: timeSeriesData.map((d) => d.tb), borderColor: '#f59e0b' },
          ]}
        />
        <LineChart
          title="Cholera Trend"
          description="Monthly cholera cases"
          labels={timeSeriesData.map((d) => d.month)}
          datasets={[
            { label: 'Cases', data: timeSeriesData.map((d) => d.cholera), borderColor: '#ef4444' },
          ]}
        />
      </div>
    </div>
  )
}
