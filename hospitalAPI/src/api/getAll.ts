// this one is for fetching all the data from the database
import { time } from "node:console";
import { prisma } from "../prisma";
import axios from "axios";

export async function syncToMDSS() {
  try {
    const lastSync = await prisma.apiSyncLog.findFirst({
      where: { success: true },
      orderBy: { syncCompletedAt: "desc" },
    });

    const lastSyncTime =
      lastSync?.syncCompletedAt || new Date("2026-01-01T00:00:00Z");

    // now we fetch updated data
    const patients = await prisma.patient.findMany({
      where: {
        updatedAt: {
          gte: lastSyncTime,
        },
      },
    });
    // CRITICAL: Include diagnoses so the encounter knows which disease it belongs to
    const encounters = await prisma.patientEncounter.findMany({
      where: { updatedAt: { gte: lastSyncTime } },
      include: {
        diagnoses: true, // This maps the source relationship
        outcome: true, // This maps the source outcome
      },
    });
    const diagnoses = await prisma.diagnosis.findMany({
      where: {
        updatedAt: {
          gte: lastSyncTime,
        },
      },
    });

    const diseases = await prisma.disease.findMany({
      where: {
        updatedAt: {
          gte: lastSyncTime,
        },
      },
    });

    const facilities = await prisma.facility.findMany({
      where: {
        updatedAt: {
          gte: lastSyncTime,
        },
      },
    });

    // send this data to MDSS
    // let facility = null;

    //encounters.reduce((acc, curr) => {
    //    if(curr.facilityId && !acc.includes(curr.facilityId)) {
    //        acc.push(curr.facilityId);
    // return acc;
    //    }
    //    return acc;
    //}, [] as string[])
    // }
    console.log("facilities :", facilities); //visualize
    // if (encounters.length > 0 && encounters[0]?.facilityId) {
    //   //a for loop that runs on all encounters and finds the first facility that is not null and uses that for the sync
    //   facility = await prisma.facility.findUnique({
    //     where: { id: encounters[0]?.facilityId }, // Use the actual ID from the data
    //   });
    // } else {
    //   facility = await prisma.facility.findFirst();
    // }
    await axios.post(
      "http://192.168.56.1:3000/api/sync",
      {
        // sourceHospital: facilit?.name,

        patients,
        encounters,
        diagnoses,
        facilities,
        diseases,
      },
      {
        timeout: 10000,
      },
    );
    console.log(
      `tried sync ${patients.length} patients, ${encounters.length} encounters, and ${diagnoses.length} diagnoses to MDSS.`,
    );
    // console.log(diseases)
    // log the sync
    await prisma.apiSyncLog.create({
      data: {
        requestedBy: "MDSS_system",
        endpoint: "/api/sync",
        recordsReturned:
          patients.length +
          encounters.length +
          diagnoses.length +
          diseases.length +
          (facilities ? 1 : 0),
        success: true,
        syncCompletedAt: new Date(),
      },
    });

    console.log(
      `Synced ${patients.length} patients, ${encounters.length} encounters, and ${diagnoses.length} diagnoses to MDSS.`,
    );
    console.log(diseases);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error syncing to MDSS:", message);

    // await prisma.apiSyncLog.create({
    //     data: {
    //        requestedBy: "MDSS_system",
    //        endpoint: "/api/sync",
    //        success: false,
    //        errorMessage: message,
    //        syncCompletedAt: new Date(),
    //     },
    // });
  }
}
