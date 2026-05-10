'use client'

import { BarChart, PieChart } from '@/components/dashboard/charts'
import { FilterPanel } from '@/components/dashboard/filter-panel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Users, User, Baby, PersonStanding } from 'lucide-react'
import { ageDistribution, sexDistribution, diseaseStats } from '@/lib/mock-data'

export default function DemographicsPage() {
  const totalCases = ageDistribution.reduce((sum, a) => sum + a.cases, 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Demographics Analysis</h1>
        <p className="text-muted-foreground">
          Case distribution by age, sex, and population groups
        </p>
      </div>

      {/* Filters */}
      <FilterPanel
        showDisease={true}
        showLocation={true}
        showTimeRange={true}
      />

      {/* Sex Distribution Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        {sexDistribution.map((sex) => (
          <Card key={sex.sex}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {sex.sex}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-bold">{sex.cases.toLocaleString()}</span>
                <Badge variant="outline" className="text-lg">
                  {sex.percentage}%
                </Badge>
              </div>
              <Progress value={sex.percentage} className="h-3" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <BarChart
          title="Cases by Age Group"
          description="Distribution across age groups"
          labels={ageDistribution.map((a) => a.ageGroup)}
          datasets={[
            {
              label: 'Cases',
              data: ageDistribution.map((a) => a.cases),
            },
          ]}
        />
        <PieChart
          title="Sex Distribution"
          description="Male vs Female cases"
          labels={sexDistribution.map((s) => s.sex)}
          data={sexDistribution.map((s) => s.cases)}
          doughnut
        />
      </div>

      {/* Age Group Details */}
      <Card>
        <CardHeader>
          <CardTitle>Age Group Analysis</CardTitle>
          <CardDescription>Detailed breakdown by age group</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {ageDistribution.map((age) => {
              const Icon = age.ageGroup === '0-4' || age.ageGroup === '5-14' 
                ? Baby 
                : age.ageGroup === '65+' 
                ? PersonStanding 
                : Users
              
              return (
                <div key={age.ageGroup} className="p-4 rounded-lg border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{age.ageGroup} years</p>
                      <p className="text-sm text-muted-foreground">{age.percentage}% of cases</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cases</span>
                      <span className="font-medium">{age.cases.toLocaleString()}</span>
                    </div>
                    <Progress value={age.percentage} className="h-2" />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Disease by Demographics */}
      <Card>
        <CardHeader>
          <CardTitle>Disease Distribution by Demographics</CardTitle>
          <CardDescription>How diseases affect different population groups</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium p-3">Disease</th>
                  <th className="text-center font-medium p-3">0-14 yrs</th>
                  <th className="text-center font-medium p-3">15-44 yrs</th>
                  <th className="text-center font-medium p-3">45+ yrs</th>
                  <th className="text-center font-medium p-3">Male</th>
                  <th className="text-center font-medium p-3">Female</th>
                </tr>
              </thead>
              <tbody>
                {diseaseStats.map((disease) => (
                  <tr key={disease.disease} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">{disease.disease}</td>
                    <td className="p-3 text-center">
                      <Badge variant="outline">
                        {Math.floor(disease.cases * 0.23).toLocaleString()}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="outline">
                        {Math.floor(disease.cases * 0.63).toLocaleString()}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="outline">
                        {Math.floor(disease.cases * 0.14).toLocaleString()}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="secondary">
                        {Math.floor(disease.cases * 0.47).toLocaleString()}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="secondary">
                        {Math.floor(disease.cases * 0.53).toLocaleString()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Demographic Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Most Affected Age Group</h4>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">25-34 years</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">24.5% of all cases</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800">
              <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">Higher Risk Sex</h4>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">Female</p>
              <p className="text-sm text-purple-700 dark:text-purple-300">52.9% of reported cases</p>
            </div>
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
              <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Pediatric Cases</h4>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">23.4%</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">Under 15 years old</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
