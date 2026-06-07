import { prisma } from '@/lib/prisma';

interface AlertConfig {
  diseaseId: string;
  outbreakThreshold: number;
  warningThreshold: number;
  alertCooldownHours: number;
  alertRecipients: string[];
}

interface AlertResult {
  shouldAlert: boolean;
  alertType: 'warning' | 'outbreak' | 'none';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data: {
    currentCases: number;
    casesPer100k: number;
    threshold: number;
    population: number;
  };
}

interface MonitoringResult extends AlertResult {
  diseaseId: string;
  diseaseName: string;
  district?: string;
  region?: string;
  alertCreated?: boolean;
  alertId?: string;
}

const DISTRICT_POPULATION: Record<string, number> = {
  Balaka: 438000,
  Blantyre: 1450000,
  Chikwawa: 626000,
  Chiradzulu: 356000,
  Chitipa: 276000,
  Dedza: 943000,
  Karonga: 392000,
  Lilongwe: 2700000,
  Machinga: 771000,
  Mangochi: 1160000,
  Mulanje: 684000,
  Mzimba: 1070000,
  Nkhotakota: 395000,
  Nsanje: 333000,
  Phalombe: 449000,
  Salima: 478000,
  Thyolo: 721000,
  Zomba: 1050000,
};

const FOCUS_DISEASE_CODES = ['B20', 'B50', 'A15', 'A00'];
const FOCUS_DISEASE_NAMES = ['HIV/AIDS', 'Malaria', 'Malaria (P. falciparum)', 'Tuberculosis', 'Cholera'];
const FOCUS_DISEASE_SIMPLE_IDS = ['hiv', 'malaria', 'tb', 'cholera'];

/**
 * Calculate cases per 100,000 population
 */
function calculateCasesPer100k(cases: number, population: number): number {
  if (population === 0) return 0;
  return (cases / population) * 100000;
}

/**
 * Determine alert severity based on threshold breach
 */
function determineSeverity(casesPer100k: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
  if (threshold <= 0) return 'low';
  const ratio = casesPer100k / threshold;

  if (ratio >= 2.0) return 'critical';
  if (ratio >= 1.5) return 'high';
  if (ratio >= 1.2) return 'medium';
  return 'low';
}

/**
 * Check if alert should be sent based on cooldown period
 */
async function shouldCreateAlert(
  diseaseId: string,
  alertType: 'warning' | 'outbreak',
  cooldownHours: number,
  district?: string,
  region?: string
): Promise<boolean> {
  const activeDuplicate = await prisma.outbreakAlert.findFirst({
    where: {
      disease_id: diseaseId,
      alert_type: alertType,
      acknowledged: false,
      district: district || null,
      region: region || null,
    },
    select: { alert_id: true },
  });

  if (activeDuplicate) return false;

  const cooldownStart = new Date();
  cooldownStart.setHours(cooldownStart.getHours() - Math.max(cooldownHours, 0));

  const recentDuplicate = await prisma.outbreakAlert.findFirst({
    where: {
      disease_id: diseaseId,
      alert_type: alertType,
      district: district || null,
      region: region || null,
      sent_at: { gte: cooldownStart },
    },
    select: { alert_id: true },
  });

  return !recentDuplicate;
}

/**
 * Monitor disease for outbreak conditions
 */
