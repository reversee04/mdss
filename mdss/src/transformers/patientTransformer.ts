import crypto from 'crypto';

export function normalizePatient(patient: any){

    return{
        patientHash: crypto.createHash('sha256').update(patient.id).digest('hex'),
        sex: patient.sex || 'unknown',
        district: patient.district || null,
        region: patient.region || null,
        age: patient.age || null,
        createdAt: new Date(),
    };
}