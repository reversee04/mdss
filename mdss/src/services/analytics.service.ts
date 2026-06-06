import { prisma } from "@/lib/prisma"; // adjust path if needed
import { subYears } from "date-fns";

export interface AnalyticsFilters {
  disease?: string;
  location?: string;
  region?: string;
  district?: string;
  facility?: string;
  startDate?: string;
  endDate?: string;
  timeRange?: string;
  interval?: string;
  sort?: string;
}

const FOCUS_DISEASE_NAMES = ['HIV/AIDS', 'Malaria', 'Tuberculosis', 'Cholera'];

interface DashboardAlert {
  alert_id: string;
  disease_id: string;
  alert_type: string;
  severity: string;
  district: string | null;
  region: string | null;
  current_cases: number;
  threshold_value: number;
  population: number;
  cases_per_100k: number;
  message: string;
  sent_at: Date;
  acknowledged: boolean;
  disease: { disease_name: string };
}

export interface SurveillanceDashboardData {
  trends: Awaited<ReturnType<typeof getTrendAnalysis>>;
  diseases: Awaited<ReturnType<typeof getDiseaseDistribution>>;
  outcomes: Awaited<ReturnType<typeof getOutcomeAnalytics>>;
  demographics: Awaited<ReturnType<typeof getPatientDemographics>>;
  encounters: Awaited<ReturnType<typeof getEncounterStats>>;
  facilities: Awaited<ReturnType<typeof getFacilityComparison>>;
  alerts: {
    active: DashboardAlert[];
    recent: DashboardAlert[];
    statistics: {
      total: number;
      active: number;
      acknowledged: number;
      recent24h: number;
      bySeverity: Record<"critical" | "high" | "medium" | "low", number>;
      byType: Record<"warning" | "outbreak", number>;
      avgResponseTimeHours: number;
    };
  };
  monitoring: {
    enabledDiseases: number;
    monitoredDiseases: Array<{
      diseaseId: string;
      diseaseName: string;
      warningThreshold: number;
      outbreakThreshold: number;
      cooldownHours: number;
      lastAlertSent: Date | null;
    }>;
    locationsChecked: number;
    districtLocations: number;
    activeWarnings: number;
    activeOutbreaks: number;
    affectedLocations: Array<{
      location: string;
      district: string | null;
      region: string | null;
      alertCount: number;
      highestSeverity: string;
      outbreakAlerts: number;
      warningAlerts: number;
      latestAlertAt: Date;
      diseases: string[];
    }>;
  };
  districtSummaries: Array<{
    district: string;
    region: string;
    cases: number;
    alerts: number;
    outbreakAlerts: number;
    warningAlerts: number;
    topDisease: string;
    diseases: Record<string, number>;
  }>;
}

export function buildEncounterFilter(allowedDiseaseIds: string[], filters?: AnalyticsFilters) {
  const where: any = {
    disease_id: { in: allowedDiseaseIds }
  };

  // Build facility filter conditions
  const facilityConditions: any = {};

  if (filters?.location && filters.location !== 'all') {
    facilityConditions.district = { equals: filters.location, mode: 'insensitive' };
  }
  if (filters?.district && filters.district !== 'all') {
    facilityConditions.district = { equals: filters.district, mode: 'insensitive' };
  }
  if (filters?.region && filters.region !== 'all') {
    facilityConditions.region = { equals: filters.region, mode: 'insensitive' };
  }

  // Only add facility filter if there are conditions
  if (Object.keys(facilityConditions).length > 0) {
    where.facility = facilityConditions;
  }
  if (filters?.facility && filters.facility !== 'all') {
    where.facility_id = filters.facility;
  }
  if (filters?.startDate || filters?.endDate) {
    where.date_of_diagnosis = {};
    if (filters.startDate) where.date_of_diagnosis.gte = new Date(filters.startDate);
    if (filters.endDate) where.date_of_diagnosis.lte = new Date(filters.endDate);
  }

  return where;
}

const outcomeCategory = (outcome?: string | null) => {
  const normalized = outcome?.trim().toLowerCase() || "unknown";

  if (["recovered", "recovery", "discharged recovered"].includes(normalized)) return "recovered";
  if (["dead", "death", "died", "deceased"].includes(normalized)) return "deaths";
  if (["ongoing", "active", "on treatment", "admitted", "in treatment"].includes(normalized)) return "ongoing";
  return "unknown";
};

const ageBandFor = (dateOfBirth: Date, referenceDate = new Date()) => {
  const age = referenceDate.getFullYear() - new Date(dateOfBirth).getFullYear();

  if (age <= 17) return "0-17";
  if (age <= 35) return "18-35";
  if (age <= 50) return "36-50";
  if (age <= 65) return "51-65";
  return "66+";
};

