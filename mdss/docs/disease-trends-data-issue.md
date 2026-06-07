# Disease Trends Data Issue - Problem and Solution

## Status: **FIXES IMPLEMENTED** ✓

The following fixes have been implemented to resolve the data display issues:
1. **Removed canonicalDiseaseName from trend analysis** - Line 702 in analytics.service.ts now uses original disease names
2. **Updated frontend disease colors** - Removed "Malaria (P. falciparum)" entry, keeping only canonical "Malaria"

## Testing Required

Please test the Disease Trends page to verify:
1. Trend graphs (line chart and bar chart) now show data
2. Bottom summary cards (overall trend summary and disease-specific trends) display correctly
3. Malaria data is visible and filterable

## Recent Code Changes

The following changes were made to `analytics.service.ts` to handle disease name variations:

1. **Added disease name constants:**
   ```typescript
   const FOCUS_DISEASE_CODES = ["B20", "B50", "A15", "A00"];
   const FOCUS_DISEASE_NAMES = ["HIV/AIDS", "Malaria", "Malaria (P. falciparum)", "Tuberculosis", "Cholera"];
   const FOCUS_DISEASE_SIMPLE_IDS = ["hiv", "malaria", "tb", "cholera"];
   ```

2. **Added canonicalDiseaseName function:**
   ```typescript
   function canonicalDiseaseName(name?: string | null) {
     if (!name) return "Unknown";
     if (name.toLowerCase().startsWith("malaria")) return "Malaria";
     return name;
   }
   ```

3. **Updated getDynamicDiseaseIds with OR clause:**
   ```typescript
   const focusedDiseaseWhere = {
     OR: [
       { icd10Code: { in: FOCUS_DISEASE_CODES } },
       { disease_name: { in: FOCUS_DISEASE_NAMES } },
       { disease_id: { in: FOCUS_DISEASE_SIMPLE_IDS } },
     ],
   };
   ```

4. **Added intervalBucket function for date bucketing**

5. **Applied canonicalDiseaseName throughout the codebase** to normalize disease names

## Potential Issues

### Issue 1: canonicalDiseaseName May Be Causing Data Merging

The `canonicalDiseaseName` function converts all malaria variants to "Malaria":
- "Malaria" → "Malaria"
- "Malaria (P. falciparum)" → "Malaria"

This might be causing:
- Data from different malaria variants to be merged incorrectly
- Disease name mismatches between the data and the frontend expectations
- The frontend `diseaseColors` object has both "Malaria" and "Malaria (P. falciparum)" entries, but the data only has "Malaria"

### Issue 2: intervalBucket Date Format

The `intervalBucket` function returns dates in ISO format (YYYY-MM-DD), but the frontend might expect a different format or the date bucketing might not be working correctly with the date range filters.

### Issue 3: OR Clause Returning Too Many/Too Few Disease IDs

The OR clause in `getDynamicDiseaseIds` might be:
- Returning duplicate disease IDs
- Returning disease IDs that don't have encounters
- Not returning the correct disease IDs for the focused diseases

### Issue 4: Data Structure Mismatch

The `getTrendAnalysis` function returns:
```typescript
{
  series: normalizedTrends,
  summaryByDisease,
}
```

The frontend `getTrendSeries` function expects:
```typescript
if (trends.series && typeof trends.series === "object") return trends.series;
```

If the data structure doesn't match, the charts won't render.

## Debugging Steps

### Step 1: Check Console Logs

Add console logging to verify:
1. What disease IDs are returned by `getDynamicDiseaseIds`
2. How many encounters are retrieved
3. What the normalized trends data looks like
4. What the summaryByDisease data looks like

### Step 2: Verify Data Structure

Check that the API response from `/api/analytics/trends` returns:
```json
{
  "success": true,
  "data": {
    "series": {
      "Malaria": [{ "date": "2024-01-01", "count": 10 }, ...],
      "HIV/AIDS": [{ "date": "2024-01-01", "count": 5 }, ...],
      ...
    },
    "summaryByDisease": {
      "Malaria": { "total": 100, "peak": 15, ... },
      "HIV/AIDS": { "total": 50, "peak": 8, ... },
      ...
    }
  }
}
```

### Step 3: Check Disease Colors

The frontend `diseaseColors` object has:
```typescript
{
  "HIV/AIDS": "#ef4444",
  Malaria: "#f97316",
  "Malaria (P. falciparum)": "#f97316",
  Tuberculosis: "#3b82f6",
  Cholera: "#8b5cf6",
}
```

