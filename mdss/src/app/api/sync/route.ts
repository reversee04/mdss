import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { patients, encounters, diseases, facilities } = body;

    // We increase the timeout to 30 seconds for large syncs
    await prisma.$transaction(
      async (tx) => {
        // STEP 1: Sync Diseases (Must happen first)
        if (diseases && diseases.length > 0) {
          for (const d of diseases) {
            await tx.disease.upsert({
              where: { disease_id: d.id },
              update: { disease_name: d.name },
              create: { disease_id: d.id, disease_name: d.name },
            });
          }
        }

        // STEP 2: Create a safety fallback for missing diagnoses
        await tx.disease.upsert({
          where: { disease_id: "UNKNOWN" },
          update: {},
          create: {
            disease_id: "UNKNOWN",
            disease_name: "Unspecified Disease",
          },
        });

        // STEP 3: Sync Facility
        for (const fac of facilities) {
          await tx.facility.upsert({
            where: { facility_id: fac.id },
            update: {
              name: fac.name,
              type: fac.type,
              district: fac.district,
              region: fac.region,
            },
            create: {
              facility_id: fac.id,
              name: fac.name,
              type: fac.type,
              district: fac.district,
              region: fac.region,
            },
          });
        }

        // STEP 4: Sync Patients
        for (const p of patients) {
          await tx.patient.upsert({
            where: { patient_id: p.id },
            update: {
              firstname: p.firstName || "Unknown",
              nid_or_passport_no: p.nid || "N/A",
              sex: p.sex || "UNKNOWN",
              date_of_birth: new Date(p.dateOfBirth),
            },
            create: {
              patient_id: p.id,
              firstname: p.firstName || "Unknown",
              nid_or_passport_no: p.nid || "N/A",
              sex: p.sex || "UNKNOWN",
              date_of_birth: new Date(p.dateOfBirth),
            },
          });
        }

        // STEP 5: Sync Encounters
        for (const e of encounters) {
          // Find the diseaseId from the sender's nested diagnoses
          const diseaseId = e.diagnoses?.[0]?.diseaseId || "UNKNOWN";

          await tx.encounter.upsert({
            where: { encounter_id: e.id },
            update: {
              outcome: e.outcome?.result || "PENDING",
              discharge_date: e.dischargedAt ? new Date(e.dischargedAt) : null,
            },
            create: {
              encounter_id: e.id,
              patient_id: e.patientId,
              facility_id: e.facilityId,
              disease_id: diseaseId,
              date_of_diagnosis: new Date(e.admittedAt),
              admission_date: new Date(e.admittedAt),
              discharge_date: e.dischargedAt ? new Date(e.dischargedAt) : null,
              outcome: e.outcome?.result || "PENDING",
            },
          });
        }
      },
      {
        timeout: 30000, // 30 seconds timeout
        maxWait: 5000, // 5 seconds to acquire connection
      },
    );

    return NextResponse.json({ message: "Sync successful" }, { status: 200 });
  } catch (error: any) {
    console.error("Sync Error Details:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 },
    );
  }
}
