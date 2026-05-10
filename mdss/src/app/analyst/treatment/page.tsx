'use client'

import { StatCard } from '@/components/dashboard/stat-card'
import { BarChart, PieChart } from '@/components/dashboard/charts'
import { FilterPanel } from '@/components/dashboard/filter-panel'
import { DataTable } from '@/components/dashboard/data-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendingUp, Award, Clock, Target, HelpCircle } from 'lucide-react'
import { treatmentData, diseaseStats } from '@/lib/mock-data'

export default function TreatmentEffectivenessPage() {
  const avgTSR = diseaseStats.reduce((sum, d) => sum + d.tsr, 0) / diseaseStats.length
  const avgCFR = diseaseStats.reduce((sum, d) => sum + d.cfr, 0) / diseaseStats.length
  const totalRecoveries = diseaseStats.reduce((sum, d) => sum + d.recoveries, 0)

  const sortedTreatments = treatmentData
    .sort((a, b) => b.successRate - a.successRate)
    .map((item, index) => ({ ...item, rank: index + 1 }))

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Treatment Effectiveness</h1>
        <p className="text-muted-foreground">
          Analyze treatment outcomes, success rates, and patient recovery metrics
        </p>
      </div>

      {/* Filters */}
      <FilterPanel
        showDisease={true}
        showLocation={true}
        showTimeRange={true}
      />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <StatCard
                  title="Treatment Success Rate (TSR)"
                  value={`${avgTSR.toFixed(1)}%`}
                  change="+2.3%"
                  changeType="positive"
                  description="vs last quarter"
                  icon={Award}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>The percentage of patients who successfully completed treatment and achieved desired health outcomes.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <StatCard
                  title="Case Fatality Rate (CFR)"
                  value={`${avgCFR.toFixed(1)}%`}
                  change="-0.8%"
                  changeType="positive"
                  description="vs last quarter"
                  icon={Target}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>The proportion of deaths among confirmed cases of a specific disease.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <StatCard
          title="Total Recoveries"
          value={totalRecoveries}
          change="+18.5%"
          changeType="positive"
          description="vs last quarter"
          icon={TrendingUp}
        />

        <StatCard
          title="Avg. Recovery Time"
          value="45 days"
          change="-5 days"
          changeType="positive"
          description="vs last quarter"
          icon={Clock}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <BarChart
          title="Treatment Success Rate by Disease"
          description="Percentage of successful treatments"
          labels={diseaseStats.map((d) => d.disease)}
          datasets={[
            {
              label: 'TSR (%)',
              data: diseaseStats.map((d) => d.tsr),
            },
          ]}
        />
        <PieChart
          title="Patients by Treatment Type"
          description="Distribution across treatment protocols"
          labels={treatmentData.slice(0, 5).map((t) => t.treatment)}
          data={treatmentData.slice(0, 5).map((t) => t.patientsCount)}
          doughnut
        />
      </div>

      {/* Treatment Rankings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Treatment Rankings
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Treatments ranked by their success rate across all patients.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>Treatment protocols ranked by effectiveness</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={sortedTreatments}
            columns={[
              {
                key: 'rank',
                header: 'Rank',
                render: (item) => (
                  <span className={`font-bold ${item.rank === 1 ? 'text-amber-500' : item.rank === 2 ? 'text-gray-400' : item.rank === 3 ? 'text-amber-700' : ''}`}>
                    #{item.rank}
                  </span>
                ),
              },
              { key: 'treatment', header: 'Treatment Protocol' },
              {
                key: 'disease',
                header: 'Disease',
                render: (item) => <Badge variant="outline">{item.disease}</Badge>,
              },
              {
                key: 'successRate',
                header: 'Success Rate',
                render: (item) => (
                  <div className="flex items-center gap-3 min-w-[150px]">
                    <Progress value={item.successRate} className="h-2 flex-1" />
                    <span className="text-sm font-medium w-12">{item.successRate}%</span>
                  </div>
                ),
              },
              {
                key: 'patientsCount',
                header: 'Patients',
                render: (item) => item.patientsCount.toLocaleString(),
              },
            ]}
            searchPlaceholder="Search treatments..."
            pageSize={8}
          />
        </CardContent>
      </Card>

      {/* Disease-specific Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        {diseaseStats.map((disease) => (
          <Card key={disease.disease}>
            <CardHeader>
              <CardTitle className="text-lg">{disease.disease}</CardTitle>
              <CardDescription>{disease.cases.toLocaleString()} total cases</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Treatment Success Rate</span>
                  <span className="font-medium">{disease.tsr}%</span>
                </div>
                <Progress value={disease.tsr} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Recovery Rate</span>
                  <span className="font-medium">
                    {((disease.recoveries / disease.cases) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={(disease.recoveries / disease.cases) * 100} className="h-2" />
              </div>
              <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">CFR</p>
                  <p className="text-lg font-semibold text-red-600">{disease.cfr}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Median Recovery</p>
                  <p className="text-lg font-semibold">{disease.medianRecoveryDays}d</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Active</p>
                  <p className="text-lg font-semibold">{disease.activeCases.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
