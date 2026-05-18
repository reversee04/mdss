/**
 * Utility functions for analytics data transformation and formatting
 */

/**
 * Format recovery rate percentage from string to number
 * @example "85.50%" -> 85.50
 */
export const parsePercentage = (percentStr: string): number => {
  return parseFloat(percentStr.replace('%', ''));
};

/**
 * Format number as percentage string
 * @example 85.5 -> "85.50%"
 */
export const formatPercentage = (value: number, decimals = 2): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Get age group label from age groups object
 * @example { "0-17": 10, "18-35": 20 } -> [{ label: "0-17 years", value: 10 }, ...]
 */
export const formatAgeDistribution = (
  ageGroups: Record<string, number>
) => {
  return Object.entries(ageGroups).map(([group, count]) => ({
    ageGroup: group,
    count,
    label: `${group} years`,
    percentage: 0, // Will be calculated if needed
  }));
};

/**
 * Convert trend data to chart-friendly format
 */
export const formatTrendData = (
  trends: Array<{ date: string; count: number }>
) => {
  return {
    labels: trends.map((t) => {
      const date = new Date(t.date);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }),
    datasets: [
      {
        label: 'Encounters',
        data: trends.map((t) => t.count),
        borderColor: '#006cbf',
        backgroundColor: 'rgba(0, 107, 191, 0.1)',
        tension: 0.3,
      },
    ],
  };
};

/**
 * Convert disease data to chart-friendly format (top 10)
 */
export const formatDiseaseData = (
  topDiseases: Array<{ disease: string; count: number }>
) => {
  const sorted = topDiseases
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    labels: sorted.map((d) => d.disease),
    datasets: [
      {
        label: 'Cases',
        data: sorted.map((d) => d.count),
        backgroundColor: [
          '#006cbf',
          '#22c55e',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
          '#06b6d4',
          '#ec4899',
          '#10b981',
          '#f97316',
          '#6366f1',
        ],
      },
    ],
  };
};

/**
 * Format facility comparison for display
 */
export const formatFacilityComparison = (
  facilities: Array<{
    facilityId: string;
    facilityName: string;
    district: string;
    region: string;
    totalEncounters: number;
    recoveryRate: string;
  }>
) => {
  return facilities.map((f) => ({
    ...f,
    recoveryRateNumber: parsePercentage(f.recoveryRate),
  }));
};

/**
 * Calculate summary statistics
 */
export const calculateSummaryStats = (
  encounters: number,
  avgDuration: number,
  recoveryRate: string
) => {
  return {
    totalEncounters: encounters,
    averageDuration: avgDuration.toFixed(1),
    recoveryRate,
    dataQuality: 'Excellent', // Can be enhanced with actual validation
  };
};

/**
 * Get color for recovery rate (green for high, red for low)
 */
export const getRecoveryRateColor = (rate: string): string => {
  const percentage = parsePercentage(rate);

  if (percentage >= 80) return 'text-green-600';
  if (percentage >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

/**
 * Filter facilities by region
 */
export const filterFacilitiesByRegion = (
  facilities: Array<any>,
  region: string
) => {
  return facilities.filter((f) => f.region === region);
};

/**
 * Get top performers by recovery rate
 */
export const getTopFacilities = (facilities: Array<any>, limit = 5) => {
  return facilities
    .sort(
      (a, b) =>
        parsePercentage(b.recoveryRate) - parsePercentage(a.recoveryRate)
    )
    .slice(0, limit);
};
