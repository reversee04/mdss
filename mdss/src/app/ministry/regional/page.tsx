'use client'

import { useEffect, useState } from 'react'
import { BarChart } from '@/components/dashboard/charts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Loader2, MapPin } from 'lucide-react'
import { getTimestampLabel } from '@/lib/surveillance-dashboard'

export default function RegionalAnalysisPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const demographicsRes = await fetch('/api/analytics/demographics').then((r) => r.json())
        setData({
          districts: demographicsRes.data?.geographicDistribution || [],
          timestamp: demographicsRes.timestamp,
        })
      } catch (error) {
        console.error('Failed to fetch analytics data', error)
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
          <p className="text-muted-foreground">Loading regional data...</p>
        </div>
      </div>
    )
  }

  const districtData = [...data.districts].sort((a: any, b: any) => b.cases - a.cases)
  const totalCases = districtData.reduce((sum: number, district: any) => sum + (district.cases || 0), 0)
  const maxCases = districtData[0]?.cases || 1
  const regionMap = new Map<string, number>()
  districtData.forEach((district: any) => regionMap.set(district.region, (regionMap.get(district.region) || 0) + district.cases))
  const regionalData = Array.from(regionMap.entries())
    .map(([region, cases]) => ({ region, cases, proportion: totalCases > 0 ? (cases / totalCases) * 100 : 0 }))
    .sort((a, b) => b.cases - a.cases)

  const severityFor = (cases: number) => {
    const share = cases / maxCases
    if (share >= 0.75) return 'high'
    if (share >= 0.35) return 'medium'
    return 'low'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Regional Analysis</h1>
          <p className="text-muted-foreground">Disease burden and district priorities by region</p>
          <p className="mt-1 text-xs text-muted-foreground">{getTimestampLabel(data.timestamp)}</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Regional Data
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {regionalData.map((region) => (
          <Card key={region.region}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                {region.region} Region
              </CardTitle>
              <CardDescription>{region.proportion.toFixed(1)}% of national tracked cases</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{region.cases.toLocaleString()}</span>
                <Badge variant="outline">{region.proportion.toFixed(1)}%</Badge>
              </div>
              <Progress value={region.proportion} className="h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <BarChart
        title="Cases by Region"
        description="Ranked regional burden from district encounter aggregation"
        labels={regionalData.map((region) => region.region)}
        datasets={[{ label: 'Cases', data: regionalData.map((region) => region.cases) }]}
        horizontal
      />

      <Card>
        <CardHeader>
          <CardTitle>District Severity Heat Grid</CardTitle>
          <CardDescription>Relative burden classification by district</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Districts</TabsTrigger>
              <TabsTrigger value="high">High Severity</TabsTrigger>
              <TabsTrigger value="medium">Medium Severity</TabsTrigger>
              <TabsTrigger value="low">Low Severity</TabsTrigger>
            </TabsList>

            {['all', 'high', 'medium', 'low'].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6">
                  {districtData
                    .filter((district: any) => tab === 'all' || severityFor(district.cases) === tab)
                    .map((district: any) => {
                      const severity = severityFor(district.cases)
                      return (
                        <div
                          key={district.district}
                          className={
                            severity === 'high'
                              ? 'rounded-lg border border-red-200 bg-red-50 p-3 text-center dark:border-red-900 dark:bg-red-950'
                              : severity === 'medium'
                              ? 'rounded-lg border border-amber-200 bg-amber-50 p-3 text-center dark:border-amber-900 dark:bg-amber-950'
                              : 'rounded-lg border p-3 text-center'
                          }
                        >
                          <p className="truncate text-sm font-medium">{district.district}</p>
                          <p className="text-lg font-bold">{district.cases.toLocaleString()}</p>
                          <Badge variant="outline" className="text-xs">{severity}</Badge>
                        </div>
                      )
                    })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Priority Districts</CardTitle>
          <CardDescription>Districts with the highest reported burden</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {districtData.slice(0, 8).map((district: any, index: number) => (
            <div key={district.district} className="flex items-center gap-4 rounded-lg border p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <span className="font-bold text-primary">{index + 1}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium">{district.district} District</p>
                <p className="text-sm text-muted-foreground">{district.region} region</p>
              </div>
              <Badge variant="outline">{district.cases.toLocaleString()} cases</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

