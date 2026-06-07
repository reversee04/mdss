import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SIMPLE_ID_TO_ICD_CODE: Record<string, string> = {
  hiv: "B20",
  malaria: "B50",
  tb: "A15",
  cholera: "A00",
};

async function ensureSimpleIdsHaveCodes() {
  for (const [diseaseId, icd10Code] of Object.entries(SIMPLE_ID_TO_ICD_CODE)) {
    const disease = await prisma.disease.findUnique({
      where: { disease_id: diseaseId },
      select: { disease_name: true },
    });

    if (!disease) continue;

    const existingCanonical = await prisma.disease.findFirst({
      where: {
        disease_id: { not: diseaseId },
        disease_name: { equals: disease.disease_name, mode: "insensitive" },
        icd10Code: { not: null },
      },
      select: { disease_id: true },
    });

    if (existingCanonical) continue;

    await prisma.disease.updateMany({
      where: {
        disease_id: diseaseId,
        icd10Code: null,
      },
      data: { icd10Code },
    });
  }
}

async function cleanupDuplicateDiseases() {
  console.log("Starting disease cleanup...");

  await ensureSimpleIdsHaveCodes();

  const allDiseases = await prisma.disease.findMany({
    select: {
      disease_id: true,
      disease_name: true,
      icd10Code: true,
    },
  });

  console.log(`Found ${allDiseases.length} total disease records`);

  const byName = new Map<string, typeof allDiseases>();
  for (const disease of allDiseases) {
    const key = disease.disease_name.trim().toLowerCase();
    byName.set(key, [...(byName.get(key) || []), disease]);
  }

  let totalEncountersUpdated = 0;
  let totalDiseasesDeleted = 0;

  for (const diseases of byName.values()) {
    if (diseases.length <= 1) continue;

    const canonical =
      diseases.find((disease) => disease.icd10Code && !Object.prototype.hasOwnProperty.call(SIMPLE_ID_TO_ICD_CODE, disease.disease_id)) ||
      diseases.find((disease) => disease.icd10Code);

    if (!canonical) {
      console.warn(`Skipping ${diseases[0].disease_name}: no ICD-coded disease record found`);
      continue;
    }

    const duplicates = diseases.filter((disease) => disease.disease_id !== canonical.disease_id);
    const duplicateIds = duplicates.map((disease) => disease.disease_id);

    const encounterUpdate = await prisma.encounter.updateMany({
      where: { disease_id: { in: duplicateIds } },
      data: { disease_id: canonical.disease_id },
    });
    totalEncountersUpdated += encounterUpdate.count;

    const diseaseDelete = await prisma.disease.deleteMany({
      where: { disease_id: { in: duplicateIds } },
    });
    totalDiseasesDeleted += diseaseDelete.count;

    console.log(
      `Cleaned ${canonical.disease_name}: kept ${canonical.disease_id}, deleted ${duplicateIds.join(", ")}`
    );
  }

  console.log("Cleanup complete:");
  console.log(`- Updated ${totalEncountersUpdated} encounters`);
  console.log(`- Deleted ${totalDiseasesDeleted} duplicate disease records`);
}

cleanupDuplicateDiseases()
  .catch((error) => {
    console.error("Cleanup failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
