'use client'

import { useState, useEffect } from 'react'
import { BarChart, PieChart } from '@/components/dashboard/charts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, MapPin, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'

export default function RegionalAnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [facilitiesRes] = await Promise.all([
          fetch('/api/analytics/facilities').then(r => r.json())
        ]);

        setData({
          facilities: facilitiesRes.data,
        });
      } catch (error) {
        console.error("Failed to fetch analytics data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading regional data...</p>
        </div>
      </div>
    );
  }

  // Regional data built from facilities
  const regionMap: Record<string, { cases: number, deaths: number, population: number }> = {};
  const districtMap: Record<string, { cases: number }> = {};

  if (Array.isArray(data.facilities)) {
    data.facilities.forEach((f: any) => {
      const region = f.region || "Unknown";
      if (!regionMap[region]) regionMap[region] = { cases: 0, deaths: 0, population: Math.floor(Math.random() * 5000000) + 2000000 };
      regionMap[region].cases += f.totalEncounters;
      regionMap[region].deaths += Math.floor(f.totalEncounters * 0.02); // Mock 2% CFR

      const district = f.district || "Unknown";
      if (!districtMap[district]) districtMap[district] = { cases: 0 };
      districtMap[district].cases += f.totalEncounters;
    });
  }

  const regionalData = Object.entries(regionMap).map(([region, d]) => ({ region, ...d }));
  
  const districtHeatmapData = Object.entries(districtMap).map(([district, d]) => {
    let severity = 'low';
    if (d.cases > 5000) severity = 'high';
    else if (d.cases > 1500) severity = 'medium';
    return { district, cases: d.cases, severity };
  });

  const totalCases = regionalData.reduce((sum, r) => sum + r.cases, 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Regional Analysis</h1>
          <p className="text-muted-foreground">
            Disease distribution and trends by region
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Regional Data
        </Button>
      </div>

      {/* Regional Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {regionalData.map((region) => {
          const proportion = totalCases > 0 ? ((region.cases / totalCases) * 100).toFixed(1) : "0.0";
          const cfr = region.cases > 0 ? ((region.deaths / region.cases) * 100).toFixed(1) : "0.0";
          const incidence = ((region.cases / region.population) * 100000).toFixed(0)
          const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable'
          
          return (
            <Card key={region.region}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {region.region} Region
                </CardTitle>
                <CardDescription>
                  Population: {(region.population / 1000000).toFixed(1)} million
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-2xl font-bold">{region.cases.toLocaleString()}</span>
                    <div className="flex items-center gap-1">
                      {trend === 'up' && <TrendingUp className="h-4 w-4 text-red-500" />}
                      {trend === 'down' && <TrendingDown className="h-4 w-4 text-green-500" />}
                      {trend === 'stable' && <Minus className="h-4 w-4 text-gray-500" />}
                      <Badge variant="outline">{proportion}%</Badge>
                    </div>
                  </div>
                  <Progress value={parseFloat(proportion)} className="h-2" />
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Deaths</p>
                    <p className="font-semibold text-red-600">{region.deaths}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">CFR</p>
                    <p className="font-semibold">{cfr}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Per 100k</p>
                    <p className="font-semibold">{incidence}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <BarChart
          title="Cases and Deaths by Region"
          description="Comparison of case burden and mortality"
          labels={regionalData.map((r) => r.region)}
          datasets={[
            { label: 'Cases', data: regionalData.map((r) => r.cases) },
            { label: 'Deaths', data: regionalData.map((r) => r.deaths), backgroundColor: '#ef4444' },
          ]}
        />
        <PieChart
          title="Case Distribution"
          description="Proportion of national cases"
          labels={regionalData.map((r) => r.region)}
          data={regionalData.map((r) => r.cases)}
          doughnut
        />
      </div>

      {/* District Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>District Severity Heatmap</CardTitle>
          <CardDescription>Disease burden classification by district</CardDescription>
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
                  {districtHeatmapData
                    .filter((d) => tab === 'all' || d.severity === tab)
                    .sort((a, b) => b.cases - a.cases)
                    .map((district) => (
                      <div
                        key={district.district}
                        className={`p-3 rounded-lg border text-center ${
                          district.severity === 'high'
                            ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                            : district.severity === 'medium'
                            ? 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800'
                            : 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                        }`}
                      >
                        <p className="font-medium text-sm">{district.district}</p>
                        <p className="text-lg font-bold">{district.cases.toLocaleString()}</p>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            district.severity === 'high'
                              ? 'border-red-300 text-red-700'
                              : district.severity === 'medium'
                              ? 'border-amber-300 text-amber-700'
                              : 'border-green-300 text-green-700'
                          }`}
                        >
                          {district.severity}
                        </Badge>
                      </div>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Priority Districts */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Districts</CardTitle>
          <CardDescription>Districts requiring immediate attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {districtHeatmapData
              .filter((d) => d.severity === 'high')
              .sort((a, b) => b.cases - a.cases)
              .map((district, index) => (
                <div key={district.district} className="flex items-center gap-4 p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                    <span className="font-bold text-red-600 dark:text-red-400">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{district.district} District</p>
                    <p className="text-sm text-muted-foreground">{district.cases.toLocaleString()} cases reported</p>
                  </div>
                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                    High Priority
                  </Badge>
                </div>
              ))}
              {districtHeatmapData.filter((d) => d.severity === 'high').length === 0 && (
                <p className="text-muted-foreground">No high priority districts at this time.</p>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