/**
 * Helper function: Dynamically fetch disease IDs from database
 * Looks up the 4 focused diseases by name
 */
async function getDynamicDiseaseIds(filters?: AnalyticsFilters): Promise<string[]> {
  const focusedDiseases = ['HIV/AIDS', 'Malaria', 'Tuberculosis', 'Cholera'];

  const whereClause: any = {};

  if (filters?.disease && filters.disease !== 'all') {
    // When a specific disease is selected, filter by disease_id
    whereClause.disease_id = filters.disease;
  } else {
    // Otherwise, use the focused diseases list
    whereClause.disease_name = {
      in: focusedDiseases,
    };
  }

  const diseases = await prisma.disease.findMany({
    where: whereClause,
    select: {
      disease_id: true,
      disease_name: true,
    },
  });

  return diseases.map((d) => d.disease_id);
}

/**
 * PATIENT DEMOGRAPHICS
 * Age distribution, gender breakdown, geographic distribution
 */
export async function getPatientDemographics(filters?: AnalyticsFilters) {
  const allowedDiseaseIds = await getDynamicDiseaseIds(filters);

  if (allowedDiseaseIds.length === 0) {
    return {
      ageDistribution: {},
      genderBreakdown: [],
      geographicDistribution: [],
    };
  }

  const encounterWhere = buildEncounterFilter(allowedDiseaseIds, filters);

  const patients = await prisma.patient.findMany({
    where: {
      encounters: {
        some: encounterWhere
      }
    },
    include: {
      encounters: {
        where: encounterWhere,
        include: {
          facility: true,
        },
      },
    },
  });

  const currentYear = new Date().getFullYear();

  // Age distribution
  const ageGroups = {
    "0-17": 0,
    "18-35": 0,
    "36-50": 0,
    "51-65": 0,
    "66+": 0,
  };

  patients.forEach((patient) => {
    const age = currentYear - new Date(patient.date_of_birth).getFullYear();

    if (age <= 17) ageGroups["0-17"]++;
    else if (age <= 35) ageGroups["18-35"]++;
    else if (age <= 50) ageGroups["36-50"]++;
    else if (age <= 65) ageGroups["51-65"]++;
    else ageGroups["66+"]++;
  });

  // Gender breakdown
  const genderBreakdown = await prisma.patient.groupBy({
    by: ["sex"],
    where: {
      encounters: {
        some: encounterWhere
      }
    },
    _count: {
      sex: true,
    },
  });

  const encounterRows = await prisma.encounter.findMany({
    where: encounterWhere,
    include: {
      disease: true,
      facility: true,
      patient: true,
    },
  });

  const districtMap: Record<string, { district: string; region: string; totalPatients: number; cases: number; diseases: Record<string, number> }> = {};
  const diseaseAgeDistribution: Record<string, Record<string, number>> = {};
  const diseaseSexDistribution: Record<string, Record<string, number>> = {};

  encounterRows.forEach((encounter) => {
    const district = encounter.facility.district || "Unknown";
    const region = encounter.facility.region || "Unknown";
    const disease = encounter.disease.disease_name || "Unknown";
    const ageBand = ageBandFor(encounter.patient.date_of_birth);
    const sex = encounter.patient.sex || "Unknown";

    if (!districtMap[district]) {
      districtMap[district] = { district, region, totalPatients: 0, cases: 0, diseases: {} };
    }
    districtMap[district].cases++;
    districtMap[district].totalPatients++;
    districtMap[district].diseases[disease] = (districtMap[district].diseases[disease] || 0) + 1;

    if (!diseaseAgeDistribution[disease]) diseaseAgeDistribution[disease] = {};
    diseaseAgeDistribution[disease][ageBand] = (diseaseAgeDistribution[disease][ageBand] || 0) + 1;

    if (!diseaseSexDistribution[disease]) diseaseSexDistribution[disease] = {};
    diseaseSexDistribution[disease][sex] = (diseaseSexDistribution[disease][sex] || 0) + 1;
  });

  return {
    ageDistribution: ageGroups,
    genderBreakdown,
    geographicDistribution: Object.values(districtMap).sort((a, b) => b.cases - a.cases),
    diseaseAgeDistribution,
    diseaseSexDistribution,
  };
}

/**
 * ENCOUNTER STATS
 * Number of encounters, encounter duration
 */