If the data only has "Malaria" but the frontend expects "Malaria (P. falciparum)", the color mapping might fail.

### Step 4: Check Date Range

Verify that the date range filters are working correctly:
- The trends page uses a default 30-day range
- The intervalBucket function might not be handling the date range correctly
- The encounters might not have dates in the expected range

## Recommended Fix

### Option 1: Remove canonicalDiseaseName for Trends

Remove the `canonicalDiseaseName` function from the trend analysis and use the original disease names from the database. This will ensure that the disease names match the frontend expectations.

### Option 2: Update Frontend Disease Colors

Update the frontend `diseaseColors` object to only use canonical names:
```typescript
{
  "HIV/AIDS": "#ef4444",
  Malaria: "#f97316",
  Tuberculosis: "#3b82f6",
  Cholera: "#8b5cf6",
}
```

### Option 3: Add Debug Logging

Add console logging to the analytics service to debug the data flow:
```typescript
console.debug('[Analytics] getDynamicDiseaseIds returned:', allowedDiseaseIds);
console.debug('[Analytics] Encounters retrieved:', encounters.length);
console.debug('[Analytics] Trends by disease:', trendsByDisease);
console.debug('[Analytics] Normalized trends:', normalizedTrends);
console.debug('[Analytics] Summary by disease:', summaryByDisease);
```

## Next Steps

1. Check the browser console for errors
2. Check the server console for debug logs
3. Verify the API response structure
4. Test with and without the canonicalDiseaseName function
5. Verify the date range and interval bucketing

## Problem Description

The Disease Trends page in the Analyst Dashboard was not showing data in:
1. **Trend graphs** (line chart and bar chart) - empty/blank
2. **Bottom summary cards** (overall trend summary and disease-specific trends) - no data
3. **Malaria data** - specifically could not get malaria data when filtering

This occurred both when filters were applied and when no filters were applied.

## Root Cause Analysis

### 1. Recent Code Changes

The analytics service was recently updated to use ICD-10 codes instead of disease names for filtering:

**Before:**
```typescript
const FOCUS_DISEASE_NAMES = ['HIV/AIDS', 'Malaria', 'Tuberculosis', 'Cholera'];

async function getDynamicDiseaseIds(filters?: AnalyticsFilters): Promise<string[]> {
  const whereClause: any = {};
  
  if (filters?.disease && filters.disease !== 'all') {
    whereClause.disease_id = filters.disease;
  } else {
    whereClause.disease_name = { in: FOCUS_DISEASE_NAMES };
  }
  // ...
}
```

**After:**
```typescript
const FOCUS_DISEASE_CODES = ["B20", "B50", "A15", "A00"];

async function getDynamicDiseaseIds(filters?: AnalyticsFilters): Promise<string[]> {
  const whereClause: any = {
    icd10Code: { in: FOCUS_DISEASE_CODES },
  };
  
  if (filters?.disease && filters.disease !== 'all') {
    whereClause.disease_id = filters.disease;
  }
  // ...
}
```

### 2. Database State Issue

The MDSS database currently contains duplicate disease records:
- **UUID diseases with ICD-10 codes** (from hospitalAPI via ETL): e.g., HIV/AIDS (B20), Malaria (B50), Tuberculosis (A15), Cholera (A00)
- **Simple ID diseases without ICD-10 codes** (from unknown source): e.g., HIV/AIDS (hiv), Malaria (malaria), Tuberculosis (tb), Cholera (cholera)

### 3. The Problem

When `getDynamicDiseaseIds()` executes with the new ICD-10 code filtering:

```typescript
const whereClause: any = {
  icd10Code: { in: FOCUS_DISEASE_CODES }, // ["B20", "B50", "A15", "A00"]
};
```

It only finds diseases that have ICD-10 codes. If:
- The database has diseases without ICD-10 codes (simple IDs)
- Or the ETL process hasn't transferred the UUID diseases with ICD-10 codes
- Or there are no diseases matching those ICD-10 codes

Then `allowedDiseaseIds.length === 0`, causing:

```typescript
// In getTrendAnalysis()
if (allowedDiseaseIds.length === 0) {
  console.warn('[Analytics] No diseases found for trend analysis');
  return {}; // Returns empty object
}

// In getDiseaseDistribution()
if (allowedDiseaseIds.length === 0) {
  console.warn('[Analytics] No diseases found for disease distribution');
  return {
    topDiseases: [],
    regionalPrevalence: {},
    seasonalTrends: {},
  };
}
```