export async function monitorDisease(diseaseId: string, district?: string): Promise<AlertResult> {
  const disease = await prisma.disease.findUnique({
    where: { disease_id: diseaseId },
    select: {
      disease_name: true,
      outbreak_threshold: true,
      warning_threshold: true,
      monitoring_enabled: true,
      alert_recipients: true,
      alert_cooldown_hours: true,
    },
  });

  if (!disease || !disease.monitoring_enabled) {
    return {
      shouldAlert: false,
      alertType: 'none',
      severity: 'low',
      message: 'Monitoring not enabled for this disease',
      data: { currentCases: 0, casesPer100k: 0, threshold: 0, population: 0 },
    };
  }

  // Get recent cases (last 7 days by default)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const encounters = await prisma.encounter.findMany({
    where: {
      disease_id: diseaseId,
      date_of_diagnosis: { gte: sevenDaysAgo },
      ...(district && { facility: { district: { equals: district, mode: 'insensitive' } } }),
    },
    include: { facility: true },
  });

  const population = await getDistrictPopulation(district);
  const currentCases = encounters.length;
  const casesPer100k = calculateCasesPer100k(currentCases, population);

  // Check thresholds
  const outbreakThreshold = disease.outbreak_threshold || 0;
  const warningThreshold = disease.warning_threshold || 0;

  let alertType: 'warning' | 'outbreak' | 'none' = 'none';
  let thresholdValue = 0;

  if (outbreakThreshold > 0 && casesPer100k >= outbreakThreshold) {
    alertType = 'outbreak';
    thresholdValue = outbreakThreshold;
  } else if (warningThreshold > 0 && casesPer100k >= warningThreshold) {
    alertType = 'warning';
    thresholdValue = warningThreshold;
  }

  const severity = alertType !== 'none'
    ? determineSeverity(casesPer100k, thresholdValue)
    : 'low';

  const message = alertType !== 'none'
    ? generateAlertMessage(disease.disease_name, alertType, casesPer100k, thresholdValue, district)
    : `${disease.disease_name} is within normal parameters`;

  return {
    shouldAlert: alertType !== 'none',
    alertType,
    severity,
    message,
    data: {
      currentCases,
      casesPer100k,
      threshold: thresholdValue,
      population,
    },
  };
}

/**
 * Generate human-readable alert message
 */
function generateAlertMessage(
  diseaseName: string,
  alertType: 'warning' | 'outbreak',
  casesPer100k: number,
  threshold: number,
  district?: string
): string {
  const location = district ? ` in ${district}` : '';
  const typeText = alertType === 'outbreak' ? 'OUTBREAK DETECTED' : 'WARNING - IMPENDING OUTBREAK';

  return `${typeText}: ${diseaseName}${location}. Current rate: ${casesPer100k.toFixed(1)} cases per 100k population. Threshold: ${threshold} cases per 100k.`;
}

/**
 * Send alert notification
 */
export async function sendAlert(
  diseaseId: string,
  alertResult: AlertResult,
  district?: string,
  region?: string
): Promise<{ created: boolean; alertId?: string; reason?: string }> {
  if (!alertResult.shouldAlert) return { created: false, reason: 'No threshold breach' };

  // Create alert record
  const disease = await prisma.disease.findUnique({
    where: { disease_id: diseaseId },
    select: { disease_name: true, alert_recipients: true, alert_cooldown_hours: true },
  });

  if (!disease) return { created: false, reason: 'Disease not found' };

  const canCreate = await shouldCreateAlert(
    diseaseId,
    alertResult.alertType === 'none' ? 'warning' : alertResult.alertType,
    disease.alert_cooldown_hours,
    district,
    region
  );

  if (!canCreate) {
    console.log(`Duplicate/cooldown active for ${diseaseId} ${alertResult.alertType} ${district || region || 'national'}`);
    return { created: false, reason: 'Duplicate active alert or cooldown period active' };
  }

  const alert = await prisma.outbreakAlert.create({
    data: {
      disease_id: diseaseId,
      alert_type: alertResult.alertType,
      severity: alertResult.severity,
      district,
      region,
      current_cases: alertResult.data.currentCases,
      threshold_value: alertResult.data.threshold,
      population: alertResult.data.population,
      cases_per_100k: alertResult.data.casesPer100k,
      message: alertResult.message,
    },
  });

  // Update last alert sent timestamp
  await prisma.disease.update({
    where: { disease_id: diseaseId },
    data: { last_alert_sent: new Date() },
  });

  // Send notifications (email, SMS, in-app)
  await sendNotifications(alert, disease.alert_recipients);
  return { created: true, alertId: alert.alert_id };
}

/**
 * Monitor all diseases for outbreak conditions
 */