export async function getEncounterStats(filters?: AnalyticsFilters) {
  const allowedDiseaseIds = await getDynamicDiseaseIds(filters);

  if (allowedDiseaseIds.length === 0) {
    return {
      totalEncounters: 0,
      averageEncounterDuration: 0,
      encounterOutcomes: [],
    };
  }

  const encounterWhere = buildEncounterFilter(allowedDiseaseIds, filters);

  const totalEncounters = await prisma.encounter.count({
    where: encounterWhere
  });

  const encounters = await prisma.encounter.findMany({
    where: encounterWhere,
    select: {
      admission_date: true,
      discharge_date: true,
      outcome: true,
    },
  });

  // Duration analytics
  const durations = encounters
    .filter(
      (e) => e.admission_date && e.discharge_date
    )
    .map((e) => {
      const admission = new Date(e.admission_date!);
      const discharge = new Date(e.discharge_date!);

      const days =
        (discharge.getTime() - admission.getTime()) /
        (1000 * 60 * 60 * 24);

      return days;
    });

  const averageDuration =
    durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) /
      durations.length
      : 0;

  // Outcome counts
  const encounterOutcomes = await prisma.encounter.groupBy({
    by: ["outcome"],
    where: encounterWhere,
    _count: true,
  });

  return {
    totalEncounters,
    averageEncounterDuration: averageDuration,
    encounterOutcomes,
  };
}

/**
 * DISEASE DISTRIBUTION
 * Top diseases, regional prevalence, seasonal trends
 */
export async function getDiseaseDistribution(filters?: AnalyticsFilters) {
  const allowedDiseaseIds = await getDynamicDiseaseIds(filters);

  if (allowedDiseaseIds.length === 0) {
    return {
      topDiseases: [],
      regionalPrevalence: {},
      seasonalTrends: {},
    };
  }

  const encounterWhere = buildEncounterFilter(allowedDiseaseIds, filters);

  // Top diseases
  const diseaseCounts = await prisma.encounter.groupBy({
    by: ["disease_id"],
    where: encounterWhere,
    _count: true,
    orderBy: {
      _count: {
        disease_id: "desc",
      },
    },
    take: 10,
  });

  const diseases = await prisma.disease.findMany({
    where: {
      disease_id: { in: allowedDiseaseIds }
    }
  });

  const topDiseases = diseaseCounts.map((d) => ({
    disease:
      diseases.find(
        (x) => x.disease_id === d.disease_id
      )?.disease_name || "Unknown",
    count: d._count,
  }));

  // Regional disease prevalence
  const regionalPrevalence =
    await prisma.encounter.findMany({
      where: encounterWhere,
      include: {
        facility: true,
        disease: true,
      },
    });

  const regionMap: Record<
    string,
    Record<string, number>
  > = {};

  regionalPrevalence.forEach((encounter) => {
    const region = encounter.facility.region;
    const disease =
      encounter.disease.disease_name;

    if (!regionMap[region]) {
      regionMap[region] = {};
    }

    regionMap[region][disease] =
      (regionMap[region][disease] || 0) + 1;
  });

  // Seasonal trends (monthly)
  const seasonalTrends =
    await prisma.encounter.findMany({
      where: encounterWhere,
      select: {
        date_of_diagnosis: true,
        disease: {
          select: {
            disease_name: true,
          },
        },
      },
    });

  const monthlyTrends: Record<
    string,
    number
  > = {};

  seasonalTrends.forEach((entry) => {
    const month = new Date(
      entry.date_of_diagnosis
    ).toLocaleString("default", {
      month: "long",
    });

    monthlyTrends[month] =
      (monthlyTrends[month] || 0) + 1;
  });

  return {
    topDiseases,
    regionalPrevalence: regionMap,
    seasonalTrends: monthlyTrends,
  };
}

/**
 * OUTCOME ANALYTICS
 * Recovery rates, treatment effectiveness
 */
