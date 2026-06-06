'use client'

import { useEffect, useState } from 'react'
import { StatCard } from '@/components/dashboard/stat-card'
import { BarChart } from '@/components/dashboard/charts'
import { FilterPanel, type FilterState } from '@/components/dashboard/filter-panel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendingUp, Award, Clock, Target, HelpCircle } from 'lucide-react'
import { useAnalytics } from '@/hooks/use-analytics'
import { formatFilterSummary, getMortalityRate, getTimestampLabel } from '@/lib/surveillance-dashboard'

interface OutcomeData {
  outcome: string | null
  _count: number
}

export default function TreatmentEffectivenessPage() {
  const { getOutcomes, getDiseases, loading, error } = useAnalytics()
  const [outcomes, setOutcomes] = useState<OutcomeData[]>([])
  const [recoveryRate, setRecoveryRate] = useState('0%')
  const [treatmentSummary, setTreatmentSummary] = useState<any[]>([])
  const [topDiseases, setTopDiseases] = useState<any[]>([])
  const [summaryByDisease, setSummaryByDisease] = useState<Record<string, any>>({})
  const [filters, setFilters] = useState<FilterState>({})
  const [timestamp, setTimestamp] = useState<string>()

  useEffect(() => {
    const fetchData = async () => {
      const [outcomeResponse, diseaseResponse] = await Promise.all([
        getOutcomes({
          ...filters,
          startDate: filters.startDate ? filters.startDate.toISOString().split('T')[0] : undefined,
          endDate: filters.endDate ? filters.endDate.toISOString().split('T')[0] : undefined,
        }),
        getDiseases({
          ...filters,
          startDate: filters.startDate ? filters.startDate.toISOString().split('T')[0] : undefined,
          endDate: filters.endDate ? filters.endDate.toISOString().split('T')[0] : undefined,
          limit: 8,
        }),
      ])

      if (outcomeResponse?.success && outcomeResponse.data) {
        setOutcomes(outcomeResponse.data.outcomes || [])
        setRecoveryRate(outcomeResponse.data.recoveryRate || '0%')
        setTreatmentSummary(outcomeResponse.data.treatmentSummary || [])
        setSummaryByDisease(outcomeResponse.data.summaryByDisease || {})
        setTimestamp(outcomeResponse.timestamp)
      }

      if (diseaseResponse?.success && diseaseResponse.data?.topDiseases) {
        setTopDiseases(diseaseResponse.data.topDiseases)
      }
    }

    fetchData()
  }, [getOutcomes, getDiseases, filters])

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Treatment Effectiveness</h1>
          <p className="text-destructive">Error loading data: {error}</p>
        </div>
      </div>
    )
  }

  const totalRecovered = outcomes.find((o) => o.outcome?.toLowerCase() === 'recovered')?._count || 0
  const totalDeceased = outcomes.reduce((sum, o) => {
    const normalized = o.outcome?.toLowerCase()
    return sum + (normalized === 'deceased' || normalized === 'dead' || normalized === 'death' || normalized === 'died' ? o._count : 0)
  }, 0)
  const totalOutcomes = outcomes.reduce((sum, o) => sum + o._count, 0)
  const diseaseNames = Object.keys(summaryByDisease)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Treatment Effectiveness</h1>
        <p className="text-muted-foreground">
          {loading ? 'Loading treatment data...' : 'Analyze treatment outcomes, success rates, and patient recovery metrics'}
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
        showDateRange={true}
        onFilterChange={(newFilters) => setFilters({ ...filters, ...newFilters })}
      />

      {!loading && (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <StatCard
                      title="Recovery Rate"
                      value={recoveryRate}
                      change={`${totalRecovered.toLocaleString()} recovered`}
                      changeType="positive"
                      description={`${totalOutcomes.toLocaleString()} outcomes`}
                      icon={Award}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>The percentage of patients who successfully recovered from their conditions.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <StatCard
                      title="Mortality Rate"
                      value={getMortalityRate(totalDeceased, totalOutcomes)}
                      change={`${totalDeceased.toLocaleString()} deaths`}
                      changeType="negative"
                      description={`${totalOutcomes.toLocaleString()} outcomes`}
                      icon={Target}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>The proportion of deaths among confirmed cases.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <StatCard
              title="Total Recovered"
              value={totalRecovered.toLocaleString()}
              change="Live"
              changeType="positive"
              description="filtered records"
              icon={TrendingUp}
            />

            <StatCard
              title="Total Outcomes"
              value={totalOutcomes.toLocaleString()}
              change="Live"
              changeType="neutral"
              description="with known status"
              icon={Clock}
            />
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <BarChart
              title="Outcome by Disease"
              description="Stacked comparison of recovered, ongoing, deaths, and unknown"
              labels={diseaseNames}
              datasets={[
                { label: 'Recovered', data: diseaseNames.map((disease) => summaryByDisease[disease]?.recovered || 0), backgroundColor: '#22c55e' },
                { label: 'Ongoing', data: diseaseNames.map((disease) => summaryByDisease[disease]?.ongoing || 0), backgroundColor: '#3b82f6' },
                { label: 'Deaths', data: diseaseNames.map((disease) => summaryByDisease[disease]?.deaths || 0), backgroundColor: '#ef4444' },
                { label: 'Unknown', data: diseaseNames.map((disease) => summaryByDisease[disease]?.unknown || 0), backgroundColor: '#94a3b8' },
              ]}
              horizontal
              stacked
            />
            <BarChart
              title="Cases by Disease"
              description="Filtered disease case totals for context"
              labels={topDiseases.map((d) => d.disease)}
              datasets={[{ label: 'Cases', data: topDiseases.map((d) => d.count) }]}
              horizontal
            />
          </div>

          {/* Treatment Effectiveness */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Treatment Effectiveness
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Treatment protocols ranked by their effectiveness in patient outcomes.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>Treatment protocols with outcome denominators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-medium p-3">Treatment</th>
                      <th className="text-center font-medium p-3">Recovery Rate</th>
                      <th className="text-center font-medium p-3">Mortality Rate</th>
                      <th className="text-center font-medium p-3">Patients</th>
                    </tr>
                  </thead>
                  <tbody>
                    {treatmentSummary.slice(0, 8).map((item) => (
                      <tr key={item.treatment} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium">{item.treatment}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center gap-3 justify-center min-w-[150px]">
                            <Progress value={item.recoveryRate} className="h-2 flex-1" />
                            <span className="text-sm font-medium w-12">{item.recoveryRate}%</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          {item.mortalityRate}%
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="outline">{item.patients.toLocaleString()}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Outcome Distribution Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            {outcomes.map((outcome) => (
              <Card key={outcome.outcome || 'unknown'}>
                <CardHeader>
                  <CardTitle className="text-lg capitalize">{outcome.outcome || 'Unknown'}</CardTitle>
                  <CardDescription>{outcome._count.toLocaleString()} cases</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Percentage</span>
                      <span className="font-medium">
                        {((outcome._count / totalOutcomes) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={(outcome._count / totalOutcomes) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
