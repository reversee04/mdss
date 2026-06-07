import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const FOCUS_DISEASE_CODES = ['B20', 'B50', 'A15', 'A00'];
const FOCUS_DISEASE_NAMES = ['HIV/AIDS', 'Malaria', 'Malaria (P. falciparum)', 'Tuberculosis', 'Cholera'];
const FOCUS_DISEASE_SIMPLE_IDS = ['hiv', 'malaria', 'tb', 'cholera'];

function canonicalDiseaseName(name: string) {
  return name.toLowerCase().startsWith('malaria') ? 'Malaria' : name;
}

export async function GET() {
  const diseases = await prisma.disease.findMany({
    where: {
      OR: [
        { icd10Code: { in: FOCUS_DISEASE_CODES } },
        { disease_name: { in: FOCUS_DISEASE_NAMES } },
        { disease_id: { in: FOCUS_DISEASE_SIMPLE_IDS } },
      ],
    },
    select: {
      disease_id: true,
      icd10Code: true,
      disease_name: true,
      outbreak_threshold: true,
      warning_threshold: true,
      monitoring_enabled: true,
      alert_recipients: true,
      alert_cooldown_hours: true,
    },
    orderBy: { disease_name: 'asc' },
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

  return NextResponse.json(uniqueDiseases);
}