export async function getOutcomeAnalytics(filters?: AnalyticsFilters) {
  const allowedDiseaseIds = await getDynamicDiseaseIds(filters);

  console.log('[getOutcomeAnalytics] Allowed disease IDs:', allowedDiseaseIds);

  if (allowedDiseaseIds.length === 0) {
    return {
      recoveryRate: "0%",
      treatmentEffectiveness: {},
      outcomes: [],
      summaryByDisease: {},
    };
  }

  const encounterWhere = buildEncounterFilter(allowedDiseaseIds, filters);

  const outcomes =
    await prisma.encounter.groupBy({
      by: ["outcome"],
      where: encounterWhere,
      _count: true,
    });

  const total =
    outcomes.reduce(
      (sum, o) => sum + o._count,
      0
    ) || 1;

  const recoveredCount = outcomes.reduce(
    (sum, outcome) => sum + (outcomeCategory(outcome.outcome) === "recovered" ? outcome._count : 0),
    0
  );

  const treatmentRows = await prisma.treatmentRecord.findMany({
    where: { encounter: encounterWhere },
    include: {
      encounter: true,
      treatment: true,
    },
  });

  const treatmentSummaryMap: Record<string, { treatment: string; patients: number; recovered: number; deaths: number; ongoing: number; unknown: number; recoveryRate: number; mortalityRate: number }> = {};

  treatmentRows.forEach((row) => {
    const treatment = row.treatment.treatment_name;
    if (!treatmentSummaryMap[treatment]) {
      treatmentSummaryMap[treatment] = { treatment, patients: 0, recovered: 0, deaths: 0, ongoing: 0, unknown: 0, recoveryRate: 0, mortalityRate: 0 };
    }

    const category = outcomeCategory(row.encounter.outcome) as "recovered" | "deaths" | "ongoing" | "unknown";
    treatmentSummaryMap[treatment].patients++;
    treatmentSummaryMap[treatment][category]++;
  });

  Object.values(treatmentSummaryMap).forEach((summary) => {
    summary.recoveryRate = summary.patients > 0 ? Math.round((summary.recovered / summary.patients) * 100) : 0;
    summary.mortalityRate = summary.patients > 0 ? Math.round((summary.deaths / summary.patients) * 100) : 0;
  });

  // Get outcomes by disease
  const outcomesByDisease = await prisma.encounter.groupBy({
    by: ["disease_id", "outcome"],
    where: encounterWhere,
    _count: true,
  });

  // Get disease names
  const diseases = await prisma.disease.findMany({
    where: {
      disease_id: { in: allowedDiseaseIds }
    },
    select: {
      disease_id: true,
      disease_name: true,
    },
  });

  console.log('[getOutcomeAnalytics] Found diseases:', diseases);
  console.log('[getOutcomeAnalytics] Outcomes by disease:', outcomesByDisease);

  const diseaseMap = Object.fromEntries(
    diseases.map(d => [d.disease_id, d.disease_name])
  );

  // Build summary by disease
  const summaryByDisease: Record<string, any> = {};

  for (const disease of diseases) {
    const diseaseOutcomes = outcomesByDisease.filter(
      o => o.disease_id === disease.disease_id
    );

    const diseaseTotal = diseaseOutcomes.reduce(
      (sum, o) => sum + o._count,
      0
    );

    const diseaseRecovered = diseaseOutcomes.reduce(
      (sum, o) => sum + (outcomeCategory(o.outcome) === "recovered" ? o._count : 0),
      0
    );

    const diseaseDeaths = diseaseOutcomes.reduce(
      (sum, o) => sum + (outcomeCategory(o.outcome) === "deaths" ? o._count : 0),
      0
    );

    const diseaseOngoing = diseaseOutcomes.reduce(
      (sum, o) => sum + (outcomeCategory(o.outcome) === "ongoing" ? o._count : 0),
      0
    );

    const diseaseUnknown = diseaseOutcomes.reduce(
      (sum, o) => sum + (outcomeCategory(o.outcome) === "unknown" ? o._count : 0),
      0
    );

    summaryByDisease[disease.disease_name] = {
      total: diseaseTotal,
      recovered: diseaseRecovered,
      deaths: diseaseDeaths,
      ongoing: diseaseOngoing,
      unknown: diseaseUnknown,
      recoveryRate: diseaseTotal > 0
        ? Math.round((diseaseRecovered / diseaseTotal) * 100)
        : 0,
      mortalityRate: diseaseTotal > 0
        ? Math.round((diseaseDeaths / diseaseTotal) * 100)
        : 0,
    };
  }

  console.log('[getOutcomeAnalytics] Summary by disease:', summaryByDisease);

  return {
    recoveryRate:
      ((recoveredCount / total) * 100).toFixed(2) +
      "%",
    treatmentEffectiveness: Object.fromEntries(
      Object.values(treatmentSummaryMap).map((summary) => [summary.treatment, summary.recovered])
    ),
    treatmentSummary: Object.values(treatmentSummaryMap).sort((a, b) => b.patients - a.patients),
    outcomes,
    summaryByDisease,
  };
}

/**
 * TREND ANALYSIS (DISEASE-SPECIFIC)
 * Time-series data grouped by disease with distinct colors
 */
