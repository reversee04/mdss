'use client'

import { useEffect, useState } from 'react'
import { StatCard } from '@/components/dashboard/stat-card'
import { BarChart, PieChart } from '@/components/dashboard/charts'
import { FilterPanel } from '@/components/dashboard/filter-panel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendingUp, Award, Clock, Target, HelpCircle } from 'lucide-react'
import { useAnalytics } from '@/hooks/use-analytics'

interface OutcomeData {
  outcome: string | null
  _count: number
}

export default function TreatmentEffectivenessPage() {
  const { getOutcomes, getDiseases, loading, error } = useAnalytics()
  const [outcomes, setOutcomes] = useState<OutcomeData[]>([])
  const [recoveryRate, setRecoveryRate] = useState('0%')
  const [treatmentEffectiveness, setTreatmentEffectiveness] = useState<Record<string, number>>({})
  const [topDiseases, setTopDiseases] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const [outcomeResponse, diseaseResponse] = await Promise.all([
        getOutcomes(),
        getDiseases({ limit: 8 }),
      ])

      if (outcomeResponse?.success && outcomeResponse.data) {
        setOutcomes(outcomeResponse.data.outcomes || [])
        setRecoveryRate(outcomeResponse.data.recoveryRate || '0%')
        setTreatmentEffectiveness(outcomeResponse.data.treatmentEffectiveness || {})
      }

      if (diseaseResponse?.success && diseaseResponse.data?.topDiseases) {
        setTopDiseases(diseaseResponse.data.topDiseases)
      }
    }

    fetchData()
  }, [getOutcomes, getDiseases])

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
  const totalDeceased = outcomes.find((o) => o.outcome?.toLowerCase() === 'deceased')?._count || 0
  const totalOutcomes = outcomes.reduce((sum, o) => sum + o._count, 0)

  const treatmentArray = Object.entries(treatmentEffectiveness).map(([name, count], idx) => ({
    rank: idx + 1,
    treatment: name,
    successRate: Math.round((count / (totalOutcomes || 1)) * 100),
    patientsCount: count,
  }))

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Treatment Effectiveness</h1>
        <p className="text-muted-foreground">
          {loading ? 'Loading treatment data...' : 'Analyze treatment outcomes, success rates, and patient recovery metrics'}
        </p>
      </div>

      {/* Filters */}
      <FilterPanel
        showDisease={true}
        showLocation={true}
        showTimeRange={true}
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
                      change="+2.3%"
                      changeType="positive"
                      description="vs last quarter"
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
                      value={`${totalOutcomes > 0 ? ((totalDeceased / totalOutcomes) * 100).toFixed(1) : 0}%`}
                      change="-0.8%"
                      changeType="positive"
                      description="vs last quarter"
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
              change="+18.5%"
              changeType="positive"
              description="vs last quarter"
              icon={TrendingUp}
            />

            <StatCard
              title="Total Outcomes"
              value={totalOutcomes.toLocaleString()}
              change="+12%"
              changeType="positive"
              description="vs last quarter"
              icon={Clock}
            />
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <BarChart
              title="Cases by Disease (Top 8)"
              description="Disease cases across patient population"
              labels={topDiseases.map((d) => d.disease)}
              datasets={[
                {
                  label: 'Cases',
                  data: topDiseases.map((d) => d.count),
                },
              ]}
            />
            <PieChart
              title="Outcome Distribution"
              description="Patient outcomes breakdown"
              labels={outcomes.map((o) => o.outcome || 'Unknown')}
              data={outcomes.map((o) => o._count)}
              doughnut
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
              <CardDescription>Treatment protocols by effectiveness</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left font-medium p-3">Rank</th>
                      <th className="text-left font-medium p-3">Treatment</th>
                      <th className="text-center font-medium p-3">Success Rate</th>
                      <th className="text-center font-medium p-3">Patients</th>
                    </tr>
                  </thead>
                  <tbody>
                    {treatmentArray.slice(0, 8).map((item) => (
                      <tr key={item.treatment} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <span
                            className={`font-bold ${item.rank === 1 ? 'text-amber-500' : item.rank === 2 ? 'text-gray-400' : item.rank === 3 ? 'text-amber-700' : ''}`}
                          >
                            #{item.rank}
                          </span>
                        </td>
                        <td className="p-3 font-medium">{item.treatment}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center gap-3 justify-center min-w-[150px]">
                            <Progress value={item.successRate} className="h-2 flex-1" />
                            <span className="text-sm font-medium w-12">{item.successRate}%</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="outline">{item.patientsCount.toLocaleString()}</Badge>
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
