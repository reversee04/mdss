import { NextRequest, NextResponse } from "next/server";
import { getPatientRecords } from "@/services/analytics.service";

/**
 * GET /api/analytics/patients
 * Retrieves patient records with clinical timeline and treatment history
 * 
 * Query Parameters:
 * - disease?: Filter by specific disease
 * - facility?: Filter by facility ID
 * - district?: Filter by district
 * - status?: Filter by patient status (On Treatment, Recovered, Admitted, Treatment Failure)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const disease = searchParams.get("disease");
    const facility = searchParams.get("facility");
    const district = searchParams.get("district");
    const status = searchParams.get("status");

    // TODO: Pass filters to service once updated
    const patients = await getPatientRecords();

    // Client-side filtering (TODO: move to service)
    let filteredPatients = patients;

    if (disease) {
      filteredPatients = filteredPatients.filter((p) => 
        p.disease.toLowerCase().includes(disease.toLowerCase())
      );
    }

    if (facility) {
      filteredPatients = filteredPatients.filter((p) => 
        p.facility.toLowerCase().includes(facility.toLowerCase())
      );
    }

    if (district) {
      filteredPatients = filteredPatients.filter((p) => 
        p.district.toLowerCase().includes(district.toLowerCase())
      );
    }

    if (status) {
      filteredPatients = filteredPatients.filter((p) => 
        p.status.toLowerCase() === status.toLowerCase()
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: filteredPatients,
        filters: {
          disease: disease || null,
          facility: facility || null,
          district: district || null,
          status: status || null,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Analytics] Patients error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve patient records",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
