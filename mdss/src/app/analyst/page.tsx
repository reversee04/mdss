'use client'

import { useEffect, useState } from 'react'
import { StatCard } from '@/components/dashboard/stat-card'
import { LineChart, BarChart } from '@/components/dashboard/charts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Activity, TrendingUp, Loader2 } from 'lucide-react'

export default function AnalystDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendsRes, diseasesRes, outcomesRes] = await Promise.all([
          fetch('/api/analytics/trends').then(r => r.json()),
          fetch('/api/analytics/diseases').then(r => r.json()),
          fetch('/api/analytics/outcomes').then(r => r.json()),
        ]);

        setData({
          trends: trendsRes.data,
          diseases: diseasesRes.data,
          outcomes: outcomesRes.data,
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

  // DISEASE-SPECIFIC TRENDS
  const trendsData = Array.isArray(data.trends) ? data.trends : [];
  const diseaseTrendLabels = trendsData.map((d: any) => {
    const date = new Date(d.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  
  const trendDatasets = [{
    label: 'Combined Cases',
    data: trendsData.map((d: any) => d.count),
  }];

  // TOP DISEASES BAR CHART
  const topDiseases = data.diseases?.topDiseases || [];
  const diseaseLabels = topDiseases.map((d: any) => d.disease);
  const diseaseCounts = topDiseases.map((d: any) => d.count);

  // OUTCOMES BY DISEASE
  const outcomesSummary = data.outcomes?.summaryByDisease || {};
  console.log('Outcomes data:', data.outcomes);
  console.log('Outcomes summary:', outcomesSummary);
  const totalCases = Object.values(outcomesSummary).reduce(
    (sum: number, o: any) => sum + o.total,
    0
  );
  const totalRecovered = Object.values(outcomesSummary).reduce(
    (sum: number, o: any) => sum + o.recovered,
    0
  );
  const totalDeaths = Object.values(outcomesSummary).reduce(
    (sum: number, o: any) => sum + o.deaths,
    0
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Disease Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive disease surveillance data by disease type
          </p>
        </div>
        <Badge variant="outline" className="w-fit bg-blue-100 text-blue-800 border-blue-300">
          LIVE DATA
        </Badge>
      </div>

      {/* Key Metrics - Individual Disease Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(outcomesSummary).map(([disease, summary]: [string, any]) => (
          <StatCard
            key={disease}
            title={disease}
            value={summary.total}
            change={summary.recoveryRate ? `${summary.recoveryRate}% recovery` : "0% recovery"}
            changeType={summary.recoveryRate > 50 ? "positive" : "negative"}
            description={`Deaths: ${summary.deaths}`}
            icon={Activity}
          />
        ))}
      </div>

      {/* Disease-Specific Analytics */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends by Disease</TabsTrigger>
          <TabsTrigger value="comparison">Disease Comparison</TabsTrigger>
          <TabsTrigger value="outcomes">Outcomes by Disease</TabsTrigger>
        </TabsList>

        {/* TRENDS - Each Disease as Separate Line */}
        <TabsContent value="trends" className="space-y-4">
          <LineChart
            title="Case Trends by Disease"
            description="Daily case counts for each disease (different colors)"
            labels={diseaseTrendLabels}
            datasets={trendDatasets}
          />
        </TabsContent>

        {/* DISEASE COMPARISON */}
        <TabsContent value="comparison" className="space-y-4">
          <BarChart
            title="Total Cases by Disease"
            description="Each disease shown with distinct color"
            labels={diseaseLabels}
            datasets={[
              {
                label: 'Cases',
                data: diseaseCounts,
              },
            ]}
          />
        </TabsContent>

        {/* OUTCOMES BY DISEASE */}
        <TabsContent value="outcomes" className="space-y-4">
          {Object.keys(outcomesSummary).length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center py-8">No outcome data available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(outcomesSummary).map(([disease, summary]: [string, any]) => (
                <Card key={disease}>
                  <CardHeader>
                    <CardTitle className="text-lg">{disease}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Cases</p>
                        <p className="text-2xl font-bold">{summary.total || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Recovery Rate</p>
                        <p className="text-2xl font-bold text-green-600">{summary.recoveryRate || 0}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Recovered</p>
                        <p className="text-lg font-semibold">{summary.recovered || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Deaths</p>
                        <p className="text-lg font-semibold text-red-600">{summary.deaths || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
