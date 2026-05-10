import { prisma } from '@/lib/prisma';
import { normalizePatient} from '@/transformers/patientTransformer';

export async function processSync(payload: any){
    
    const{
    syncLog,
    sourceHospital,
    patients = [],
    encounters = [],
    diagnoses = [],
    } = payload;

    // save raw patients
    for (const patient of patients) {
        await prisma.rawPatient.create({
            data:{
                syncLogId: syncLog,
                sourceHospitalCode: sourceHospital,
                externalId: patient.id,
                payload: patient
            },
        });

        // transform and save normaliz
        const normalizedPatient = normalizePatient(patient);

        // save canonical
        await prisma.mDSSPatient.upsert({
            where:{
                patientHash: normalizedPatient.patientHash
            },
            update: normalizePatient,
            create: normalizedPatient
        });
    }

    console.log(`Processed ${patients.length} patients `);

}