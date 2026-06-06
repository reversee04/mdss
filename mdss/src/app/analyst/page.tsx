'use client'

import { useEffect, useState } from 'react'
import { StatCard } from '@/components/dashboard/stat-card'
import { BarChart, LineChart } from '@/components/dashboard/charts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Activity, AlertTriangle, Loader2, MapPin, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react'
import {
  buildDiseaseDatasets,
  combineTrendTotals,
  diseaseColors,
  formatTrendLabels,
  getAllTrendDates,
  getMortalityRate,
  getOutcomeCount,
  getTimestampLabel,
  getTrendSeries,
  getTrendSummary,
} from '@/lib/surveillance-dashboard'

export default function AnalystDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null)
        const response = await fetch('/api/analytics/surveillance-dashboard')
        const dashboardRes = await response.json()

        if (!response.ok || !dashboardRes.success) {
          throw new Error(dashboardRes.error || 'Failed to load dashboard data')
        }

        setData({
          ...dashboardRes.data,
          timestamp: dashboardRes.timestamp,
        })
      } catch (error) {
        console.error('Failed to fetch analytics data', error)
        setError(error instanceof Error ? error.message : 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading || !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading surveillance signals...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
        <CardHeader>
          <CardTitle>Unable to load surveillance dashboard</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const series = getTrendSeries(data.trends)
  const trendSummary = getTrendSummary(data.trends)
  const dates = getAllTrendDates(series)
  const diseaseDatasets = buildDiseaseDatasets(series)
  const totalTrend = combineTrendTotals(series)
  const topDiseases = data.diseases?.topDiseases || []
  const outcomes = data.outcomes?.outcomes || []
  const totalCases = topDiseases.reduce((sum: number, disease: any) => sum + disease.count, 0)
  const deaths = getOutcomeCount(outcomes, ['dead', 'death', 'died', 'deceased'])
  const recovered = getOutcomeCount(outcomes, ['recovered'])
  const outcomeTotal = outcomes.reduce((sum: number, outcome: any) => sum + (outcome._count || 0), 0)
  const districts = data.demographics?.geographicDistribution || []
  const priorityDistricts = districts.slice(0, 5)
  const activeAlerts = data.alerts?.active || []
  const monitoring = data.monitoring || {}
  const hasCases = totalCases > 0
  const displayDistricts = (data.districtSummaries || priorityDistricts).slice(0, 5)
  const maxDisplayDistrictCases = displayDistricts[0]?.cases || 1

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Surveillance Triage</h1>
          <p className="text-muted-foreground">
            Where burden is rising, which disease is driving it, and what needs attention.
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          {getTimestampLabel(data.timestamp)}
        </Badge>
      </div>

      <Card className={activeAlerts.length > 0 ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950' : ''}>
        <CardContent className="flex flex-col gap-4 py-4 md:flex-row md:items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium">{activeAlerts.length} active unacknowledged alert{activeAlerts.length === 1 ? '' : 's'}</p>
            <p className="text-sm text-muted-foreground">
              {activeAlerts[0]?.message || 'No active outbreak alerts requiring immediate analyst action.'}
            </p>
          </div>
          <Badge variant={activeAlerts.length > 0 ? 'destructive' : 'outline'}>
            {activeAlerts.length > 0 ? 'Review now' : 'Stable'}
          </Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Tracked Cases" value={totalCases} change="Live" changeType="neutral" description="focused diseases" icon={Activity} />
        <StatCard title="Recovered" value={recovered} change={data.outcomes?.recoveryRate || '0%'} changeType="positive" description={`${outcomeTotal.toLocaleString()} outcomes`} icon={ShieldCheck} />
        <StatCard title="Deaths" value={deaths} change={getMortalityRate(deaths, outcomeTotal)} changeType="negative" description="case fatality rate" icon={TrendingDown} />
        <StatCard title="Locations Checked" value={monitoring.locationsChecked || 0} change={`${monitoring.affectedLocations?.length || 0} affected`} changeType="neutral" description="latest monitoring scope" icon={MapPin} />
      </div>

      {!hasCases && (
        <Card>
          <CardHeader>
            <CardTitle>No surveillance encounters found</CardTitle>
            <CardDescription>
              The database has no focused-disease encounters for the current filters yet.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {topDiseases.slice(0, 4).map((disease: any) => {
          const summary = trendSummary[disease.disease] || {}
          const direction = summary.direction || 'stable'
          const changeType = direction === 'increasing' ? 'negative' : direction === 'decreasing' ? 'positive' : 'neutral'

          return (
            <Card key={disease.disease}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-medium">{disease.disease}</CardTitle>
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: diseaseColors[disease.disease] || '#006cbf' }} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end justify-between gap-2">
                  <span className="text-2xl font-bold">{disease.count.toLocaleString()}</span>
                  <Badge variant="outline" className={changeType === 'negative' ? 'border-red-300 text-red-700' : changeType === 'positive' ? 'border-green-300 text-green-700' : ''}>
                    {summary.changePercent ?? 0}%
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">7-day avg</p>
                    <p className="font-medium">{summary.current7DayAvg ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Peak</p>
                    <p className="font-medium">{summary.peak ?? 0}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground capitalize">{direction}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <LineChart
          title="Epidemic Curve by Disease"
          description="Daily case movement with stable disease colors"
          labels={formatTrendLabels(dates)}
          datasets={diseaseDatasets}
        />
        <BarChart
          title="Disease Burden"
          description="Current tracked case totals"
          labels={topDiseases.map((disease: any) => disease.disease)}
          datasets={[{ label: 'Cases', data: topDiseases.map((disease: any) => disease.count) }]}
          horizontal
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Highest-Risk Districts</CardTitle>
            <CardDescription>Ranked by active alerts and actual encounter burden</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayDistricts.map((district: any, index: number) => {
              return (
                <div key={district.district} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{index + 1}. {district.district}</p>
                      <p className="text-sm text-muted-foreground">{district.region}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={district.outbreakAlerts > 0 ? 'destructive' : 'outline'}>
                        {district.cases.toLocaleString()} cases
                      </Badge>
                      {district.alerts > 0 && <span className="text-xs text-muted-foreground">{district.alerts} active alerts</span>}
                    </div>
                  </div>
                  <Progress value={(district.cases / maxDisplayDistrictCases) * 100} className="h-2" />
                </div>
              )
            })}
            {displayDistricts.length === 0 && (
              <p className="text-sm text-muted-foreground">No district case summaries are available yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outcome Snapshot</CardTitle>
            <CardDescription>Recovered, deaths, ongoing, and unknown outcomes by disease</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left font-medium">Disease</th>
                    <th className="p-3 text-center font-medium">Recovered</th>
                    <th className="p-3 text-center font-medium">Deaths</th>
                    <th className="p-3 text-center font-medium">Recovery</th>
                    <th className="p-3 text-center font-medium">Mortality</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.outcomes?.summaryByDisease || {}).map(([disease, summary]: [string, any]) => (
                    <tr key={disease} className="border-b">
                      <td className="p-3 font-medium">{disease}</td>
                      <td className="p-3 text-center">{summary.recovered.toLocaleString()}</td>
                      <td className="p-3 text-center">{summary.deaths.toLocaleString()}</td>
                      <td className="p-3 text-center">{summary.recoveryRate}%</td>
                      <td className="p-3 text-center">{summary.mortalityRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {Object.keys(data.outcomes?.summaryByDisease || {}).length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">No outcome records are available yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