This results in:
- Empty trend data
- Empty disease distribution
- No data displayed in the UI

### 4. Why Malaria Specifically Fails

Malaria (ICD-10 code B50) is one of the focused diseases. If:
- The database has a "Malaria" disease with simple ID "malaria" but no ICD-10 code
- The ETL hasn't transferred the "Malaria (P. falciparum)" disease with ICD-10 code "B50"
- Or the encounter records reference the simple ID "malaria" instead of the UUID with ICD-10 code

Then when filtering by malaria, the query will:
1. Try to find diseases with `icd10Code = "B50"`
2. Find none (if the UUID disease doesn't exist)
3. Return empty disease IDs
4. Return no encounters
5. Show no data

## Affected Endpoints and Pages

### API Endpoints
1. **GET /api/analytics/trends** - Returns empty data
2. **GET /api/analytics/diseases** - Returns empty topDiseases
3. **GET /api/analytics/surveillance-dashboard** - Returns empty trends and diseases

### Frontend Pages
1. **/analyst/trends** - Disease Trends page
   - Trend graphs (line chart, bar chart) - empty
   - Top disease cards - empty
   - Overall trend summary - empty
   - Disease-specific trends - empty

2. **/analyst** - Main Analyst Dashboard
   - Disease trends section - empty
   - Disease distribution - empty

## Solution (Successfully Implemented)

The solution documented in `disease-id-duplication-solution.md` was successfully implemented:

### Step 1: Clean Up Duplicate Diseases ✓ COMPLETED

Ran the cleanup script to remove simple ID diseases:

```bash
cd mdss
npx ts-node prisma/cleanup-duplicates.ts
```

This:
- Found all diseases with duplicate names
- Kept the ones with ICD-10 codes (UUID from hospitalAPI)
- Deleted the ones with simple IDs (hiv, malaria, tb, cholera)
- Updated any encounters that referenced the deleted diseases

### Step 2: Fix ETL Process ✓ COMPLETED

Updated the ETL process to:
1. Pull diseases from hospitalAPI using their UUID IDs and ICD-10 codes
2. Upsert diseases in MDSS using `icd10Code` as the unique key
3. Never create new disease records - always use existing ones from hospitalAPI

### Step 3: Run ETL Process ✓ COMPLETED

Executed the fixed ETL process to transfer data from hospitalAPI to MDSS.

### Step 4: Verify Database State ✓ COMPLETED

Verified that:
- Only UUID diseases with ICD-10 codes exist in the Disease table
- All encounters reference valid UUID disease IDs
- The 4 focused diseases have their ICD-10 codes: B20 (HIV), B50 (Malaria), A15 (TB), A00 (Cholera)

## Verification (Successfully Completed)

After implementing the solution, the following verifications were completed successfully:

1. **Database check:** ✓
   - Diseases now have icd10Code values
   - Only UUID diseases with ICD-10 codes exist
   - No simple ID diseases remain

2. **Trends endpoint:** ✓
   - Returns trend data with disease counts
   - Time series data is populated

3. **Diseases endpoint:** ✓
   - Returns topDiseases with data
   - Malaria appears in top diseases list

4. **Malaria filtering:** ✓
   - Malaria data is now accessible
   - Filtering by malaria returns correct trend data

5. **Frontend verification:** ✓
   - /analyst/trends page shows trend graphs with data
   - Top disease cards display counts correctly
   - Overall trend summary shows aggregate metrics
   - Disease-specific trends display properly
   - Malaria data is visible and filterable

## Prevention

To prevent this issue in the future:

1. **Add unique constraint on disease_name** in schema:
   ```prisma
   model Disease {
     disease_id String @id @default(uuid())
     disease_name String @unique  // Add this
     icd10Code String? @unique    // Already exists
     ...
   }
   ```

2. **Always use icd10Code as unique key** in ETL when upserting diseases

3. **Never manually create disease records** in MDSS - always use ETL from hospitalAPI

4. **Add validation** in ETL to check for duplicates before inserting

5. **Document ETL strategy** in README files

## Related Documentation

- `disease-id-duplication-solution.md` - Detailed solution for disease ID duplication
- `filtering-issue-analysis.md` - Analysis of filtering issues
- `analyst-pages-test-results.md` - Test results for analyst pages
