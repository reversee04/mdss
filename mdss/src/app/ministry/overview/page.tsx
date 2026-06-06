'use client'

import { useState, useEffect } from 'react'
import { StatCard } from '@/components/dashboard/stat-card'
import { LineChart, BarChart } from '@/components/dashboard/charts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, TrendingUp, TrendingDown, Users, Building2, Activity, Loader2 } from 'lucide-react'
import { combineTrendTotals, getMortalityRate, getOutcomeCount, getTimestampLabel, getTrendSeries } from '@/lib/surveillance-dashboard'

export default function NationalOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const response = await fetch('/api/analytics/surveillance-dashboard');
        const dashboardRes = await response.json();

        if (!response.ok || !dashboardRes.success) {
          throw new Error(dashboardRes.error || 'Failed to load national overview data');
        }

        setData({ ...dashboardRes.data, timestamp: dashboardRes.timestamp });
      } catch (error) {
        console.error("Failed to fetch analytics data", error);
        setError(error instanceof Error ? error.message : 'Failed to load national overview data');
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
          <p className="text-muted-foreground">Loading national data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
        <CardHeader>
          <CardTitle>Unable to load national statistics</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Stats mapped from API
  const totalCases = data.encounters?.totalEncounters || 0;
  const activeFacilitiesCount = Array.isArray(data.facilities) ? data.facilities.length : 0;
  const recoveryRate = data.outcomes?.recoveryRate || "0%";
  const outcomesList = data.outcomes?.outcomes || [];
  const deaths = getOutcomeCount(outcomesList, ['died', 'death', 'dead', 'deceased']);

  // Trends mapped
  const trendsData = combineTrendTotals(getTrendSeries(data.trends));

  const trendLabels = trendsData.map((t: any) => t.date);
  const trendCounts = trendsData.map((t: any) => t.count);

  const regionMap: Record<string, { cases: number }> = {};
  (data.demographics?.geographicDistribution || []).forEach((district: any) => {
    const region = district.region || "Unknown";
    if (!regionMap[region]) regionMap[region] = { cases: 0 };
    regionMap[region].cases += district.cases || district.totalPatients || 0;
  });
  const regionalData = Object.entries(regionMap).map(([region, d]) => ({ region, ...d })).sort((a, b) => b.cases - a.cases);

  // Disease Stats
  const topDiseases = data.diseases?.topDiseases || [];
  const diseaseStats = topDiseases.slice(0, 4).map((d: any) => ({
    disease: d.disease,
    cases: d.count,
    recoveryRate: data.outcomes?.summaryByDisease?.[d.disease]?.recoveryRate || 0,
    mortalityRate: data.outcomes?.summaryByDisease?.[d.disease]?.mortalityRate || 0,
  }));
  const monitoring = data.monitoring || {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">National Statistics</h1>
          <p className="text-muted-foreground">
            Comprehensive national health statistics and trends
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{getTimestampLabel(data.timestamp)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Districts Monitored"
          value={monitoring.districtLocations || 0}
          description={`${monitoring.enabledDiseases || 0} enabled diseases`}
          icon={Users}
        />
        <StatCard
          title="Health Facilities"
          value={activeFacilitiesCount}
          description="nationwide"
          icon={Building2}
        />
        <StatCard
          title="Total Cases (YTD)"
          value={totalCases}
          change="Live"
          changeType="neutral"
          description="vs last year"
          icon={Activity}
        />
        <StatCard
          title="National CFR"
          value={getMortalityRate(deaths, totalCases)}
          change={`${deaths.toLocaleString()} deaths`}
          changeType="negative"
          description="tracked case outcomes"
          icon={TrendingDown}
        />
        <StatCard
          title="Recovery Rate"
          value={recoveryRate}
          change="Live"
          changeType="positive"
          description="vs last year"
          icon={TrendingUp}
        />
      </div>

      {/* Disease Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Disease Overview</CardTitle>
          <CardDescription>Summary statistics for tracked diseases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            {diseaseStats.map((disease: any) => (
              <div key={disease.disease} className="text-center p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2">{disease.disease}</h4>
                <p className="text-3xl font-bold mb-1">{disease.cases.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mb-2">total cases</p>
                <div className="flex justify-center gap-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    Recovery: {disease.recoveryRate}%
                  </Badge>
                  <Badge variant="outline" className={disease.mortalityRate > 5 ? 'bg-red-100 text-red-800' : ''}>
                    Mortality: {disease.mortalityRate}%
                  </Badge>
                </div>
              </div>
            ))}
            {diseaseStats.length === 0 && (
              <p className="text-center text-sm text-muted-foreground md:col-span-4">No tracked disease cases are available yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trend Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <LineChart
          title="Annual Disease Trends"
          description="Cases over the tracked period"
          labels={trendLabels}
          datasets={[
            { label: 'Total Cases', data: trendCounts },
          ]}
        />
        <BarChart
          title="Cases by Disease"
          description="Current period totals"
          labels={topDiseases.map((d: any) => d.disease)}
          datasets={[
            { label: 'Cases', data: topDiseases.map((d: any) => d.count) },
          ]}
        />
      </div>

      {/* Regional Comparison */}
      <div className="grid gap-4 md:grid-cols-2">
        <BarChart
          title="Cases by Region"
          description="Regional distribution"
          labels={regionalData.map((r) => r.region)}
          datasets={[
            { label: 'Cases', data: regionalData.map((r) => r.cases) },
          ]}
        />
        <BarChart
          title="Regional Case Distribution"
          description="Ranked regional burden"
          labels={regionalData.map((r) => r.region)}
          datasets={[{ label: 'Cases', data: regionalData.map((r) => r.cases) }]}
          horizontal
        />
      </div>

      {/* Monitoring Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoring Thresholds</CardTitle>
          <CardDescription>Configured warning and outbreak rates for enabled diseases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {(monitoring.monitoredDiseases || []).map((disease: any) => {
              const warning = disease.warningThreshold || 0;
              const outbreak = disease.outbreakThreshold || 0;
              const value = outbreak > 0 ? (warning / outbreak) * 100 : 0;

              return (
                <div key={disease.diseaseId} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{disease.diseaseName}</span>
                    <span className="text-sm">
                      <span className="font-semibold">{warning}</span>
                      <span className="text-muted-foreground"> / {outbreak} cases per 100k</span>
                    </span>
                  </div>
                  <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="absolute h-full bg-primary rounded-full"
                      style={{ width: `${Math.min(value, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {(monitoring.monitoredDiseases || []).length === 0 && (
              <p className="text-sm text-muted-foreground">No disease monitoring thresholds are enabled yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
