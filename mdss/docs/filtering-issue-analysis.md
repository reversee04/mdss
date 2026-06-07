# Filtering Issue Analysis

## Problem Description
Filtering by Disease, District, facilities, and duration/period is not working correctly. The logs reveal multiple underlying issues.

## Root Causes

### 1. Duplicate Disease Records in Database

The database contains duplicate disease entries with the same names but different IDs:

```
Found 7 diseases:
- Tuberculosis(5f18e4b4-86d0-4fd7-8bae-0b97d5a7b5b6)  ← UUID
- HIV/AIDS(a3b4b30b-652e-40e7-8ad2-bc98a2947d43)       ← UUID
- Tuberculosis(tb)                                      ← Simple ID
- Cholera(cholera)                                      ← Simple ID
- HIV/AIDS(hiv)                                         ← Simple ID
- Malaria(malaria)                                      ← Simple ID
- Cholera(8dacc70c-8021-4d0f-9bb6-dda195357e72)         ← UUID
```

**Impact:**
- When filtering by disease name, the system returns ALL matching records (both UUID and simple ID versions)
- When analytics try to aggregate data by disease_id, only some IDs have associated encounter data
- This causes incorrect totals in outcome analytics

**Evidence from logs:**
```
[getOutcomeAnalytics] Summary by disease:
  Tuberculosis: { total: 0, recovered: 0, deaths: 0, ... }  ← Should be 91
  HIV/AIDS: { total: 0, recovered: 0, deaths: 0, ... }      ← Should be 117
  Cholera: { total: 211, recovered: 40, deaths: 32, ... }  ← This works
  Malaria: { total: 0, recovered: 0, deaths: 0, ... }      ← Should have data
```

But the actual encounter counts show:
```
[Analytics] Top disease counts:
  8dacc70c-8021-4d0f-9bb6-dda195357e72: 211  ← Cholera UUID
  a3b4b30b-652e-40e7-8ad2-bc98a2947d43: 117   ← HIV/AIDS UUID
  5f18e4b4-86d0-4fd7-8bae-0b97d5a7b5b6: 91    ← Tuberculosis UUID
```

The outcome analytics is looking for disease names like "Tuberculosis" but the encounters are linked to UUID IDs, causing a mismatch.

### 2. Date Range Filtering Returns No Data

When a date range is applied (2026-05-07 to 2026-06-06), the trend analysis returns 0 encounters:

```
[Trends API] Query params: {
  startDate: '2026-05-07',
  endDate: '2026-06-06',
  ...
}
[Analytics] Retrieved 0 encounters for trend analysis
```

**Impact:**
- Date-based filtering appears to work (the filter is built correctly)
- But no data exists in the specified date range
- This suggests the database has encounter dates outside the last 30 days

### 3. Missing API Endpoint

The FilterPanel component is trying to fetch diseases from `/api/admin/diseases/list` which returns 404:

```
GET /api/admin/diseases/list 404 in 517ms
[browser] [FilterPanel] Failed to fetch diseases: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

**Impact:**
- The FilterPanel cannot populate the disease dropdown
- It receives HTML (404 page) instead of JSON, causing a parsing error
- This prevents users from selecting diseases in the filter

## Technical Details

### How Disease Filtering Currently Works

1. `getDynamicDiseaseIds()` function searches for diseases by name:
   ```typescript
   whereClause.disease_name = { in: focusedDiseases }
   // Returns ALL diseases matching the names (including duplicates)
   ```

2. It returns 7 disease IDs (4 diseases × 2 versions each, minus 1)

3. `buildEncounterFilter()` uses these IDs to filter encounters:
   ```typescript
   where.disease_id = { in: allowedDiseaseIds }
   ```

4. This works for encounter counts (finds 419 total encounters)

5. But `getOutcomeAnalytics()` tries to match outcomes by disease_id and then group by disease_name:
   ```typescript
   const diseaseMap = Object.fromEntries(
     diseases.map(d => [d.disease_id, d.disease_name])
   );
   ```
   The disease_map has 7 entries, but only 3 have actual encounter data.

### Why Outcome Analytics Shows Zeros

The outcome analytics groups outcomes by `disease_id`, then looks up the disease name from the 7 disease records. Since the encounters are only linked to 3 of the 7 disease IDs (the UUID versions), when it tries to aggregate by disease name, it's missing the data for the simple ID versions.

## Recommended Fixes

### 1. Clean Up Duplicate Disease Records (Critical)

**Option A: Merge duplicates**
- Identify which disease IDs have actual encounter data
- Update all encounters to use a single canonical ID per disease
- Delete the duplicate disease records

**Option B: Use disease_name for filtering instead of disease_id**
- Change the filtering logic to use disease_name consistently
- This would work around the duplicate ID issue
- May require schema changes

### 2. Fix Date Range Data

- Investigate why encounters don't exist in the last 30 days
- Either update the test data to have recent dates
- Or adjust the default date range to match actual data

### 3. Create Missing API Endpoint

Create `/api/admin/diseases/list` endpoint or update FilterPanel to use an existing endpoint like `/api/analytics/diseases`.

### 4. Add Data Validation

Add checks to ensure:
- Disease names are unique in the database
- All disease_id references in encounters are valid
- Date ranges contain data before applying filters

## Summary

The primary issue is **data integrity**: duplicate disease records with different IDs are causing analytics to fail when aggregating by disease name. The filtering logic itself works correctly, but the underlying data structure prevents accurate results.
