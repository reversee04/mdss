# Analytics API Routes Documentation

## Overview

The analytics service is now available through Next.js API routes. All routes return standardized JSON responses with error handling.

---

## API Endpoints

### 1. Demographics

**Endpoint:** `GET /api/analytics/demographics`

Retrieves patient demographic data including age distribution, gender breakdown, and geographic distribution.

**Response:**

```json
{
  "success": true,
  "data": {
    "ageDistribution": {
      "0-17": 150,
      "18-35": 450,
      "36-50": 320,
      "51-65": 280,
      "66+": 200
    },
    "genderBreakdown": [
      { "sex": "M", "_count": { "sex": 1000 } },
      { "sex": "F", "_count": { "sex": 600 } }
    ],
    "geographicDistribution": [
      {
        "district": "District A",
        "region": "Northern",
        "totalPatients": 450
      }
    ]
  },
  "timestamp": "2026-05-16T10:30:00Z"
}
```

---

### 2. Encounters

**Endpoint:** `GET /api/analytics/encounters`

Retrieves encounter statistics including total encounters, average duration, and outcomes.

**Query Parameters:**

- `startDate` (optional): ISO date string (YYYY-MM-DD)
- `endDate` (optional): ISO date string (YYYY-MM-DD)

**Example:** `/api/analytics/encounters?startDate=2026-01-01&endDate=2026-05-16`

**Response:**

```json
{
  "success": true,
  "data": {
    "totalEncounters": 2150,
    "averageEncounterDuration": 5.3,
    "encounterOutcomes": [
      { "outcome": "recovered", "_count": 1850 },
      { "outcome": "deceased", "_count": 150 },
      { "outcome": "ongoing", "_count": 150 }
    ]
  },
  "filters": {
    "startDate": "2026-01-01",
    "endDate": "2026-05-16"
  },
  "timestamp": "2026-05-16T10:30:00Z"
}
```

---

### 3. Diseases

**Endpoint:** `GET /api/analytics/diseases`

Retrieves disease distribution including top diseases, regional prevalence, and seasonal trends.

**Query Parameters:**

- `region` (optional): Filter by region name
- `limit` (optional): Number of top diseases to return (default: 10)

**Example:** `/api/analytics/diseases?region=Northern&limit=5`

**Response:**

```json
{
  "success": true,
  "data": {
    "topDiseases": [
      { "disease": "Malaria", "count": 450 },
      { "disease": "Typhoid", "count": 320 },
      { "disease": "Cholera", "count": 280 }
    ],
    "regionalPrevalence": {
      "Northern": {
        "Malaria": 450,
        "Typhoid": 200
      },
      "Southern": {
        "Malaria": 300,
        "Cholera": 280
      }
    },
    "seasonalTrends": {
      "January": 180,
      "February": 220,
      "March": 250
    }
  },
  "filters": {
    "region": "Northern",
    "limit": 10
  },
  "timestamp": "2026-05-16T10:30:00Z"
}
```

---

### 4. Outcomes

**Endpoint:** `GET /api/analytics/outcomes`

Retrieves outcome analytics including recovery rates and treatment effectiveness.

**Query Parameters:**

- `treatment` (optional): Filter by treatment type
- `facility` (optional): Filter by facility ID

**Example:** `/api/analytics/outcomes?facility=FAC001`

**Response:**

```json
{
  "success": true,
  "data": {
    "recoveryRate": "86.05%",
    "treatmentEffectiveness": {
      "Antibiotic Treatment": 320,
      "Supportive Care": 280,
      "Combination Therapy": 450
    },
    "outcomes": [
      { "outcome": "recovered", "_count": 1850 },
      { "outcome": "deceased", "_count": 150 },
      { "outcome": "ongoing", "_count": 150 }
    ]
  },
  "filters": {
    "treatment": null,
    "facility": "FAC001"
  },
  "timestamp": "2026-05-16T10:30:00Z"
}
```

---

### 5. Trends

**Endpoint:** `GET /api/analytics/trends`

Retrieves time-series trend data for visualization.

**Query Parameters:**

- `startDate` (optional): ISO date string (YYYY-MM-DD)
- `endDate` (optional): ISO date string (YYYY-MM-DD)
- `interval` (optional): 'daily' | 'weekly' | 'monthly' (default: 'daily')

