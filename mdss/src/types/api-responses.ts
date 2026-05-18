/**
 * API Response types for analytics endpoints
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  timestamp: string;
}

export interface DemographicsResponse extends ApiResponse<{
  ageDistribution: Record<string, number>;
  genderBreakdown: Array<{
    sex: string | null;
    _count: { sex: number };
  }>;
  geographicDistribution: Array<{
    district: string | null;
    region: string | null;
    totalPatients: number;
  }>;
}> {
  data?: any;
}

export interface EncounterStatsResponse extends ApiResponse<{
  totalEncounters: number;
  averageEncounterDuration: number;
  encounterOutcomes: Array<{
    outcome: string | null;
    _count: number;
  }>;
}> {
  filters: {
    startDate: string | null;
    endDate: string | null;
  };
}

export interface DiseaseDistributionResponse extends ApiResponse<{
  topDiseases: Array<{
    disease: string;
    count: number;
  }>;
  regionalPrevalence: Record<string, Record<string, number>>;
  seasonalTrends: Record<string, number>;
}> {
  filters: {
    region: string | null;
    limit: number;
  };
}

export interface OutcomeAnalyticsResponse extends ApiResponse<{
  recoveryRate: string;
  treatmentEffectiveness: Record<string, number>;
  outcomes: Array<{
    outcome: string | null;
    _count: number;
  }>;
}> {
  filters: {
    treatment: string | null;
    facility: string | null;
  };
}

export interface TrendAnalysisResponse extends ApiResponse<
  Array<{
    date: string;
    count: number;
  }>
> {
  filters: {
    startDate: string | null;
    endDate: string | null;
    interval: string;
  };
}

export interface FacilityComparisonResponse extends ApiResponse<
  Array<{
    facilityId: string;
    facilityName: string;
    district: string;
    region: string;
    totalEncounters: number;
    recoveryRate: string;
  }>
> {
  filters: {
    region: string | null;
    district: string | null;
    sort: string;
  };
}
