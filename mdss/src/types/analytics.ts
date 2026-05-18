export interface DemographicsData {
  ageDistribution: { ageGroup: string; count: number }[]
  genderDistribution: { gender: string; count: number }[]
  totalPatients: number
}

export interface EncounterMetrics {
  totalEncounters: number
  averageLOS: number  // Length of Stay
  readmissionRate: number
  mortalityRate: number
}

export interface DiseaseMetrics {
  diseaseId: string
  diseaseName: string
  caseCount: number
  recoveryRate: number
  prevalence: number
}

export interface TrendData {
  date: string
  encounters: number
  patients: number
  recoveries: number
  deaths: number
}

export interface FacilityPerformance {
  facilityId: string
  facilityName: string
  totalPatients: number
  avgOutcome: number
  efficiency: number
}