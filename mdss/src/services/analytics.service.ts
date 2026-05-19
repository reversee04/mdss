import { prisma } from "@/lib/prisma"; // adjust path if needed
import { subYears } from "date-fns";

export interface AnalyticsFilters {
  disease?: string;
  location?: string;
  facility?: string;
  startDate?: string;
  endDate?: string;
  timeRange?: string;
}

export function buildEncounterFilter(allowedDiseaseIds: string[], filters?: AnalyticsFilters) {
  const where: any = {
    disease_id: { in: allowedDiseaseIds }
  };

  if (filters?.location && filters.location !== 'all') {
    where.facility = { district: { equals: filters.location, mode: 'insensitive' } };
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

/**
 * Helper function: Dynamically fetch disease IDs from database
 * Looks up the 4 focused diseases by name
 */
async function getDynamicDiseaseIds(filters?: AnalyticsFilters): Promise<string[]> {
  const focusedDiseases = ['HIV/AIDS', 'Malaria', 'Tuberculosis', 'Cholera'];
  
  const whereClause: any = {
    disease_name: {
      in: focusedDiseases,
    },
  };

  if (filters?.disease && filters.disease !== 'all') {
    whereClause.disease_id = filters.disease;
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
    const age =
      currentYear -
      new Date(patient.date_of_birth).getFullYear();

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

  // Geographic distribution (by district)
  const geographicDistribution = await prisma.encounter.groupBy({
    by: ["facility_id"],
    where: encounterWhere,
    _count: true,
  });

  const facilities = await prisma.facility.findMany();

  const geoMap = geographicDistribution.map((item) => {
    const facility = facilities.find(
      (f) => f.facility_id === item.facility_id
    );

    return {
      district: facility?.district,
      region: facility?.region,
      totalPatients: item._count,
    };
  });

  return {
    ageDistribution: ageGroups,
    genderBreakdown,
    geographicDistribution: geoMap,
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

  const recoveryRate =
    outcomes.find(
      (o) =>
        o.outcome?.toLowerCase() ===
        "recovered"
    )?._count || 0;

  // Treatment effectiveness
  const treatments =
    await prisma.treatmentRecord.findMany({
      where: {
        encounter: encounterWhere
      },
      include: {
        treatment: true,
      },
    });

  const effectivenessMap: Record<
    string,
    number
  > = {};

  treatments.forEach((t) => {
    if (
      t.effectiveness_notes
        ?.toLowerCase()
        .includes("effective")
    ) {
      effectivenessMap[
        t.treatment.treatment_name
      ] =
        (effectivenessMap[
          t.treatment.treatment_name
        ] || 0) + 1;
    }
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

    const diseaseRecovered = diseaseOutcomes.find(
      o => o.outcome?.toLowerCase() === 'recovered'
    )?._count || 0;

    const diseaseDeaths = diseaseOutcomes.find(
      o => o.outcome?.toLowerCase() === 'dead' || o.outcome?.toLowerCase() === 'died'
    )?._count || 0;

    summaryByDisease[disease.disease_name] = {
      total: diseaseTotal,
      recovered: diseaseRecovered,
      deaths: diseaseDeaths,
      recoveryRate: diseaseTotal > 0 
        ? Math.round((diseaseRecovered / diseaseTotal) * 100)
        : 0,
    };
  }

  console.log('[getOutcomeAnalytics] Summary by disease:', summaryByDisease);

  return {
    recoveryRate:
      ((recoveryRate / total) * 100).toFixed(2) +
      "%",
    treatmentEffectiveness:
      effectivenessMap,
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

  return normalizedTrends;
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

  return facilities.map((facility) => {
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