export async function getTrendAnalysis(filters?: AnalyticsFilters) {
  const allowedDiseaseIds = await getDynamicDiseaseIds(filters);

  if (allowedDiseaseIds.length === 0) {
    return {};
  }

  const encounterWhere = buildEncounterFilter(allowedDiseaseIds, filters);

  const encounters = await prisma.encounter.findMany({
    where: encounterWhere,
    select: {
      date_of_diagnosis: true,
      disease_id: true,
      disease: {
        select: {
          disease_name: true,
        },
      },
    },
    orderBy: {
      date_of_diagnosis: "asc",
    },
  });

  // Group trends by disease
  const trendsByDisease: Record<
    string,
    Array<{ date: string; count: number }>
  > = {};

  encounters.forEach((encounter) => {
    const diseaseName = encounter.disease.disease_name;
    const date = new Date(encounter.date_of_diagnosis)
      .toISOString()
      .split("T")[0];

    if (!trendsByDisease[diseaseName]) {
      trendsByDisease[diseaseName] = [];
    }

    const existingTrend = trendsByDisease[diseaseName].find(
      (t) => t.date === date
    );

    if (existingTrend) {
      existingTrend.count++;
    } else {
      trendsByDisease[diseaseName].push({ date, count: 1 });
    }
  });

  // Ensure all diseases have the same date range for alignment
  const allDates = new Set<string>();
  Object.values(trendsByDisease).forEach((trends) => {
    trends.forEach((t) => allDates.add(t.date));
  });

  const sortedDates = Array.from(allDates).sort();

  // Fill in missing dates with 0 count
  const normalizedTrends: Record<
    string,
    Array<{ date: string; count: number }>
  > = {};

  Object.entries(trendsByDisease).forEach(([disease, trends]) => {
    normalizedTrends[disease] = sortedDates.map((date) => {
      const existingTrend = trends.find((t) => t.date === date);
      return { date, count: existingTrend?.count || 0 };
    });
  });

  const summaryByDisease: Record<string, { total: number; peak: number; current7DayAvg: number; previous7DayAvg: number; changePercent: number; direction: "increasing" | "decreasing" | "stable"; anomalies: Array<{ date: string; count: number; threshold: number }> }> = {};

  Object.entries(normalizedTrends).forEach(([disease, trends]) => {
    const counts = trends.map((trend) => trend.count);
    const total = counts.reduce((sum, count) => sum + count, 0);
    const peak = counts.length > 0 ? Math.max(...counts) : 0;
    const currentWindow = counts.slice(-7);
    const previousWindow = counts.slice(-14, -7);
    const current7DayAvg = currentWindow.length > 0 ? currentWindow.reduce((sum, count) => sum + count, 0) / currentWindow.length : 0;
    const previous7DayAvg = previousWindow.length > 0 ? previousWindow.reduce((sum, count) => sum + count, 0) / previousWindow.length : 0;
    const changePercent = previous7DayAvg > 0
      ? Math.round(((current7DayAvg - previous7DayAvg) / previous7DayAvg) * 100)
      : current7DayAvg > 0 ? 100 : 0;
    const direction = changePercent > 5 ? "increasing" : changePercent < -5 ? "decreasing" : "stable";
    const mean = counts.length > 0 ? total / counts.length : 0;
    const variance = counts.length > 0 ? counts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / counts.length : 0;
    const threshold = Math.max(Math.ceil(mean + Math.sqrt(variance) * 2), 1);
    const anomalies = trends.filter((trend) => trend.count > threshold).map((trend) => ({ ...trend, threshold }));

    summaryByDisease[disease] = {
      total,
      peak,
      current7DayAvg: Math.round(current7DayAvg),
      previous7DayAvg: Math.round(previous7DayAvg),
      changePercent,
      direction,
      anomalies,
    };
  });

  return {
    series: normalizedTrends,
    summaryByDisease,
  };
}

/**
 * FACILITY COMPARISON
 * Compare performance metrics across facilities
 */
export async function getFacilityComparison(filters?: AnalyticsFilters) {
  const allowedDiseaseIds = await getDynamicDiseaseIds(filters);

  if (allowedDiseaseIds.length === 0) {
    return [];
  }

  const encounterWhere = buildEncounterFilter(allowedDiseaseIds, filters);

  const facilities =
    await prisma.facility.findMany({
      include: {
        encounters: {
          where: encounterWhere
        },
      },
    });

  const rows = facilities.map((facility) => {
    const encounterCount =
      facility.encounters.length;

    const successfulOutcomes =
      facility.encounters.filter(
        (e) =>
          e.outcome?.toLowerCase() ===
          "recovered"
      ).length;

    const recoveryRate =
      encounterCount > 0
        ? (
          (successfulOutcomes /
            encounterCount) *
          100
        ).toFixed(2)
        : "0";

    return {
      facilityId:
        facility.facility_id,
      facilityName: facility.name,
      district: facility.district,
      region: facility.region,
      totalEncounters:
        encounterCount,
      recoveryRate: `${recoveryRate}%`,
    };
  });

  if (filters?.sort === "recovery") {
    return rows.sort((a, b) => parseFloat(b.recoveryRate) - parseFloat(a.recoveryRate));
  }

  return rows.sort((a, b) => b.totalEncounters - a.totalEncounters);
}

