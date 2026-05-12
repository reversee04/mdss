import crypto from 'crypto';

export function normalizePatient(patient: any){

    return{
        patientHash: crypto.createHash('sha256').update(patient.id).digest('hex'),
        sex: patient.sex || 'unknown',
        residenceDistrict: patient.district || null,
        residenceRegion: patient.region || null,
        ageBand: patient.age || null,
        createdAt: new Date(),
    };
}