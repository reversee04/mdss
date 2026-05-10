import { prisma } from '@/lib/prisma';
import { normalizePatient} from '@/transformers/patientTransformer';

export async function processSync(payload: any){
    
    const{
    sourceHospital,
    patients = [],
    encounters = [],
    diagnoses = [],
    } = payload;

    // save raw patients
    for (const patient of patients) {
        const rawPatient = await prisma.RawPatient.create({
            data:{
                sourceHospital,
                externalId: patient.id,
                payload: patient
            },
        });

        // transform and save normaliz
        const normalizedPatient = normalizePatient(patient);

        // save canonical
        await prisma.MDSSPatient.upsert({
            where:{
                patientHash: normalizedPatient.patientHash
            },
            update: normalizePatient,
            create: normalizedPatient
        });
    }

    console.log(`Processed ${patients.length} patients `);

}