function emptyAlertStatistics() {
  return {
    total: 0,
    active: 0,
    acknowledged: 0,
    recent24h: 0,
    bySeverity: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    },
    byType: {
      warning: 0,
      outbreak: 0,
    },
    avgResponseTimeHours: 0,
  };
}

function severityRank(severity: string) {
  return { low: 1, medium: 2, high: 3, critical: 4 }[severity] || 0;
}

async function getOutbreakAlertDashboardData(filters?: AnalyticsFilters) {
  const where: any = {};

  if (filters?.district && filters.district !== "all") {
    where.district = { equals: filters.district, mode: "insensitive" };
  }
  if (filters?.region && filters.region !== "all") {
    where.region = { equals: filters.region, mode: "insensitive" };
  }
  if (filters?.startDate || filters?.endDate) {
    where.sent_at = {};
    if (filters.startDate) where.sent_at.gte = new Date(filters.startDate);
    if (filters.endDate) where.sent_at.lte = new Date(filters.endDate);
  }

  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const [active, recent, total, acknowledged, severityCounts, typeCounts, recent24h, acknowledgedAlerts] = await Promise.all([
    prisma.outbreakAlert.findMany({
      where: { ...where, acknowledged: false },
      include: { disease: { select: { disease_name: true } } },
      orderBy: { sent_at: "desc" },
    }),
    prisma.outbreakAlert.findMany({
      where,
      include: { disease: { select: { disease_name: true } } },
      orderBy: { sent_at: "desc" },
      take: 10,
    }),
    prisma.outbreakAlert.count({ where }),
    prisma.outbreakAlert.count({ where: { ...where, acknowledged: true } }),
    prisma.outbreakAlert.groupBy({ by: ["severity"], where, _count: true }),
    prisma.outbreakAlert.groupBy({ by: ["alert_type"], where, _count: true }),
    prisma.outbreakAlert.count({ where: { ...where, sent_at: { gte: twentyFourHoursAgo } } }),
    prisma.outbreakAlert.findMany({
      where: { ...where, acknowledged: true, acknowledged_at: { not: null } },
      select: { sent_at: true, acknowledged_at: true },
    }),
  ]);

  const statistics = emptyAlertStatistics();
  statistics.total = total;
  statistics.active = active.length;
  statistics.acknowledged = acknowledged;
  statistics.recent24h = recent24h;

  severityCounts.forEach((item) => {
    if (item.severity in statistics.bySeverity) {
      statistics.bySeverity[item.severity as keyof typeof statistics.bySeverity] = item._count;
    }
  });

  typeCounts.forEach((item) => {
    if (item.alert_type in statistics.byType) {
      statistics.byType[item.alert_type as keyof typeof statistics.byType] = item._count;
    }
  });

  if (acknowledgedAlerts.length > 0) {
    const totalResponseMs = acknowledgedAlerts.reduce((sum, alert) => {
      return sum + ((alert.acknowledged_at?.getTime() || 0) - alert.sent_at.getTime());
    }, 0);
    statistics.avgResponseTimeHours = Number((totalResponseMs / acknowledgedAlerts.length / (1000 * 60 * 60)).toFixed(1));
  }

  const affectedLocationMap = new Map<string, {
    location: string;
    district: string | null;
    region: string | null;
    alertCount: number;
    highestSeverity: string;
    outbreakAlerts: number;
    warningAlerts: number;
    latestAlertAt: Date;
    diseases: Set<string>;
  }>();

  active.forEach((alert) => {
    const location = alert.district || alert.region || "National";
    const key = `${alert.district || "national"}:${alert.region || "national"}`;
    const current = affectedLocationMap.get(key) || {
      location,
      district: alert.district,
      region: alert.region,
      alertCount: 0,
      highestSeverity: alert.severity,
      outbreakAlerts: 0,
      warningAlerts: 0,
      latestAlertAt: alert.sent_at,
      diseases: new Set<string>(),
    };

    current.alertCount++;
    current.outbreakAlerts += alert.alert_type === "outbreak" ? 1 : 0;
    current.warningAlerts += alert.alert_type === "warning" ? 1 : 0;
    current.highestSeverity = severityRank(alert.severity) > severityRank(current.highestSeverity)
      ? alert.severity
      : current.highestSeverity;
    current.latestAlertAt = alert.sent_at > current.latestAlertAt ? alert.sent_at : current.latestAlertAt;
    current.diseases.add(alert.disease.disease_name);
    affectedLocationMap.set(key, current);
  });

  return {
    active,
    recent,
    statistics,
    activeWarnings: active.filter((alert) => alert.alert_type === "warning").length,
    activeOutbreaks: active.filter((alert) => alert.alert_type === "outbreak").length,
    affectedLocations: Array.from(affectedLocationMap.values())
      .map((location) => ({ ...location, diseases: Array.from(location.diseases).sort() }))
      .sort((a, b) => b.alertCount - a.alertCount || severityRank(b.highestSeverity) - severityRank(a.highestSeverity)),
  };
}

