'use client';

import { useState, useCallback } from 'react';
import type {
  DemographicsResponse,
  EncounterStatsResponse,
  DiseaseDistributionResponse,
  OutcomeAnalyticsResponse,
  TrendAnalysisResponse,
  FacilityComparisonResponse,
} from '@/types/api-responses';

interface UseAnalyticsOptions {
  startDate?: string | Date;
  endDate?: string | Date;
  region?: string;
  district?: string;
  [key: string]: any;
}

/**
 * Hook for fetching analytics data
 * Handles loading, error states, and data caching
 */
export function useAnalytics() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async <T,>(endpoint: string, options?: UseAnalyticsOptions): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        if (options) {
          Object.entries(options).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              params.append(key, String(value));
            }
          });
        }

        const url = `/api/analytics${endpoint}${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch ${endpoint}`);
        }

        const data = await response.json();
        setLoading(false);
        return data as T;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(message);
        setLoading(false);
        return null;
      }
    },
    []
  );

  const getDemographics = useCallback(
    (options?: UseAnalyticsOptions) => fetchData<DemographicsResponse>('/demographics', options),
    [fetchData]
  );

  const getEncounters = useCallback(
    (options?: UseAnalyticsOptions) =>
      fetchData<EncounterStatsResponse>('/encounters', options),
    [fetchData]
  );

  const getDiseases = useCallback(
    (options?: UseAnalyticsOptions) =>
      fetchData<DiseaseDistributionResponse>('/diseases', options),
    [fetchData]
  );

  const getOutcomes = useCallback(
    (options?: UseAnalyticsOptions) =>
      fetchData<OutcomeAnalyticsResponse>('/outcomes', options),
    [fetchData]
  );

  const getTrends = useCallback(
    (options?: UseAnalyticsOptions) =>
      fetchData<TrendAnalysisResponse>('/trends', options),
    [fetchData]
  );

  const getFacilities = useCallback(
    (options?: UseAnalyticsOptions) =>
      fetchData<FacilityComparisonResponse>('/facilities', options),
    [fetchData]
  );

  return {
    loading,
    error,
    getDemographics,
    getEncounters,
    getDiseases,
    getOutcomes,
    getTrends,
    getFacilities,
  };
}
