# Disease ID Duplication Solution

## Problem Analysis

The MDSS database contains duplicate disease records with the same names but different IDs:

```
Found 7 diseases:
- Tuberculosis(5f18e4b4-86d0-4fd7-8bae-0b97d5a7b5b6)  ← UUID from hospitalAPI via ETL
- HIV/AIDS(a3b4b30b-652e-40e7-8ad2-bc98a2947d43)       ← UUID from hospitalAPI via ETL
- Tuberculosis(tb)                                      ← Simple ID (unknown source)
- Cholera(cholera)                                      ← Simple ID (unknown source)
- HIV/AIDS(hiv)                                         ← Simple ID (unknown source)
- Malaria(malaria)                                      ← Simple ID (unknown source)
- Cholera(8dacc70c-8021-4d0f-9bb6-dda195357e72)         ← UUID from hospitalAPI via ETL
```

## Architecture

**Data Flow:**
1. **hospitalAPI Database** - Seeded by `hospitalAPI/src/seed2.ts` with 21 diseases using UUID IDs
2. **ETL Process** - Transfers data from hospitalAPI to MDSS database
3. **MDSS Database** - Receives data via ETL, should have same UUID IDs as hospitalAPI

**Note:** `mdss/prisma/seed.ts` is **NOT used** in production. It only seeds test users and is not part of the ETL pipeline.

## Root Cause

The duplication occurs because:

1. **hospitalAPI/seed2.ts** creates diseases with UUID IDs based on ICD-10 codes:
   ```typescript
   const disease = await prisma.disease.upsert({
     where: { icd10Code: d.icdCode },
     create: {
       icd10Code: d.icdCode,
       name: d.name,
       // Prisma auto-generates UUID for disease_id
     },
   });
   ```

2. **ETL Process** should transfer these UUID IDs to MDSS, but something is creating duplicate records with simple string IDs ("hiv", "malaria", "tb", "cholera")

3. **Possible sources of simple ID diseases:**
   - ETL process might be creating new disease records instead of using existing ones
   - Manual data entry or testing
   - Legacy migration script
   - The unused `mdss/prisma/seed.ts` might have been run at some point

## Why This Causes Issues

1. **Duplicate Disease Names:** The MDSS database has both UUID diseases (from ETL) and simple ID diseases (from unknown source) with the same names

2. **Encounter ID Mismatch:** 
   - Encounters transferred via ETL reference UUID disease IDs
   - Simple ID diseases have no encounters linked to them
   - The analytics service tries to match outcomes by disease_id but can't find the correct disease names for all encounters

3. **Outcome Analytics Failure:**
   ```typescript
   // In getOutcomeAnalytics()
   const diseaseMap = Object.fromEntries(
     diseases.map(d => [d.disease_id, d.disease_name])
   );
   // diseaseMap has 7 entries: 4 UUIDs + 3 simple IDs
   // But encounters only reference the UUID IDs
   // When aggregating by disease_name, the simple ID entries have 0 encounters
   // This causes incorrect outcome totals
   ```

## Solution: Fix ETL Process and Clean Up Duplicates

Since hospitalAPI is the source of truth and uses UUID IDs, the solution is to:

1. **Fix the ETL process** to use UUID IDs from hospitalAPI instead of creating simple IDs
2. **Clean up existing duplicates** in MDSS database
3. **Update analytics service** to work correctly with UUID IDs

### Step 1: Fix ETL Process

The ETL process should:

1. **Pull diseases from hospitalAPI** and use their UUID IDs
2. **Upsert diseases in MDSS** using `icd10Code` as the unique key (same as hospitalAPI)
3. **Never create new disease records** - always use existing ones from hospitalAPI

**Example ETL logic for diseases:**
```typescript
// Pull diseases from hospitalAPI
const hospitalAPIDiseases = await fetchHospitalAPIDiseases();

// Upsert into MDSS using icd10Code as unique key
for (const disease of hospitalAPIDiseases) {
  await prisma.disease.upsert({
    where: { icd10Code: disease.icd10Code },
    update: {
      disease_name: disease.name,
      description: disease.description,
      // Preserve other fields from hospitalAPI
    },
    create: {
      disease_id: disease.disease_id,  // Use UUID from hospitalAPI
      icd10Code: disease.icd10Code,
      disease_name: disease.name,
      description: disease.description,
      // Copy all fields from hospitalAPI
    },
  });
}
```

### Step 2: Clean Up Existing Duplicates

Run a cleanup script to remove simple ID diseases:

## Implementation Plan

### Phase 1: Database Cleanup (One-time)

1. Create and run cleanup script to remove duplicate diseases with simple IDs
2. Verify only UUID diseases remain in MDSS database
3. Verify all encounters reference valid UUID disease IDs

### Phase 2: Fix ETL Process

1. Locate the ETL process code that transfers data from hospitalAPI to MDSS
2. Update disease transfer logic to use `icd10Code` as unique key
3. Ensure ETL uses UUID IDs from hospitalAPI, never creates new IDs
4. Test ETL process to verify no duplicates are created

### Phase 3: Update Analytics Service

1. Modify `getDynamicDiseaseIds()` to use ICD codes for focused diseases
2. Test all analytics endpoints
3. Verify outcome analytics shows correct data

### Phase 4: Validation

1. Run ETL process
2. Verify no duplicates created
3. Test all analyst pages
4. Verify filtering works correctly

## Cleanup Script

