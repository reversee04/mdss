export const diseaseColors: Record<string, string> = {
  "HIV/AIDS": "#ef4444",
  Malaria: "#f97316",
  Tuberculosis: "#3b82f6",
  Cholera: "#8b5cf6",
};

export type TrendSeries = Record<string, Array<{ date: string; count: number }>>;

export function getTrendSeries(trends: any): TrendSeries {
  if (!trends) return {};
  // If the API returns a pre-structured series object
  if (trends.series && typeof trends.series === "object") return trends.series;
  // If the API returns an object mapping diseases to arrays
  if (typeof trends === "object" && !Array.isArray(trends)) return trends;
  // Handle array format (e.g., mock data)
  if (Array.isArray(trends)) {
    const series: TrendSeries = {};
    trends.forEach((item: any) => {
      const { date } = item;
      Object.entries(item).forEach(([key, value]) => {
        if (key === "date" || key === "month") return;
        // Map key to disease name
        let disease = key;
        if (key === "hiv") disease = "HIV/AIDS";
        else if (key === "tb") disease = "Tuberculosis";
        else disease = key.charAt(0).toUpperCase() + key.slice(1);
        if (!series[disease]) series[disease] = [];
        series[disease].push({ date, count: Number(value) });
      });
    });
    return series;
  }
  return {};
}

export function getTrendSummary(trends: any): Record<string, any> {
  return trends?.summaryByDisease && typeof trends.summaryByDisease === "object"
    ? trends.summaryByDisease
    : {};
}

export function getAllTrendDates(series: TrendSeries) {
  const dates = new Set<string>();
  Object.values(series).forEach((points) => points.forEach((point) => dates.add(point.date)));
  return Array.from(dates).sort();
}

export function buildDiseaseDatasets(series: TrendSeries) {
  const dates = getAllTrendDates(series);

  return Object.entries(series).map(([disease, points]) => {
    const pointMap = new Map(points.map((point) => [point.date, point.count]));

    return {
      label: disease,
      data: dates.map((date) => pointMap.get(date) || 0),
      borderColor: diseaseColors[disease] || "#006cbf",
      backgroundColor: `${diseaseColors[disease] || "#006cbf"}20`,
    };
  });
}

export function formatTrendLabels(dates: string[]) {
  return dates.map((date) =>
    new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  );
}

export function combineTrendTotals(series: TrendSeries) {
  const totals = new Map<string, number>();

  Object.values(series).forEach((points) => {
    points.forEach((point) => totals.set(point.date, (totals.get(point.date) || 0) + point.count));
  });

  return Array.from(totals.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getOutcomeCount(outcomes: any[] = [], categories: string[]) {
  return outcomes.reduce((sum, outcome) => {
    const normalized = String(outcome.outcome || "unknown").toLowerCase();
    return sum + (categories.includes(normalized) ? outcome._count || 0 : 0);
  }, 0);
}

export function getMortalityRate(deaths: number, total: number) {
  return total > 0 ? `${((deaths / total) * 100).toFixed(1)}%` : "0.0%";
}

export function getTimestampLabel(timestamp?: string) {
  if (!timestamp) return "As of latest sync";
  return `As of ${new Date(timestamp).toLocaleString()}`;
}

export function formatFilterSummary(filters: Record<string, any>) {
  const active = Object.entries(filters)
    .filter(([, value]) => value && value !== "all")
    .map(([key, value]) => `${key}: ${value}`);

  return active.length > 0 ? active.join(" | ") : "All surveillance data";
}
