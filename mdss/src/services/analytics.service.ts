import { prisma } from "@/lib/prisma"; // adjust path if needed
import { subYears } from "date-fns";

/**
 * Helper function: Dynamically fetch disease IDs from database
 * Looks up the 4 focused diseases by name
 */
async function getDynamicDiseaseIds(): Promise<string[]> {
  const focusedDiseases = ['HIV/AIDS', 'Malaria', 'Tuberculosis', 'Cholera'];
  
  const diseases = await prisma.disease.findMany({
    where: {
      disease_name: {
        in: focusedDiseases,
      },
    },
    select: {
      disease_id: true,
    },
  });

  return diseases.map((d) => d.disease_id);
}

/**
 * PATIENT DEMOGRAPHICS
 * Age distribution, gender breakdown, geographic distribution
 */
export async function getPatientDemographics() {
  const allowedDiseaseIds = await getDynamicDiseaseIds();
  
  if (allowedDiseaseIds.length === 0) {
    return {
      ageDistribution: {},
      genderBreakdown: [],
      geographicDistribution: [],
    };
  }

  const patients = await prisma.patient.findMany({
    where: {
      encounters: {
        some: {
          disease_id: { in: allowedDiseaseIds }
        }
      }
    },
    include: {
      encounters: {
        where: {
          disease_id: { in: allowedDiseaseIds }
        },
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
        some: {
          disease_id: { in: allowedDiseaseIds }
        }
      }
    },
    _count: {
      sex: true,
    },
  });

  // Geographic distribution (by district)
  const geographicDistribution = await prisma.encounter.groupBy({
    by: ["facility_id"],
    where: {
      disease_id: { in: allowedDiseaseIds }
    },
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
export async function getEncounterStats() {
  const allowedDiseaseIds = await getDynamicDiseaseIds();
  
  if (allowedDiseaseIds.length === 0) {
    return {
      totalEncounters: 0,
      averageEncounterDuration: 0,
      encounterOutcomes: [],
    };
  }

  const totalEncounters = await prisma.encounter.count({
    where: {
      disease_id: { in: allowedDiseaseIds }
    }
  });

  const encounters = await prisma.encounter.findMany({
    where: {
      disease_id: { in: allowedDiseaseIds }
    },
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
    where: {
      disease_id: { in: allowedDiseaseIds }
    },
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
export async function getDiseaseDistribution() {
  const allowedDiseaseIds = await getDynamicDiseaseIds();
  
  if (allowedDiseaseIds.length === 0) {
    return {
      topDiseases: [],
      regionalPrevalence: {},
      seasonalTrends: {},
    };
  }

  // Top diseases
  const diseaseCounts = await prisma.encounter.groupBy({
    by: ["disease_id"],
    where: {
      disease_id: { in: allowedDiseaseIds }
    },
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
      where: {
        disease_id: { in: allowedDiseaseIds }
      },
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
      where: {
        disease_id: { in: allowedDiseaseIds }
      },
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
export async function getOutcomeAnalytics() {
  const allowedDiseaseIds = await getDynamicDiseaseIds();
  
  if (allowedDiseaseIds.length === 0) {
    return {
      recoveryRate: "0%",
      treatmentEffectiveness: {},
      outcomes: [],
    };
  }

  const outcomes =
    await prisma.encounter.groupBy({
      by: ["outcome"],
      where: {
        disease_id: { in: allowedDiseaseIds }
      },
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
        encounter: {
          disease_id: { in: allowedDiseaseIds }
        }
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

  return {
    recoveryRate:
      ((recoveryRate / total) * 100).toFixed(2) +
      "%",
    treatmentEffectiveness:
      effectivenessMap,
    outcomes,
  };
}

/**
 * TREND ANALYSIS
 * Time-series data for charts
 */
export async function getTrendAnalysis() {
  const allowedDiseaseIds = await getDynamicDiseaseIds();
  
  if (allowedDiseaseIds.length === 0) {
    return [];
  }

  const encounters =
    await prisma.encounter.findMany({
      where: {
        disease_id: { in: allowedDiseaseIds }
      },
      select: {
        date_of_diagnosis: true,
      },
      orderBy: {
        date_of_diagnosis: "asc",
      },
    });

  const trends: Record<
    string,
    number
  > = {};

  encounters.forEach((encounter) => {
    const date = new Date(
      encounter.date_of_diagnosis
    )
      .toISOString()
      .split("T")[0];

    trends[date] =
      (trends[date] || 0) + 1;
  });

  return Object.entries(trends).map(
    ([date, count]) => ({
      date,
      count,
    })
  );
}

/**
 * FACILITY COMPARISON
 * Compare performance metrics across facilities
 */
export async function getFacilityComparison() {
  const allowedDiseaseIds = await getDynamicDiseaseIds();
  
  if (allowedDiseaseIds.length === 0) {
    return [];
  }

  const facilities =
    await prisma.facility.findMany({
      include: {
        encounters: {
          where: {
            disease_id: { in: allowedDiseaseIds }
          }
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
export async function getPatientRecords() {
  const allowedDiseaseIds = await getDynamicDiseaseIds();
  
  if (allowedDiseaseIds.length === 0) {
    return [];
  }

  const patients = await prisma.patient.findMany({
    where: {
      encounters: {
        some: {
          disease_id: { in: allowedDiseaseIds }
        }
      }
    },
    include: {
      encounters: {
        where: {
          disease_id: { in: allowedDiseaseIds }
        },
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