Create `mdss/prisma/cleanup-duplicates.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupDuplicateDiseases() {
  console.log("Starting disease cleanup...\n");

  // Find all diseases
  const allDiseases = await prisma.disease.findMany({
    select: { disease_id: true, disease_name: true, icd10Code: true }
  });

  console.log(`Found ${allDiseases.length} total disease records`);

  // Group by disease name
  const byName = new Map<string, any[]>();
  for (const d of allDiseases) {
    if (!byName.has(d.disease_name)) {
      byName.set(d.disease_name, []);
    }
    byName.get(d.disease_name)!.push(d);
  }

  console.log(`Found ${byName.size} unique disease names\n`);

  let totalEncountersUpdated = 0;
  let totalDiseasesDeleted = 0;

  // For each disease with duplicates
  for (const [name, diseases] of byName) {
    if (diseases.length > 1) {
      console.log(`\nProcessing ${name} (${diseases.length} records):`);
      
      // Keep the one with icd10Code (UUID from hospitalAPI), delete simple ID versions
      const toKeep = diseases.find(d => d.icd10Code);
      const toDelete = diseases.filter(d => !d.icd10Code);
      
      if (toKeep && toDelete.length > 0) {
        const idsToDelete = toDelete.map(d => d.disease_id);
        console.log(`  Keeping: ${toKeep.disease_id} (has ICD code: ${toKeep.icd10Code})`);
        console.log(`  Deleting: ${idsToDelete.join(', ')}`);
        
        // Update encounters to use the kept ID
        const encounterUpdate = await prisma.encounter.updateMany({
          where: { disease_id: { in: idsToDelete } },
          data: { disease_id: toKeep.disease_id }
        });
        totalEncountersUpdated += encounterUpdate.count;
        console.log(`  Updated ${encounterUpdate.count} encounters`);
        
        // Delete duplicate diseases
        const diseaseDelete = await prisma.disease.deleteMany({
          where: { disease_id: { in: idsToDelete } }
        });
        totalDiseasesDeleted += diseaseDelete.count;
        console.log(`  Deleted ${diseaseDelete.count} disease records`);
      }
    }
  }

  console.log(`\n✅ Cleanup complete:`);
  console.log(`   - Updated ${totalEncountersUpdated} encounters`);
  console.log(`   - Deleted ${totalDiseasesDeleted} duplicate disease records`);

  // Verify final state
  const finalDiseases = await prisma.disease.findMany({
    select: { disease_id: true, disease_name: true, icd10Code: true }
  });
  
  console.log(`\nFinal state: ${finalDiseases.length} disease records`);
  for (const d of finalDiseases) {
    console.log(`  - ${d.disease_name}: ${d.disease_id} (ICD: ${d.icd10Code || 'none'})`);
  }
}

cleanupDuplicateDiseases()
  .catch((e) => {
    console.error("Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run with:
```bash
cd mdss
npx ts-node prisma/cleanup-duplicates.ts
```

## Updated Analytics Service

Update `mdss/src/services/analytics.service.ts` `getDynamicDiseaseIds()` function:

```typescript
async function getDynamicDiseaseIds(filters?: AnalyticsFilters): Promise<string[]> {
  // Use ICD-10 codes for focused diseases (matching hospitalAPI)
  const focusedDiseaseCodes = ['B20', 'B50', 'A15', 'A00']; // HIV, Malaria, TB, Cholera
  
  const whereClause: any = {
    icd10Code: { in: focusedDiseaseCodes },
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
```

## Execution Steps

1. **Stop all applications** using the MDSS database

2. **Run cleanup script:**
   ```bash
   cd mdss
   npx ts-node prisma/cleanup-duplicates.ts
   ```

3. **Locate and fix ETL process:**
   - Find the ETL code that transfers data from hospitalAPI to MDSS
   - Update disease transfer logic to use `icd10Code` as unique key
   - Ensure it uses UUID IDs from hospitalAPI

4. **Run ETL process:**
   - Execute the fixed ETL process
   - Verify no duplicate diseases are created

5. **Verify database state:**
   ```bash
   npx prisma studio
   # Check Disease table - should have only UUID diseases from hospitalAPI
   # Check Encounter table - all disease_id should reference UUIDs
   ```

6. **Test analytics:**
   - Open analyst dashboard
   - Check outcome analytics - should show correct data
   - Test filtering by disease - should work correctly

## Verification

After implementing the solution, verify:

1. **No duplicate disease names** in the Disease table
2. **All diseases** have UUID IDs (no simple string IDs like "hiv", "malaria")
3. **All encounters** reference valid UUID disease IDs
4. **Outcome analytics** shows correct totals for all diseases
5. **Filtering by disease** works correctly
6. **ETL process** can be run multiple times without creating duplicates

## Prevention

To prevent this issue in the future:

1. **Add unique constraint** on disease_name in schema:
   ```prisma
   model Disease {
     disease_id String @id @default(uuid())
     disease_name String @unique  // Add this
     icd10Code String @unique    // Already exists
     ...
   }
   ```

2. **Document ETL strategy** in README files
3. **Add validation** in ETL process to check for duplicates before inserting
4. **Always use icd10Code** as the unique key when upserting diseases in ETL
5. **Never manually create disease records** in MDSS - always use ETL from hospitalAPI

## Note on mdss/prisma/seed.ts

The `mdss/prisma/seed.ts` file is **NOT used** in production. It only seeds test users and is not part of the ETL pipeline. The disease seeding logic in this file should be removed or commented out to prevent accidental execution.
