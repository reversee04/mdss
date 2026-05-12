import { prisma } from '@/lib/prisma';
import { normalizePatient} from '@/transformers/patientTransformer';
import { updateBFCacheEntryStaleAt } from 'next/dist/client/components/segment-cache/bfcache';

export async function processSync(payload: any){
    
    const{
    syncLog = "",
    sourceHospital="",
    patients = [],
    encounters = [],
    diagnoses = [],
    } = payload;

    console.log('The Patient:', patients[0]);

    // save raw patients
    for (const patient of patients) {
        await prisma.rawPatient.upsert({
            where:{
                sourceHospitalCode_externalId:{
                    sourceHospitalCode: sourceHospital,
                    externalId: patient.id,
                }
            },
            update:{
                syncLogId: syncLog,
                payload: patient,
            },            
            create:{
                syncLogId: syncLog,
                sourceHospitalCode: sourceHospital,
                externalId: patient.id,
                payload: patient,
            },
        });
        // transform and save normaliz
        const normalizedPatient = normalizePatient(patient);

        // save canonical
        console.log("patient:0", patient)
        await prisma.mDSSPatient.upsert({
            where:{
                patientHash: normalizedPatient.patientHash
            },
            update: normalizedPatient,
            create: normalizedPatient
        });
    }
    console.log(`Processed ${patients.length} patients `);

}