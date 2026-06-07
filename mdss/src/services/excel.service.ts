import * as XLSX from 'xlsx';

export class ExcelService {
  generateReportExcel(data: any, config: any): Buffer {
    const workbook = XLSX.utils.book_new();

    // --- Summary Sheet ---
    const summaryData = [
      ['Report Name', config.reportName || 'Report'],
      ['Generated', new Date().toISOString()],
      ['Filters', data.filters ? Object.entries(data.filters).map(([k, v]) => `${k}: ${v || 'all'}`).join(', ') : 'None'],
      [''],
      ['Total Encounters', data.encounters?.totalEncounters || 0],
      ['Average Duration (days)', Number(data.encounters?.averageEncounterDuration ?? 0).toFixed(1)],
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryData), 'Summary');

    // --- Disease Distribution ---
    if (data.diseases?.topDiseases?.length) {
      const diseaseData = [
        ['Disease', 'Count'],
        ...data.diseases.topDiseases.map((d: any) => [d.disease, d.count]),
      ];
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(diseaseData), 'Diseases');
    }

    // --- Disease by District Breakdown ---
    if (Array.isArray(data.diseaseByDistrict) && data.diseaseByDistrict.length > 0) {
      const diseaseDistrictData = [
        ['Disease', 'District', 'Total Cases', 'Recovered', 'Deaths', 'Ongoing', 'Unknown', 'Recovery Rate (%)', 'Mortality Rate (%)'],
        ...data.diseaseByDistrict.map((item: any) => [
          item.disease,
          item.district,
          item.total_cases,
          item.outcomes.recovered,
          item.outcomes.deaths,
          item.outcomes.ongoing,
          item.outcomes.unknown,
          item.recovery_rate,
          item.mortality_rate,
        ]),
      ];
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(diseaseDistrictData), 'Disease by District');
    }

    // --- Outcome Statistics by Disease ---
    if (data.outcomeStatistics?.byDisease?.length) {
      const diseaseOutcomeData = [
        ['Disease', 'Recovered', 'Deaths', 'Ongoing', 'Unknown', 'Treatment Failure', 'Lost to Follow-up', 'Recovery Rate (%)', 'Mortality Rate (%)'],
        ...data.outcomeStatistics.byDisease.map((item: any) => [
          item.label,
          item.recovered,
          item.deaths,
          item.ongoing,
          item.unknown,
          item.treatment_failure,
          item.lost_to_followup,
          item.recovery_rate,
          item.mortality_rate,
        ]),
      ];
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(diseaseOutcomeData), 'Outcomes by Disease');
    }

    // --- Outcome Statistics by District ---
    if (data.outcomeStatistics?.byDistrict?.length) {
      const districtOutcomeData = [
        ['District', 'Recovered', 'Deaths', 'Ongoing', 'Unknown', 'Recovery Rate (%)', 'Mortality Rate (%)'],
        ...data.outcomeStatistics.byDistrict.map((item: any) => [
          item.label,
          item.recovered,
          item.deaths,
          item.ongoing,
          item.unknown,
          item.recovery_rate,
          item.mortality_rate,
        ]),
      ];
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(districtOutcomeData), 'Outcomes by District');
    }

    // --- Outcome Statistics by Facility ---
    if (data.outcomeStatistics?.byFacility?.length) {
      const facilityOutcomeData = [
        ['Facility', 'Recovered', 'Deaths', 'Ongoing', 'Unknown', 'Recovery Rate (%)', 'Mortality Rate (%)'],
        ...data.outcomeStatistics.byFacility.map((item: any) => [
          item.label,
          item.recovered,
          item.deaths,
          item.ongoing,
          item.unknown,
          item.recovery_rate,
          item.mortality_rate,
        ]),
      ];
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(facilityOutcomeData), 'Outcomes by Facility');
    }

    // --- Case Fatality Rate ---
    if (data.caseFatalityRate?.byDisease && Object.keys(data.caseFatalityRate.byDisease).length > 0) {
      const cfrData = [
        ['Disease', 'CFR (%)'],
        ...Object.entries(data.caseFatalityRate.byDisease).map(([d, rate]) => [d, rate]),
      ];
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(cfrData), 'Case Fatality Rate');
    }

    // --- Treatment Success Rate ---
    if (data.treatmentSuccessRate?.byDisease && Object.keys(data.treatmentSuccessRate.byDisease).length > 0) {
      const tsrData = [
        ['Disease', 'TSR (%)'],
        ...Object.entries(data.treatmentSuccessRate.byDisease).map(([d, rate]) => [d, rate]),
      ];
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(tsrData), 'Treatment Success Rate');
    }

    // --- Age Distribution ---
    if (data.demographics?.ageDistribution) {
      const ageData = [
        ['Age Group', 'Count'],
        ...Object.entries(data.demographics.ageDistribution).map(([group, count]) => [group, count]),
      ];
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(ageData), 'Age Distribution');
    }

    // --- Gender Distribution ---
    if (data.demographics?.genderBreakdown?.length) {
      const genderData = [
        ['Gender', 'Count'],
        ...data.demographics.genderBreakdown.map((g: any) => [g.sex, g._count?.sex ?? 0]),
      ];
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(genderData), 'Gender Distribution');
    }

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    return excelBuffer;
  }
}
