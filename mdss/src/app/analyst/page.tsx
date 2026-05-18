'use client'

import { useEffect, useState } from 'react'
import { StatCard } from '@/components/dashboard/stat-card'
import { LineChart, BarChart, PieChart } from '@/components/dashboard/charts'
import { FilterPanel } from '@/components/dashboard/filter-panel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  Heart,
  Skull,
  Stethoscope,
  Loader2
} from 'lucide-react'

export default function AnalystDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          demographicsRes,
          diseasesRes,
          encountersRes,
          outcomesRes,
          trendsRes
        ] = await Promise.all([
          fetch('/api/analytics/demographics').then(r => r.json()),
          fetch('/api/analytics/diseases').then(r => r.json()),
          fetch('/api/analytics/encounters').then(r => r.json()),
          fetch('/api/analytics/outcomes').then(r => r.json()),
          fetch('/api/analytics/trends').then(r => r.json())
        ]);

        setData({
          demographics: demographicsRes.data,
          diseases: diseasesRes.data,
          encounters: encountersRes.data,
          outcomes: outcomesRes.data,
          trends: trendsRes.data,
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
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  // Map API data to overview stats
  const totalCases = data.encounters?.totalEncounters || 0;
  const outcomesCount = data.outcomes?.outcomes || [];
  
  const getOutcomeCount = (name: string) => {
    const outcome = outcomesCount.find((o: any) => o.outcome?.toLowerCase() === name.toLowerCase());
    return outcome ? outcome._count : 0;
  };
  
  const totalRecoveries = getOutcomeCount('recovered');
  const totalDeaths = getOutcomeCount('died') || getOutcomeCount('death');
  const activeCases = totalCases - totalRecoveries - totalDeaths;

  const overviewStats = {
    totalCases,
    activeCases: Math.max(0, activeCases),
    totalRecoveries,
    totalDeaths,
  };

  // Map API data for diseases
  const topDiseases = data.diseases?.topDiseases || [];
  
  // Map API data for trends
  const trendsData = data.trends || [];
  const trendLabels = trendsData.map((t: any) => t.date);
  const trendCounts = trendsData.map((t: any) => t.count);

  // Map API data for demographics
  const ageDist = data.demographics?.ageDistribution || {};
  const ageLabels = Object.keys(ageDist);
  const ageData = Object.values(ageDist) as number[];

  const genderDist = data.demographics?.genderBreakdown || [];
  const genderLabels = genderDist.map((g: any) => g.sex || 'Unknown');
  const genderData = genderDist.map((g: any) => g._count.sex);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Disease Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive disease surveillance data and trend analysis
          </p>
        </div>
        <Badge variant="outline" className="w-fit bg-blue-100 text-blue-800 border-blue-300">
          LIVE DATA
        </Badge>
      </div>

      {/* Filters */}
      <FilterPanel
        showDisease={true}
        showLocation={true}
        showTimeRange={true}
        showFacility={false}
      />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Cases"
          value={overviewStats.totalCases}
          change="Live"
          changeType="neutral"
          description="All recorded cases"
          icon={Activity}
        />
        <StatCard
          title="Active Cases"
          value={overviewStats.activeCases}
          change="Live"
          changeType="neutral"
          description="Currently active"
          icon={Stethoscope}
        />
        <StatCard
          title="Recoveries"
          value={overviewStats.totalRecoveries}
          change="Live"
          changeType="positive"
          description="Total recovered"
          icon={Heart}
        />
        <StatCard
          title="Deaths"
          value={overviewStats.totalDeaths}
          change="Live"
          changeType="negative"
          description="Total deaths"
          icon={Skull}
        />
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Disease Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <LineChart
              title="Disease Cases Over Time"
              description="Daily case counts"
              labels={trendLabels}
              datasets={[
                { label: 'Total Cases', data: trendCounts },
              ]}
            />
            <BarChart
              title="Cases by Disease Type"
              description="Total cases for current period"
              labels={topDiseases.map((d: any) => d.disease)}
              datasets={[
                {
                  label: 'Cases',
                  data: topDiseases.map((d: any) => d.count),
                },
              ]}
            />
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <PieChart
              title="Cases by Disease"
              description="Proportion of total cases"
              labels={topDiseases.map((d: any) => d.disease)}
              data={topDiseases.map((d: any) => d.count)}
            />
            <PieChart
              title="Outcomes Distribution"
              description="Recovery vs deaths vs active"
              labels={['Recovered', 'Active Cases', 'Deaths']}
              data={[overviewStats.totalRecoveries, overviewStats.activeCases, overviewStats.totalDeaths]}
              doughnut
            />
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <BarChart
              title="Cases by Age Group"
              description="Distribution across age groups"
              labels={ageLabels}
              datasets={[
                {
                  label: 'Cases',
                  data: ageData,
                },
              ]}
            />
            <PieChart
              title="Cases by Sex"
              description="Male vs Female distribution"
              labels={genderLabels}
              data={genderData}
              doughnut
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Disease Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Disease Statistics Summary</CardTitle>
          <CardDescription>Key metrics by disease (based on available data)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium p-3">Disease</th>
                  <th className="text-right font-medium p-3">Cases</th>
                  <th className="text-right font-medium p-3">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {topDiseases.map((disease: any) => (
                  <tr key={disease.disease} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">{disease.disease}</td>
                    <td className="p-3 text-right">{disease.count.toLocaleString()}</td>
                    <td className="p-3 text-right">
                      {totalCases > 0 ? ((disease.count / totalCases) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
                {topDiseases.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-3 text-center text-muted-foreground">
                      No disease data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