export async function monitorAllDiseases(): Promise<MonitoringResult[]> {
  const diseases = await prisma.disease.findMany({
    where: {
      monitoring_enabled: true,
      OR: [
        { icd10Code: { in: FOCUS_DISEASE_CODES } },
        { disease_name: { in: FOCUS_DISEASE_NAMES } },
        { disease_id: { in: FOCUS_DISEASE_SIMPLE_IDS } },
      ],
    },
    select: { disease_id: true, disease_name: true },
  });

  const districts = await prisma.facility.findMany({
    distinct: ['district'],
    select: { district: true, region: true },
    orderBy: { district: 'asc' },
  });

  const results: MonitoringResult[] = [];

  for (const disease of diseases) {
    const nationalResult = await monitorDisease(disease.disease_id);
    const nationalMonitoringResult: MonitoringResult = {
      ...nationalResult,
      diseaseId: disease.disease_id,
      diseaseName: disease.disease_name,
    };

    if (nationalResult.shouldAlert) {
      const sendResult = await sendAlert(disease.disease_id, nationalResult);
      nationalMonitoringResult.alertCreated = sendResult.created;
      nationalMonitoringResult.alertId = sendResult.alertId;
    }
    results.push(nationalMonitoringResult);

    for (const district of districts) {
      const result = await monitorDisease(disease.disease_id, district.district);
      const monitoringResult: MonitoringResult = {
        ...result,
        diseaseId: disease.disease_id,
        diseaseName: disease.disease_name,
        district: district.district,
        region: district.region,
      };

      if (result.shouldAlert) {
        const sendResult = await sendAlert(disease.disease_id, result, district.district, district.region);
        monitoringResult.alertCreated = sendResult.created;
        monitoringResult.alertId = sendResult.alertId;
      }

      results.push(monitoringResult);
    }
  }

  return results;
}

export async function monitorDiseaseAcrossLocations(diseaseId: string): Promise<MonitoringResult[]> {
  const disease = await prisma.disease.findUnique({
    where: { disease_id: diseaseId },
    select: { disease_id: true, disease_name: true, monitoring_enabled: true },
  });

  if (!disease || !disease.monitoring_enabled) {
    const result = await monitorDisease(diseaseId);
    return [{
      ...result,
      diseaseId,
      diseaseName: disease?.disease_name || diseaseId,
    }];
  }

  const districts = await prisma.facility.findMany({
    distinct: ['district'],
    select: { district: true, region: true },
    orderBy: { district: 'asc' },
  });

  const checks: Array<{ district?: string; region?: string }> = [
    {},
    ...districts.map((district) => ({ district: district.district, region: district.region })),
  ];

  const results: MonitoringResult[] = [];

  for (const check of checks) {
    const result = await monitorDisease(diseaseId, check.district);
    const monitoringResult: MonitoringResult = {
      ...result,
      diseaseId,
      diseaseName: disease.disease_name,
      district: check.district,
      region: check.region,
    };

    if (result.shouldAlert) {
      const sendResult = await sendAlert(diseaseId, result, check.district, check.region);
      monitoringResult.alertCreated = sendResult.created;
      monitoringResult.alertId = sendResult.alertId;
    }

    results.push(monitoringResult);
  }

  return results;
}

/**
 * Get district population for threshold rate calculations.
 */
async function getDistrictPopulation(district?: string): Promise<number> {
  if (!district) {
    return Object.values(DISTRICT_POPULATION).reduce((sum, population) => sum + population, 0);
  }

  const districtKey = Object.keys(DISTRICT_POPULATION).find(
    (name) => name.toLowerCase() === district.toLowerCase()
  );

  return districtKey ? DISTRICT_POPULATION[districtKey] : 100000;
}

/**
 * Send notifications via multiple channels
 * Updated to focus on dashboard notifications instead of email/SMS
 */
async function sendNotifications(alert: any, recipients: string[]): Promise<void> {
  // Dashboard notifications are already handled by:
  // 1. Alert is stored in database via prisma.outbreakAlert.create()
  // 2. Dashboards fetch alerts via /api/alerts endpoint
  // 3. Navbar polls for unacknowledged alerts every 60 seconds
  // 4. Alerts page displays all alerts with filtering

  console.log(`Dashboard alert created: ${alert.alert_type} - ${alert.message}`);
  console.log(`Alert ID: ${alert.alert_id}, Severity: ${alert.severity}`);

  // Note: Email/SMS notifications can be added later if needed
  // For now, the system focuses on in-dashboard alert display
}