**Example:** `/api/analytics/trends?startDate=2026-04-01&endDate=2026-05-16&interval=weekly`

**Response:**

```json
{
  "success": true,
  "data": [
    { "date": "2026-04-01", "count": 45 },
    { "date": "2026-04-02", "count": 52 },
    { "date": "2026-04-03", "count": 48 }
  ],
  "filters": {
    "startDate": "2026-04-01",
    "endDate": "2026-05-16",
    "interval": "daily"
  },
  "timestamp": "2026-05-16T10:30:00Z"
}
```

---

### 6. Facilities

**Endpoint:** `GET /api/analytics/facilities`

Retrieves facility comparison metrics including recovery rates and encounter counts.

**Query Parameters:**

- `region` (optional): Filter by region
- `district` (optional): Filter by district
- `sort` (optional): 'encounters' | 'recovery' (default: 'encounters')

**Example:** `/api/analytics/facilities?region=Northern&sort=recovery`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "facilityId": "FAC001",
      "facilityName": "Central Hospital",
      "district": "District A",
      "region": "Northern",
      "totalEncounters": 450,
      "recoveryRate": "88.50%"
    },
    {
      "facilityId": "FAC002",
      "facilityName": "District Clinic",
      "district": "District B",
      "region": "Northern",
      "totalEncounters": 320,
      "recoveryRate": "82.30%"
    }
  ],
  "filters": {
    "region": "Northern",
    "district": null,
    "sort": "recovery"
  },
  "timestamp": "2026-05-16T10:30:00Z"
}
```

---

## Using the `useAnalytics` Hook

### Basic Usage

```tsx
"use client";

import { useAnalytics } from "@/hooks/use-analytics";
import { useEffect, useState } from "react";

export function DashboardExample() {
  const { getDemographics, loading, error } = useAnalytics();
  const [demographics, setDemographics] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await getDemographics();
      if (response?.success) {
        setDemographics(response.data);
      }
    };
    fetchData();
  }, [getDemographics]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {demographics && (
        <div>
          <h2>Age Distribution</h2>
          <pre>{JSON.stringify(demographics.ageDistribution, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

### With Query Parameters

```tsx
import { useAnalytics } from "@/hooks/use-analytics";

export function EncountersExample() {
  const { getEncounters, loading, error } = useAnalytics();

  useEffect(() => {
    const fetchData = async () => {
      const response = await getEncounters({
        startDate: "2026-04-01",
        endDate: "2026-05-16",
      });
      console.log(response);
    };
    fetchData();
  }, [getEncounters]);

  return <div>{/* ... */}</div>;
}
```

---

## Utility Functions

### `formatTrendData(trends)`

Convert trend data to chart.js format:

```tsx
import { formatTrendData } from "@/lib/analytics-utils";

const chartData = formatTrendData(trends);
// Ready for react-chartjs-2
```

### `formatDiseaseData(topDiseases)`

Convert disease data to chart format:

```tsx
const chartData = formatDiseaseData(topDiseases);
```

### `getRecoveryRateColor(rate)`

Get color class for recovery rate:

```tsx
const color = getRecoveryRateColor("86.05%"); // 'text-green-600'
```

### `parsePercentage(percentStr)`

Extract number from percentage string:

```tsx
parsePercentage("86.05%"); // Returns 86.05
```

---

## Error Handling

All endpoints return `success: false` on error:

```json
{
  "success": false,
  "error": "Failed to retrieve demographic data",
  "details": "Database connection failed",
  "timestamp": "2026-05-16T10:30:00Z"
}
```

**HTTP Status Codes:**

- `200` - Success
- `400` - Invalid parameters
- `500` - Server error

---

## Next Steps

1. **Integrate with Dashboard Components** - Use `useAnalytics` hook in your page components
2. **Add Caching** - Implement Redis caching for frequent queries
3. **Optimize Service** - Update analytics.service.ts to support date filtering
4. **Add Pagination** - Handle large datasets with pagination
5. **Role-Based Filtering** - Add user role checks to restrict data visibility

---

## Example: Complete Dashboard Integration

See the [integration examples](./examples/) directory for complete implementations.
