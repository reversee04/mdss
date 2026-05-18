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
  const ratio = casesPer100k / threshold;
  
  if (ratio >= 2.0) return 'critical';
  if (ratio >= 1.5) return 'high';
  if (ratio >= 1.2) return 'medium';
  return 'low';
}

/**
 * Check if alert should be sent based on cooldown period
 */
async function shouldSendAlert(diseaseId: string): Promise<boolean> {
  const disease = await prisma.disease.findUnique({
    where: { disease_id: diseaseId },
    select: { last_alert_sent: true, alert_cooldown_hours: true },
  });

  if (!disease?.last_alert_sent) return true;

  const cooldownEnd = new Date(disease.last_alert_sent);
  cooldownEnd.setHours(cooldownEnd.getHours() + disease.alert_cooldown_hours);

  return new Date() > cooldownEnd;
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

  const encounters = await prisma.encounter.findMany({
    where: {
      disease_id: diseaseId,
      date_of_diagnosis: { gte: sevenDaysAgo },
      ...(district && { facility: { district } }),
    },
    include: { facility: true },
  });

  // Calculate population (simplified - should use actual population data)
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
): Promise<void> {
  if (!alertResult.shouldAlert) return;

  const canSend = await shouldSendAlert(diseaseId);
  if (!canSend) {
    console.log(`Alert cooldown active for disease ${diseaseId}`);
    return;
  }

  // Create alert record
  const disease = await prisma.disease.findUnique({
    where: { disease_id: diseaseId },
    select: { disease_name: true, alert_recipients: true },
  });

  if (!disease) return;

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
}

/**
 * Monitor all diseases for outbreak conditions
 */
export async function monitorAllDiseases(): Promise<void> {
  const allowedDiseaseIds = ['hiv', 'malaria', 'tb', 'cholera'];
  const diseases = await prisma.disease.findMany({
    where: { 
      monitoring_enabled: true,
      disease_id: { in: allowedDiseaseIds }
    },
    select: { disease_id: true },
  });

  for (const disease of diseases) {
    const result = await monitorDisease(disease.disease_id);
    if (result.shouldAlert) {
      await sendAlert(disease.disease_id, result);
    }
  }
}

/**
 * Get district population (placeholder - implement with actual data source)
 */
async function getDistrictPopulation(district?: string): Promise<number> {
  // TODO: Implement with actual population data from census or health ministry
  // For now, return a default value
  return 100000; // Default 100k population
}

/**
 * Send notifications via multiple channels
 */
async function sendNotifications(alert: any, recipients: string[]): Promise<void> {
  // TODO: Implement email notifications
  // TODO: Implement SMS notifications
  // TODO: Implement in-app notifications
  
  console.log(`Alert sent to ${recipients.length} recipients:`, alert.message);
}