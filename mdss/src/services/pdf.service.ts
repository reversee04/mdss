import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export class PDFService {
  generateReportPDF(data: any, config: any): Buffer {
    const doc = new jsPDF();

    // --- Title Page ---
    doc.setFontSize(20);
    doc.text(config.reportName || 'Surveillance Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    const filtersStr = data.filters
      ? Object.entries(data.filters).map(([k, v]) => `${k}: ${v || 'all'}`).join(', ')
      : 'None';
    doc.text(`Filters: ${filtersStr}`, 14, 38);

    let y = 50;

    // --- Encounter Statistics ---
    if (data.encounters) {
      doc.setFontSize(14);
      doc.text('Encounter Statistics', 14, y);
      autoTable(doc, {
        startY: y + 5,
        head: [['Metric', 'Value']],
        body: [
          ['Total Encounters', data.encounters.totalEncounters ?? 0],
          ['Average Duration (days)', Number(data.encounters.averageEncounterDuration ?? 0).toFixed(1)],
        ],
      });
      y = (doc as any).lastAutoTable.finalY + 15;
    }

    // --- Disease Distribution ---
    if (data.diseases?.topDiseases?.length) {
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.text('Disease Distribution', 14, y);
      autoTable(doc, {
        startY: y + 5,
        head: [['Disease', 'Cases']],
        body: data.diseases.topDiseases.map((d: any) => [d.disease, d.count]),
      });
      y = (doc as any).lastAutoTable.finalY + 15;
    }

    // --- Disease by District Breakdown ---
    if (Array.isArray(data.diseaseByDistrict) && data.diseaseByDistrict.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Disease by District Breakdown', 14, 20);
      autoTable(doc, {
        startY: 28,
        head: [['Disease', 'District', 'Total Cases', 'Recovered', 'Deaths', 'Ongoing', 'Unknown', 'Recovery %', 'Mortality %']],
        body: data.diseaseByDistrict.map((item: any) => [
          item.disease,
          item.district,
          item.total_cases,
          item.outcomes.recovered,
          item.outcomes.deaths,
          item.outcomes.ongoing,
          item.outcomes.unknown,
          `${item.recovery_rate}%`,
          `${item.mortality_rate}%`,
        ]),
        styles: { fontSize: 7 },
      });
    }

    // --- Outcome Statistics by Disease ---
    if (data.outcomeStatistics?.byDisease?.length) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Outcome Statistics by Disease', 14, 20);
      autoTable(doc, {
        startY: 28,
        head: [['Disease', 'Recovered', 'Deaths', 'Ongoing', 'Unknown', 'Tx Failure', 'LTFU', 'Recovery %', 'Mortality %']],
        body: data.outcomeStatistics.byDisease.map((item: any) => [
          item.label,
          item.recovered,
          item.deaths,
          item.ongoing,
          item.unknown,
          item.treatment_failure,
          item.lost_to_followup,
          `${item.recovery_rate}%`,
          `${item.mortality_rate}%`,
        ]),
        styles: { fontSize: 7 },
      });
    }

    // --- Outcome Statistics by District ---
    if (data.outcomeStatistics?.byDistrict?.length) {
      const finalY = (doc as any).lastAutoTable?.finalY ?? 20;
      const startY = finalY > 200 ? (doc.addPage(), 20) : finalY + 15;
      doc.setFontSize(14);
      doc.text('Outcome Statistics by District', 14, startY);
      autoTable(doc, {
        startY: startY + 8,
        head: [['District', 'Recovered', 'Deaths', 'Ongoing', 'Unknown', 'Recovery %', 'Mortality %']],
        body: data.outcomeStatistics.byDistrict.map((item: any) => [
          item.label,
          item.recovered,
          item.deaths,
          item.ongoing,
          item.unknown,
          `${item.recovery_rate}%`,
          `${item.mortality_rate}%`,
        ]),
        styles: { fontSize: 8 },
      });
    }

    // --- Case Fatality Rate ---
    if (data.caseFatalityRate?.byDisease && Object.keys(data.caseFatalityRate.byDisease).length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Case Fatality Rate (CFR) by Disease', 14, 20);
      autoTable(doc, {
        startY: 28,
        head: [['Disease', 'CFR (%)']],
        body: Object.entries(data.caseFatalityRate.byDisease).map(([d, rate]) => [d, `${rate}%`]),
      });
    }

    // --- Treatment Success Rate ---
    if (data.treatmentSuccessRate?.byDisease && Object.keys(data.treatmentSuccessRate.byDisease).length > 0) {
      const finalY = (doc as any).lastAutoTable?.finalY ?? 20;
      const startY = finalY > 200 ? (doc.addPage(), 20) : finalY + 15;
      doc.setFontSize(14);
      doc.text('Treatment Success Rate (TSR) by Disease', 14, startY);
      autoTable(doc, {
        startY: startY + 8,
        head: [['Disease', 'TSR (%)']],
        body: Object.entries(data.treatmentSuccessRate.byDisease).map(([d, rate]) => [d, `${rate}%`]),
      });
    }

    // --- Demographics ---
    if (data.demographics) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Demographics', 14, 20);

      const ageDist = data.demographics.ageDistribution;
      if (ageDist) {
        autoTable(doc, {
          startY: 28,
          head: [['Age Group', 'Count']],
          body: Object.entries(ageDist).map(([k, v]) => [k, v]),
        });
      }

      const genderBreakdown = data.demographics.genderBreakdown;
      if (genderBreakdown?.length) {
        const finalY = (doc as any).lastAutoTable?.finalY ?? 40;
        autoTable(doc, {
          startY: finalY + 10,
          head: [['Gender', 'Count']],
          body: genderBreakdown.map((g: any) => [g.sex, g._count?.sex ?? 0]),
        });
      }
    }

    const arrayBuffer = doc.output('arraybuffer');
    return Buffer.from(arrayBuffer);
  }
}