async function getMonitoringMetadata() {
  const [diseases, districts] = await Promise.all([
    prisma.disease.findMany({
      where: {
        disease_name: { in: FOCUS_DISEASE_NAMES },
        monitoring_enabled: true,
      },
      select: {
        disease_id: true,
        disease_name: true,
        warning_threshold: true,
        outbreak_threshold: true,
        alert_cooldown_hours: true,
        last_alert_sent: true,
      },
      orderBy: { disease_name: "asc" },
    }),
    prisma.facility.findMany({
      distinct: ["district"],
      select: { district: true },
    }),
  ]);

  return {
    enabledDiseases: diseases.length,
    monitoredDiseases: diseases.map((disease) => ({
      diseaseId: disease.disease_id,
      diseaseName: disease.disease_name,
      warningThreshold: disease.warning_threshold || 0,
      outbreakThreshold: disease.outbreak_threshold || 0,
      cooldownHours: disease.alert_cooldown_hours,
      lastAlertSent: disease.last_alert_sent,
    })),
    locationsChecked: diseases.length * (districts.length + 1),
    districtLocations: districts.length,
  };
}

function buildDistrictSummaries(
  demographics: Awaited<ReturnType<typeof getPatientDemographics>>,
  activeAlerts: DashboardAlert[]
) {
  const alertCounts = new Map<string, { alerts: number; outbreakAlerts: number; warningAlerts: number }>();

  activeAlerts.forEach((alert) => {
    if (!alert.district) return;
    const current = alertCounts.get(alert.district) || { alerts: 0, outbreakAlerts: 0, warningAlerts: 0 };
    current.alerts++;
    current.outbreakAlerts += alert.alert_type === "outbreak" ? 1 : 0;
    current.warningAlerts += alert.alert_type === "warning" ? 1 : 0;
    alertCounts.set(alert.district, current);
  });

  return (demographics.geographicDistribution || []).map((district) => {
    const diseases = district.diseases || {};
    const topDisease = Object.entries(diseases).sort((a, b) => b[1] - a[1])[0]?.[0] || "No cases";
    const counts = alertCounts.get(district.district) || { alerts: 0, outbreakAlerts: 0, warningAlerts: 0 };

    return {
      district: district.district,
      region: district.region,
      cases: district.cases,
      alerts: counts.alerts,
      outbreakAlerts: counts.outbreakAlerts,
      warningAlerts: counts.warningAlerts,
      topDisease,
      diseases,
    };
  }).sort((a, b) => b.alerts - a.alerts || b.cases - a.cases);
}

export async function getSurveillanceDashboardData(filters?: AnalyticsFilters): Promise<SurveillanceDashboardData> {
  const [
    trends,
    diseases,
    outcomes,
    demographics,
    encounters,
    facilities,
    alertData,
    monitoringMetadata,
  ] = await Promise.all([
    getTrendAnalysis(filters),
    getDiseaseDistribution(filters),
    getOutcomeAnalytics(filters),
    getPatientDemographics(filters),
    getEncounterStats(filters),
    getFacilityComparison(filters),
    getOutbreakAlertDashboardData(filters),
    getMonitoringMetadata(),
  ]);

  return {
    trends,
    diseases,
    outcomes,
    demographics,
    encounters,
    facilities,
    alerts: {
      active: alertData.active,
      recent: alertData.recent,
      statistics: alertData.statistics,
    },
    monitoring: {
      ...monitoringMetadata,
      activeWarnings: alertData.activeWarnings,
      activeOutbreaks: alertData.activeOutbreaks,
      affectedLocations: alertData.affectedLocations,
    },
    districtSummaries: buildDistrictSummaries(demographics, alertData.active),
  };
}

