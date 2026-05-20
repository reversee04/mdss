'use client'

import { useState, useEffect } from 'react'
import { StatCard } from '@/components/dashboard/stat-card'
import { LineChart, PieChart } from '@/components/dashboard/charts'
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
import { alerts } from '@/lib/mock-data'

export default function MinistryDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          diseasesRes,
          encountersRes,
          outcomesRes,
          trendsRes,
          facilitiesRes
        ] = await Promise.all([
          fetch('/api/analytics/diseases').then(r => r.json()),
          fetch('/api/analytics/encounters').then(r => r.json()),
          fetch('/api/analytics/outcomes').then(r => r.json()),
          fetch('/api/analytics/trends').then(r => r.json()),
          fetch('/api/analytics/facilities').then(r => r.json())
        ]);

        setData({
          diseases: diseasesRes.data,
          encounters: encountersRes.data,
          outcomes: outcomesRes.data,
          trends: trendsRes.data,
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
          <p className="text-muted-foreground">Loading national data...</p>
        </div>
      </div>
    );
  }

  // Active alerts (keeping mock since no API)
  const activeAlerts = alerts.filter((a) => a.status === 'active');

  // Stats mapped from API
  const totalCases = data.encounters?.totalEncounters || 0;
  
  const outcomesList = data.outcomes?.outcomes || [];
  const getOutcomeCount = (name: string) => {
    const outcome = outcomesList.find((o: any) => o.outcome?.toLowerCase() === name.toLowerCase());
    return outcome ? outcome._count : 0;
  };
  const totalDeaths = getOutcomeCount('died') || getOutcomeCount('death');
  const recoveryRate = data.outcomes?.recoveryRate || "0%";

  const activeFacilitiesCount = Array.isArray(data.facilities) ? data.facilities.length : 0;
  const totalFacilities = 892; // Mock total to calculate reporting rate

  // Trends mapped
  const trendsObject = data.trends || {};
  const trendsData = Array.isArray(trendsObject) 
    ? trendsObject 
    : typeof trendsObject === 'object' 
      ? (() => {
          // Combine trends from all diseases
          const allTrends: Record<string, number> = {};
          Object.values(trendsObject).forEach((diseaseTrends: any) => {
            if (Array.isArray(diseaseTrends)) {
              diseaseTrends.forEach((t: any) => {
                allTrends[t.date] = (allTrends[t.date] || 0) + t.count;
              });
            }
          });
          return Object.entries(allTrends).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
        })()
      : [];
  const trendLabels = trendsData.map((t: any) => t.date);
  const trendCounts = trendsData.map((t: any) => t.count);

  // Regional data built from facilities
  const regionMap: Record<string, { cases: number, deaths: number, population: number }> = {};
  if (Array.isArray(data.facilities)) {
    data.facilities.forEach((f: any) => {
      const region = f.region || "Unknown";
      if (!regionMap[region]) regionMap[region] = { cases: 0, deaths: 0, population: Math.floor(Math.random() * 5000000) + 2000000 };
      regionMap[region].cases += f.totalEncounters;
      regionMap[region].deaths += Math.floor(f.totalEncounters * 0.02); // Mock 2% CFR
    });
  }
  const regionalData = Object.entries(regionMap).map(([region, d]) => ({ region, ...d }));

  // Disease Stats
  const topDiseases = data.diseases?.topDiseases || [];
  const diseaseStats = topDiseases.slice(0, 4).map((d: any) => ({
    disease: d.disease,
    cases: d.count,
    tsr: 85, // Mock TSR
    cfr: 2.1, // Mock CFR
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
                {activeAlerts[0].title} - {activeAlerts[0].description.slice(0, 80)}...
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
          value={`${((activeFacilitiesCount / totalFacilities) * 100).toFixed(0)}%`}
          description={`${activeFacilitiesCount} of ${totalFacilities}`}
          icon={Users}
        />
      </div>

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
        <PieChart
          title="Cases by Region"
          description="Distribution across regions"
          labels={regionalData.map((r) => r.region)}
          data={regionalData.map((r) => r.cases)}
          doughnut
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
              const cfrPercentage = region.cases > 0 ? ((region.deaths / region.cases) * 100).toFixed(1) : "0.0"
              const casesPerMillion = ((region.cases / region.population) * 1000000).toFixed(0)
              
              return (
                <div key={region.region} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-lg">{region.region} Region</h4>
                    <Badge variant="outline">{casesPerMillion}/M</Badge>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Total Cases</span>
                        <span className="font-medium">{region.cases.toLocaleString()}</span>
                      </div>
                      <Progress value={(region.cases / (totalCases || 1)) * 100} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Deaths</p>
                        <p className="font-semibold text-red-600">{region.deaths}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">CFR</p>
                        <p className="font-semibold">{cfrPercentage}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
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
                  <span className="text-muted-foreground">Treatment Success</span>
                  <Badge
                    variant="outline"
                    className={
                      disease.tsr >= 85
                        ? 'bg-green-100 text-green-800'
                        : disease.tsr >= 75
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }
                  >
                    {disease.tsr}%
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fatality Rate</span>
                  <span className="font-medium">{disease.cfr}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
