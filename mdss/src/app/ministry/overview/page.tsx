'use client'

import { useState, useEffect } from 'react'
import { StatCard } from '@/components/dashboard/stat-card'
import { LineChart, BarChart, PieChart } from '@/components/dashboard/charts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, TrendingUp, TrendingDown, Users, Building2, Activity, Loader2 } from 'lucide-react'

export default function NationalOverviewPage() {
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

  // Stats mapped from API
  const totalCases = data.encounters?.totalEncounters || 0;
  const activeFacilitiesCount = Array.isArray(data.facilities) ? data.facilities.length : 0;
  const recoveryRate = data.outcomes?.recoveryRate || "0%";

  // Trends mapped
  const trendsData = data.trends || [];
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
          <h1 className="text-3xl font-bold tracking-tight">National Statistics</h1>
          <p className="text-muted-foreground">
            Comprehensive national health statistics and trends
          </p>
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
          title="Total Population"
          value="17.5M"
          description="2024 estimate"
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
          value="2.7%"
          change="-0.3%"
          changeType="positive"
          description="improving trend"
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
                    TSR: {disease.tsr}%
                  </Badge>
                  <Badge variant="outline" className={disease.cfr > 5 ? 'bg-red-100 text-red-800' : ''}>
                    CFR: {disease.cfr}%
                  </Badge>
                </div>
              </div>
            ))}
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
            { label: 'Deaths', data: regionalData.map((r) => r.deaths), backgroundColor: '#ef4444' },
          ]}
        />
        <PieChart
          title="Regional Case Distribution"
          description="Percentage by region"
          labels={regionalData.map((r) => r.region)}
          data={regionalData.map((r) => r.cases)}
        />
      </div>

      {/* National Targets */}
      <Card>
        <CardHeader>
          <CardTitle>National Health Targets 2024</CardTitle>
          <CardDescription>Progress towards key health indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[
              { name: 'HIV Treatment Coverage', current: 85, target: 95, unit: '%' },
              { name: 'Malaria Incidence Reduction', current: 72, target: 90, unit: '%' },
              { name: 'TB Detection Rate', current: 68, target: 80, unit: '%' },
              { name: 'Facility Reporting Compliance', current: 95, target: 100, unit: '%' },
            ].map((target) => (
              <div key={target.name} className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">{target.name}</span>
                  <span className="text-sm">
                    <span className="font-semibold">{target.current}%</span>
                    <span className="text-muted-foreground"> / {target.target}%</span>
                  </span>
                </div>
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-primary rounded-full"
                    style={{ width: `${(target.current / target.target) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
