'use client'

import { useState, useEffect } from 'react'
import { StatCard } from '@/components/dashboard/stat-card'
import { BarChart, LineChart } from '@/components/dashboard/charts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  Download,
  FileText,
  MapPin,
  Calendar,
  Loader2
} from 'lucide-react'
import { combineTrendTotals, getMortalityRate, getOutcomeCount, getTimestampLabel, getTrendSeries } from '@/lib/surveillance-dashboard'

export default function MinistryDashboardPage() {
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
          throw new Error(dashboardRes.error || 'Failed to load dashboard data');
        }

        setData({ ...dashboardRes.data, timestamp: dashboardRes.timestamp });
      } catch (error) {
        console.error("Failed to fetch analytics data", error);
        setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
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
          <CardTitle>Unable to load national dashboard</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const activeAlerts = data.alerts?.active || [];
  const alertStatistics = data.alerts?.statistics || {};
  const monitoring = data.monitoring || {};

  // Stats mapped from API
  const totalCases = data.encounters?.totalEncounters || 0;
  
  const outcomesList = data.outcomes?.outcomes || [];
  const totalDeaths = getOutcomeCount(outcomesList, ['died', 'death', 'dead', 'deceased']);
  const recoveryRate = data.outcomes?.recoveryRate || "0%";

  const totalFacilities = Array.isArray(data.facilities) ? data.facilities.length : 0;
  const reportingFacilitiesCount = Array.isArray(data.facilities)
    ? data.facilities.filter((facility: any) => facility.totalEncounters > 0).length
    : 0;
  const facilityReportingRate = totalFacilities > 0 ? ((reportingFacilitiesCount / totalFacilities) * 100).toFixed(0) : "0";

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">National Health Overview</h1>
          <p className="text-muted-foreground">
            Executive summary of disease surveillance data
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{getTimestampLabel(data.timestamp)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Live Data
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      {activeAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-red-800 dark:text-red-200">
                {activeAlerts.length} Active Alert{activeAlerts.length > 1 ? 's' : ''} Requiring Attention
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                {activeAlerts[0].message}
              </p>
            </div>
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100" asChild>
              <a href="/alerts">View All Alerts</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Key National Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Cases (National)"
          value={totalCases}
          change="Live"
          changeType="neutral"
          description="based on all encounters"
          icon={Activity}
        />
        <StatCard
          title="Total Deaths"
          value={totalDeaths}
          change="Live"
          changeType="neutral"
          description="based on outcomes"
          icon={TrendingDown}
        />
        <StatCard
          title="Recovery Rate"
          value={recoveryRate}
          change="Live"
          changeType="positive"
          description="national average"
          icon={TrendingUp}
        />
        <StatCard
          title="Facilities Reporting"
          value={`${facilityReportingRate}%`}
          description={`${reportingFacilitiesCount} of ${totalFacilities}`}
          icon={Users}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monitoring Checks"
          value={monitoring.locationsChecked || 0}
          change={`${monitoring.enabledDiseases || 0} diseases`}
          changeType="neutral"
          description="national plus district checks"
          icon={Activity}
        />
        <StatCard
          title="Outbreak Alerts"
          value={monitoring.activeOutbreaks || 0}
          change={`${monitoring.activeWarnings || 0} warnings`}
          changeType={(monitoring.activeOutbreaks || 0) > 0 ? 'negative' : 'neutral'}
          description="active alert mix"
          icon={AlertTriangle}
        />
        <StatCard
          title="Affected Locations"
          value={monitoring.affectedLocations?.length || 0}
          change={`${alertStatistics.recent24h || 0} in 24h`}
          changeType="neutral"
          description="active alert locations"
          icon={MapPin}
        />
        <StatCard
          title="Response Time"
          value={`${alertStatistics.avgResponseTimeHours || 0}h`}
          change="Live"
          changeType="neutral"
          description="average acknowledgement"
          icon={Users}
        />
      </div>

      {totalCases === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No national surveillance encounters found</CardTitle>
            <CardDescription>
              The dashboard is connected to the database, but no focused-disease encounters are available yet.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Visual Insights */}
      <div className="grid gap-4 md:grid-cols-2">
        <LineChart
          title="National Disease Trends"
          description="Daily case trends across all diseases"
          labels={trendLabels}
          datasets={[
            { label: 'Total Cases', data: trendCounts },
          ]}
        />
        <BarChart
          title="Cases by Region"
          description="Ranked burden across regions"
          labels={regionalData.map((r) => r.region)}
          datasets={[{ label: 'Cases', data: regionalData.map((r) => r.cases) }]}
          horizontal
        />
      </div>

      {/* Regional Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Regional Overview
          </CardTitle>
          <CardDescription>Disease burden by region</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {regionalData.map((region) => {
              const proportion = totalCases > 0 ? ((region.cases / totalCases) * 100).toFixed(1) : "0.0"
              
              return (
                <div key={region.region} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-lg">{region.region} Region</h4>
                    <Badge variant="outline">{proportion}%</Badge>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Total Cases</span>
                        <span className="font-medium">{region.cases.toLocaleString()}</span>
                      </div>
                      <Progress value={(region.cases / (totalCases || 1)) * 100} className="h-2" />
                    </div>
                  </div>
                </div>
              )
            })}
            {regionalData.length === 0 && (
              <p className="text-sm text-muted-foreground">No regional case summaries are available yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Affected Locations</CardTitle>
          <CardDescription>Districts and national signals with active warning or outbreak alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left font-medium">Location</th>
                  <th className="p-3 text-left font-medium">Diseases</th>
                  <th className="p-3 text-center font-medium">Warnings</th>
                  <th className="p-3 text-center font-medium">Outbreaks</th>
                  <th className="p-3 text-center font-medium">Severity</th>
                </tr>
              </thead>
              <tbody>
                {(monitoring.affectedLocations || []).map((location: any) => (
                  <tr key={`${location.district || 'national'}-${location.region || 'all'}`} className="border-b">
                    <td className="p-3 font-medium">{location.location}</td>
                    <td className="p-3">{location.diseases.join(', ')}</td>
                    <td className="p-3 text-center">{location.warningAlerts}</td>
                    <td className="p-3 text-center">{location.outbreakAlerts}</td>
                    <td className="p-3 text-center">
                      <Badge variant={location.highestSeverity === 'critical' || location.highestSeverity === 'high' ? 'destructive' : 'outline'}>
                        {location.highestSeverity}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(monitoring.affectedLocations || []).length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">No active affected locations from outbreak monitoring.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Disease Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {diseaseStats.map((disease: any) => (
          <Card key={disease.disease}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{disease.disease}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{disease.cases.toLocaleString()}</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Recovery Rate</span>
                  <Badge
                    variant="outline"
                    className={
                      disease.recoveryRate >= 85
                        ? 'bg-green-100 text-green-800'
                        : disease.recoveryRate >= 75
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }
                  >
                    {disease.recoveryRate}%
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mortality Rate</span>
                  <span className="font-medium">{disease.mortalityRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {diseaseStats.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No disease totals</CardTitle>
              <CardDescription>No tracked disease cases are available yet.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Generate reports and access key documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
              <FileText className="h-6 w-6" />
              <span>Monthly Summary Report</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
              <Download className="h-6 w-6" />
              <span>Export Data (CSV)</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
              <FileText className="h-6 w-6" />
              <span>Policy Brief Template</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