/**
 * PATIENT RECORDS
 * Fetch patient records with encounters, facilities, and treatment history
 */
export async function getPatientRecords(filters?: AnalyticsFilters) {
  const allowedDiseaseIds = await getDynamicDiseaseIds(filters);

  if (allowedDiseaseIds.length === 0) {
    return [];
  }

  const encounterWhere = buildEncounterFilter(allowedDiseaseIds, filters);

  const patients = await prisma.patient.findMany({
    where: {
      encounters: {
        some: encounterWhere
      }
    },
    include: {
      encounters: {
        where: encounterWhere,
        include: {
          facility: true,
          disease: true,
          treatment_records: {
            include: {
              treatment: true,
            },
          },
        },
      },
    },
  });

  const currentYear = new Date().getFullYear();

  return patients.map((patient) => {
    // Get the most recent encounter for the patient
    const latestEncounter = patient.encounters.sort(
      (a, b) =>
        new Date(b.date_of_diagnosis).getTime() -
        new Date(a.date_of_diagnosis).getTime()
    )[0];

    if (!latestEncounter) {
      return null;
    }

    // Calculate age
    const age = currentYear - new Date(patient.date_of_birth).getFullYear();

    // Determine status based on outcome
    const outcome = latestEncounter.outcome?.toLowerCase();
    let status = 'On Treatment';
    if (outcome === 'recovered') {
      status = 'Recovered';
    } else if (outcome === 'death' || outcome === 'deceased') {
      status = 'Deceased';
    } else if (latestEncounter.admission_date && !latestEncounter.discharge_date) {
      status = 'Admitted';
    } else if (outcome === 'treatment failure') {
      status = 'Treatment Failure';
    }

    // Build events timeline from treatment records and encounter dates
    const events: Array<{
      date: string;
      type: string;
      description: string;
    }> = [];

    // Add diagnosis event
    events.push({
      date: latestEncounter.date_of_diagnosis.toISOString().split('T')[0],
      type: 'Diagnosis',
      description: `Initial ${latestEncounter.disease.disease_name} diagnosis`,
    });

    // Add admission event if applicable
    if (latestEncounter.admission_date) {
      events.push({
        date: latestEncounter.admission_date.toISOString().split('T')[0],
        type: 'Admission',
        description: 'Admitted to facility',
      });
    }

    // Add treatment events from treatment records
    latestEncounter.treatment_records.forEach((record) => {
      events.push({
        date: record.start_date.toISOString().split('T')[0],
        type: 'Treatment Start',
        description: `Started ${record.treatment.treatment_name}`,
      });

      if (record.end_date) {
        events.push({
          date: record.end_date.toISOString().split('T')[0],
          type: 'Treatment',
          description: `Completed ${record.treatment.treatment_name}`,
        });
      }

      if (record.effectiveness_notes) {
        events.push({
          date: record.start_date.toISOString().split('T')[0],
          type: 'Follow-up',
          description: record.effectiveness_notes,
        });
      }
    });

    // Add discharge event if applicable
    if (latestEncounter.discharge_date) {
      events.push({
        date: latestEncounter.discharge_date.toISOString().split('T')[0],
        type: 'Discharge',
        description: `Discharged - ${latestEncounter.outcome || 'Unknown outcome'}`,
      });
    }

    // Sort events by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Simple anomaly detection logic
    const anomaly = status === 'Treatment Failure' ||
      (latestEncounter.treatment_records.length > 3) ||
      (age > 60 && latestEncounter.disease.disease_name === 'HIV/AIDS');

    let anomalyReason = '';
    if (anomaly) {
      if (status === 'Treatment Failure') {
        anomalyReason = 'Treatment failure - consider resistance testing';
      } else if (latestEncounter.treatment_records.length > 3) {
        anomalyReason = 'Multiple treatment regimens - review treatment plan';
      } else if (age > 60 && latestEncounter.disease.disease_name === 'HIV/AIDS') {
        anomalyReason = 'Late-stage diagnosis in elderly patient';
      }
    }

    return {
      id: patient.patient_id,
      age,
      sex: patient.sex,
      district: latestEncounter.facility.district,
      facility: latestEncounter.facility.name,
      disease: latestEncounter.disease.disease_name,
      diagnosisDate: latestEncounter.date_of_diagnosis.toISOString().split('T')[0],
      status,
      events,
      anomaly,
      anomalyReason: anomalyReason || undefined,
    };
  }).filter((patient): patient is NonNullable<typeof patient> => patient !== null);
}
