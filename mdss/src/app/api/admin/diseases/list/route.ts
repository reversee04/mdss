import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Four focused diseases for ETL and surveillance.
const FOCUSED_DISEASE_CODES = ['B20', 'B50', 'A15', 'A00'];
const FOCUSED_DISEASE_NAMES = ['HIV/AIDS', 'Malaria', 'Malaria (P. falciparum)', 'Tuberculosis', 'Cholera'];
const FOCUSED_DISEASE_SIMPLE_IDS = ['hiv', 'malaria', 'tb', 'cholera'];

function canonicalDiseaseName(name: string) {
  return name.toLowerCase().startsWith('malaria') ? 'Malaria' : name;
}

/**
 * GET /api/admin/diseases/list
 * Retrieves the 4 focused diseases (TB, Cholera, HIV/AIDS, Malaria)
 * These are the only diseases in our ETL pipeline
 * 
 * Returns:
 * - Array of { disease_id, icd10Code, disease_name }
 */
export async function GET() {
  try {
    const diseases = await prisma.disease.findMany({
      where: {
        OR: [
          { icd10Code: { in: FOCUSED_DISEASE_CODES } },
          { disease_name: { in: FOCUSED_DISEASE_NAMES } },
          { disease_id: { in: FOCUSED_DISEASE_SIMPLE_IDS } },
        ],
      },
      select: {
        disease_id: true,
        icd10Code: true,
        disease_name: true,
      },
      orderBy: {
        disease_name: 'asc',
      },
    });

    const uniqueDiseases = Array.from(
      diseases
        .reduce((byName, disease) => {
          const canonicalName = canonicalDiseaseName(disease.disease_name);
          const key = canonicalName.toLowerCase();
          const current = byName.get(key);
          if (!current || (!current.icd10Code && disease.icd10Code)) {
            byName.set(key, { ...disease, disease_name: canonicalName });
          }
          return byName;
        }, new Map<string, (typeof diseases)[number]>())
        .values()
    );

    if (uniqueDiseases.length !== FOCUSED_DISEASE_CODES.length) {
      console.warn(`[Diseases List] Expected ${FOCUSED_DISEASE_CODES.length} diseases, found ${uniqueDiseases.length}`);
    }

    return NextResponse.json(
      {
        success: true,
        data: uniqueDiseases,
        count: uniqueDiseases.length,
        focusedDiseaseCodes: FOCUSED_DISEASE_CODES,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Admin] Diseases list error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve disease list",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

