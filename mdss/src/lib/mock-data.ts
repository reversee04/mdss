// Mock Data for Malawi Disease Surveillance System (MDSS)

export const diseases = [
  { id: 'hiv', name: 'HIV/AIDS', color: '#006cbf' },
  { id: 'malaria', name: 'Malaria', color: '#22c55e' },
  { id: 'tb', name: 'Tuberculosis', color: '#f59e0b' },
  { id: 'cholera', name: 'Cholera', color: '#ef4444' },
]

export const facilities = [
  { id: 'f1', name: 'Queen Elizabeth Central Hospital', district: 'Blantyre', type: 'Central Hospital' },
  { id: 'f2', name: 'Kamuzu Central Hospital', district: 'Lilongwe', type: 'Central Hospital' },
  { id: 'f3', name: 'Mzuzu Central Hospital', district: 'Mzimba', type: 'Central Hospital' },
  { id: 'f4', name: 'Zomba Central Hospital', district: 'Zomba', type: 'Central Hospital' },
  { id: 'f5', name: 'Mangochi District Hospital', district: 'Mangochi', type: 'District Hospital' },
  { id: 'f6', name: 'Dedza District Hospital', district: 'Dedza', type: 'District Hospital' },
  { id: 'f7', name: 'Salima District Hospital', district: 'Salima', type: 'District Hospital' },
  { id: 'f8', name: 'Karonga District Hospital', district: 'Karonga', type: 'District Hospital' },
  { id: 'f9', name: 'Nkhotakota Health Centre', district: 'Nkhotakota', type: 'Health Centre' },
  { id: 'f10', name: 'Chitipa Health Centre', district: 'Chitipa', type: 'Health Centre' },
]

export const districts = [
  'Lilongwe', 'Blantyre', 'Mzimba', 'Zomba', 'Mangochi', 'Dedza', 
  'Salima', 'Karonga', 'Nkhotakota', 'Chitipa', 'Machinga', 'Thyolo',
  'Mulanje', 'Phalombe', 'Chiradzulu', 'Nsanje', 'Chikwawa', 'Balaka'
]

export const regions = ['Northern', 'Central', 'Southern']

// Time series data for disease trends
export const generateTimeSeriesData = (months = 12) => {
  const data = []
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    data.push({
      date: date.toISOString().slice(0, 7),
      month: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
      hiv: Math.floor(Math.random() * 500) + 200,
      malaria: Math.floor(Math.random() * 2000) + 1000,
      tb: Math.floor(Math.random() * 300) + 100,
      cholera: Math.floor(Math.random() * 100) + 10,
    })
  }
  return data
}

// Overview statistics
export const overviewStats = {
  totalCases: 45672,
  totalDeaths: 1234,
  totalRecoveries: 38956,
  activeCases: 5482,
  facilitiesReporting: 847,
  totalFacilities: 892,
  recordsProcessed: 1245678,
  lastUpdated: new Date().toISOString(),
}

// Disease-specific statistics
export const diseaseStats = [
  {
    disease: 'HIV/AIDS',
    cases: 12450,
    deaths: 234,
    recoveries: 8500,
    activeCases: 3716,
    tsr: 85.2,
    cfr: 1.9,
    medianRecoveryDays: 180,
  },
  {
    disease: 'Malaria',
    cases: 28500,
    deaths: 456,
    recoveries: 26200,
    activeCases: 1844,
    tsr: 92.4,
    cfr: 1.6,
    medianRecoveryDays: 7,
  },
  {
    disease: 'Tuberculosis',
    cases: 3890,
    deaths: 489,
    recoveries: 3156,
    activeCases: 245,
    tsr: 81.5,
    cfr: 12.6,
    medianRecoveryDays: 180,
  },
  {
    disease: 'Cholera',
    cases: 832,
    deaths: 55,
    recoveries: 700,
    activeCases: 77,
    tsr: 89.5,
    cfr: 6.6,
    medianRecoveryDays: 5,
  },
]

// Regional distribution
export const regionalData = [
  { region: 'Northern', cases: 8500, deaths: 180, population: 2800000 },
  { region: 'Central', cases: 18200, deaths: 520, population: 7500000 },
  { region: 'Southern', cases: 18972, deaths: 534, population: 7200000 },
]

// Age distribution
export const ageDistribution = [
  { ageGroup: '0-4', cases: 4500, percentage: 9.8 },
  { ageGroup: '5-14', cases: 6200, percentage: 13.6 },
  { ageGroup: '15-24', cases: 9800, percentage: 21.5 },
  { ageGroup: '25-34', cases: 11200, percentage: 24.5 },
  { ageGroup: '35-44', cases: 7800, percentage: 17.1 },
  { ageGroup: '45-54', cases: 3900, percentage: 8.5 },
  { ageGroup: '55-64', cases: 1500, percentage: 3.3 },
  { ageGroup: '65+', cases: 772, percentage: 1.7 },
]

// Sex distribution
export const sexDistribution = [
  { sex: 'Male', cases: 21500, percentage: 47.1 },
  { sex: 'Female', cases: 24172, percentage: 52.9 },
]

// Treatment effectiveness data
export const treatmentData = [
  { treatment: 'ACT (Artemisinin-based)', disease: 'Malaria', successRate: 94.5, patientsCount: 15000 },
  { treatment: 'Quinine Injection', disease: 'Malaria', successRate: 88.2, patientsCount: 5200 },
  { treatment: 'ART First-line', disease: 'HIV/AIDS', successRate: 89.5, patientsCount: 8500 },
  { treatment: 'ART Second-line', disease: 'HIV/AIDS', successRate: 82.1, patientsCount: 2100 },
  { treatment: 'DOTS Standard', disease: 'Tuberculosis', successRate: 85.3, patientsCount: 2800 },
  { treatment: 'MDR-TB Regimen', disease: 'Tuberculosis', successRate: 72.5, patientsCount: 450 },
  { treatment: 'ORS + Antibiotics', disease: 'Cholera', successRate: 95.2, patientsCount: 720 },
  { treatment: 'IV Rehydration', disease: 'Cholera', successRate: 91.8, patientsCount: 110 },
]

// ETL Logs
export const etlLogs = [
  { id: 1, timestamp: '2024-01-15 08:30:00', source: 'QECH', status: 'success', records: 1250, duration: '2m 15s' },
  { id: 2, timestamp: '2024-01-15 08:32:00', source: 'KCH', status: 'success', records: 980, duration: '1m 45s' },
  { id: 3, timestamp: '2024-01-15 08:35:00', source: 'Mzuzu', status: 'failed', records: 0, duration: '0m 30s', error: 'Connection timeout' },
  { id: 4, timestamp: '2024-01-15 08:40:00', source: 'Zomba', status: 'success', records: 756, duration: '1m 20s' },
  { id: 5, timestamp: '2024-01-15 08:45:00', source: 'Mangochi', status: 'warning', records: 450, duration: '3m 10s', error: '15 records skipped' },
  { id: 6, timestamp: '2024-01-15 09:00:00', source: 'Dedza', status: 'success', records: 320, duration: '0m 55s' },
  { id: 7, timestamp: '2024-01-15 09:15:00', source: 'Salima', status: 'success', records: 280, duration: '0m 48s' },
  { id: 8, timestamp: '2024-01-15 09:30:00', source: 'Karonga', status: 'failed', records: 0, duration: '0m 15s', error: 'Authentication failed' },
]

// Users for admin management
export const users = [
  { id: 1, name: 'Dr. Grace Banda', email: 'g.banda@health.gov.mw', role: 'System Admin', status: 'active', lastLogin: '2024-01-15 10:30' },
  { id: 2, name: 'James Phiri', email: 'j.phiri@health.gov.mw', role: 'Data Analyst', status: 'active', lastLogin: '2024-01-15 09:45' },
  { id: 3, name: 'Mary Chirwa', email: 'm.chirwa@health.gov.mw', role: 'Epidemiologist', status: 'active', lastLogin: '2024-01-14 16:20' },
  { id: 4, name: 'Hon. Peter Kumwenda', email: 'p.kumwenda@ministry.gov.mw', role: 'Ministry Official', status: 'active', lastLogin: '2024-01-15 08:00' },
  { id: 5, name: 'Sarah Mwale', email: 's.mwale@health.gov.mw', role: 'Data Analyst', status: 'inactive', lastLogin: '2024-01-10 14:00' },
  { id: 6, name: 'Dr. Emmanuel Moyo', email: 'e.moyo@health.gov.mw', role: 'Epidemiologist', status: 'active', lastLogin: '2024-01-15 11:00' },
]

// Alerts
export const alerts = [
  {
    id: 1,
    title: 'Cholera Outbreak - Salima District',
    severity: 'critical',
    status: 'active',
    disease: 'Cholera',
    location: 'Salima',
    dateDetected: '2024-01-14',
    casesReported: 45,
    description: 'Unusual spike in cholera cases detected in Salima district. 45 cases reported in the last 48 hours.',
  },
  {
    id: 2,
    title: 'Malaria Surge - Mangochi',
    severity: 'high',
    status: 'active',
    disease: 'Malaria',
    location: 'Mangochi',
    dateDetected: '2024-01-13',
    casesReported: 230,
    description: 'Malaria cases 40% above seasonal average in Mangochi district.',
  },
  {
    id: 3,
    title: 'TB Treatment Compliance Drop',
    severity: 'medium',
    status: 'acknowledged',
    disease: 'Tuberculosis',
    location: 'Lilongwe',
    dateDetected: '2024-01-12',
    casesReported: 0,
    description: 'DOTS completion rate dropped to 72% in Lilongwe Central, below the 85% target.',
  },
  {
    id: 4,
    title: 'Data Quality Issue - Mzuzu',
    severity: 'low',
    status: 'escalated',
    disease: 'Multiple',
    location: 'Mzuzu',
    dateDetected: '2024-01-10',
    casesReported: 0,
    description: 'Missing demographic data in 12% of records from Mzuzu Central Hospital.',
  },
  {
    id: 5,
    title: 'HIV Testing Decline',
    severity: 'medium',
    status: 'active',
    disease: 'HIV/AIDS',
    location: 'National',
    dateDetected: '2024-01-11',
    casesReported: 0,
    description: 'HIV testing rates decreased by 15% compared to previous month nationally.',
  },
]

// Audit logs
export const auditLogs = [
  { id: 1, timestamp: '2024-01-15 11:30:00', user: 'Dr. Grace Banda', action: 'User Created', resource: 'Users', details: 'Created user account for Dr. John Tembo' },
  { id: 2, timestamp: '2024-01-15 11:15:00', user: 'James Phiri', action: 'Report Generated', resource: 'Reports', details: 'Generated monthly malaria report for December 2023' },
  { id: 3, timestamp: '2024-01-15 10:45:00', user: 'System', action: 'ETL Completed', resource: 'Data Pipeline', details: 'Successfully processed 4,250 records from 8 facilities' },
  { id: 4, timestamp: '2024-01-15 10:30:00', user: 'Mary Chirwa', action: 'Alert Acknowledged', resource: 'Alerts', details: 'Acknowledged TB compliance alert for Lilongwe' },
  { id: 5, timestamp: '2024-01-15 10:00:00', user: 'Hon. Peter Kumwenda', action: 'Report Exported', resource: 'Reports', details: 'Exported national summary report as PDF' },
  { id: 6, timestamp: '2024-01-15 09:45:00', user: 'Dr. Grace Banda', action: 'Settings Modified', resource: 'System Config', details: 'Updated alert threshold for cholera outbreak detection' },
  { id: 7, timestamp: '2024-01-15 09:30:00', user: 'System', action: 'Backup Completed', resource: 'Database', details: 'Daily backup completed successfully' },
  { id: 8, timestamp: '2024-01-15 08:00:00', user: 'System', action: 'System Started', resource: 'Application', details: 'Application services started after maintenance' },
]

// API Integration status
export const apiIntegrations = [
  { id: 1, name: 'DHIS2 Central', endpoint: 'https://dhis2.health.gov.mw/api', status: 'connected', lastSync: '2024-01-15 11:00', responseTime: '245ms' },
  { id: 2, name: 'OpenMRS - QECH', endpoint: 'https://openmrs.qech.mw/api', status: 'connected', lastSync: '2024-01-15 10:45', responseTime: '180ms' },
  { id: 3, name: 'OpenMRS - KCH', endpoint: 'https://openmrs.kch.mw/api', status: 'connected', lastSync: '2024-01-15 10:30', responseTime: '195ms' },
  { id: 4, name: 'OpenMRS - Mzuzu', endpoint: 'https://openmrs.mzuzu.mw/api', status: 'error', lastSync: '2024-01-14 23:15', responseTime: 'N/A', error: 'Connection refused' },
  { id: 5, name: 'Lab Information System', endpoint: 'https://lis.health.gov.mw/api', status: 'connected', lastSync: '2024-01-15 11:15', responseTime: '320ms' },
  { id: 6, name: 'SMS Gateway', endpoint: 'https://sms.health.gov.mw/api', status: 'degraded', lastSync: '2024-01-15 10:00', responseTime: '1.2s', error: 'High latency' },
]

// Patient records (de-identified)
export const patients = [
  {
    id: 'PT-2024-00001',
    age: 34,
    sex: 'Female',
    district: 'Lilongwe',
    facility: 'Kamuzu Central Hospital',
    disease: 'HIV/AIDS',
    diagnosisDate: '2023-06-15',
    status: 'On Treatment',
    events: [
      { date: '2023-06-15', type: 'Diagnosis', description: 'Initial HIV diagnosis' },
      { date: '2023-06-20', type: 'Treatment Start', description: 'Started ART first-line regimen' },
      { date: '2023-09-15', type: 'Follow-up', description: 'Viral load: 500 copies/ml' },
      { date: '2023-12-15', type: 'Follow-up', description: 'Viral load: <50 copies/ml - Suppressed' },
    ],
    anomaly: false,
  },
  {
    id: 'PT-2024-00002',
    age: 5,
    sex: 'Male',
    district: 'Mangochi',
    facility: 'Mangochi District Hospital',
    disease: 'Malaria',
    diagnosisDate: '2024-01-10',
    status: 'Recovered',
    events: [
      { date: '2024-01-10', type: 'Diagnosis', description: 'Severe malaria, P. falciparum' },
      { date: '2024-01-10', type: 'Admission', description: 'Admitted to pediatric ward' },
      { date: '2024-01-12', type: 'Treatment', description: 'IV Artesunate administered' },
      { date: '2024-01-15', type: 'Discharge', description: 'Discharged, full recovery' },
    ],
    anomaly: false,
  },
  {
    id: 'PT-2024-00003',
    age: 45,
    sex: 'Male',
    district: 'Blantyre',
    facility: 'Queen Elizabeth Central Hospital',
    disease: 'Tuberculosis',
    diagnosisDate: '2023-10-01',
    status: 'On Treatment',
    events: [
      { date: '2023-10-01', type: 'Diagnosis', description: 'Pulmonary TB confirmed (GeneXpert+)' },
      { date: '2023-10-05', type: 'Treatment Start', description: 'Started DOTS intensive phase' },
      { date: '2024-01-05', type: 'Follow-up', description: 'Sputum conversion achieved' },
    ],
    anomaly: true,
    anomalyReason: 'HIV co-infection suspected - recommend testing',
  },
  {
    id: 'PT-2024-00004',
    age: 28,
    sex: 'Female',
    district: 'Salima',
    facility: 'Salima District Hospital',
    disease: 'Cholera',
    diagnosisDate: '2024-01-14',
    status: 'Admitted',
    events: [
      { date: '2024-01-14', type: 'Diagnosis', description: 'Acute watery diarrhea, cholera suspected' },
      { date: '2024-01-14', type: 'Admission', description: 'Admitted to cholera treatment unit' },
      { date: '2024-01-14', type: 'Treatment', description: 'ORS and IV rehydration started' },
    ],
    anomaly: true,
    anomalyReason: 'Part of Salima outbreak cluster',
  },
  {
    id: 'PT-2024-00005',
    age: 62,
    sex: 'Male',
    district: 'Zomba',
    facility: 'Zomba Central Hospital',
    disease: 'HIV/AIDS',
    diagnosisDate: '2020-03-10',
    status: 'Treatment Failure',
    events: [
      { date: '2020-03-10', type: 'Diagnosis', description: 'HIV diagnosis, late-stage' },
      { date: '2020-03-15', type: 'Treatment Start', description: 'Started ART first-line' },
      { date: '2022-06-20', type: 'Follow-up', description: 'Viral load: 15,000 copies/ml' },
      { date: '2022-07-01', type: 'Regimen Change', description: 'Switched to ART second-line' },
      { date: '2024-01-10', type: 'Follow-up', description: 'Viral load: 8,500 copies/ml' },
    ],
    anomaly: true,
    anomalyReason: 'Treatment failure - consider resistance testing',
  },
]

// System health metrics
export const systemHealth = {
  cpu: 45,
  memory: 62,
  disk: 38,
  uptime: '15 days, 8 hours',
  lastBackup: '2024-01-15 03:00',
  databaseSize: '24.5 GB',
  activeConnections: 127,
}

// Notifications for admin
export const systemNotifications = [
  { id: 1, type: 'error', title: 'ETL Pipeline Failed', message: 'Mzuzu data sync failed - Connection timeout', time: '2 hours ago', read: false },
  { id: 2, type: 'warning', title: 'High Memory Usage', message: 'Memory usage exceeded 80% threshold', time: '4 hours ago', read: false },
  { id: 3, type: 'info', title: 'Backup Completed', message: 'Daily backup completed successfully', time: '8 hours ago', read: true },
  { id: 4, type: 'error', title: 'API Integration Error', message: 'OpenMRS Mzuzu connection refused', time: '12 hours ago', read: true },
  { id: 5, type: 'success', title: 'System Update', message: 'Security patches applied successfully', time: '1 day ago', read: true },
]

// Report configurations
export const savedReports = [
  { id: 1, name: 'Monthly Malaria Summary', disease: 'Malaria', frequency: 'Monthly', lastRun: '2024-01-01', createdBy: 'James Phiri' },
  { id: 2, name: 'HIV Treatment Outcomes Q4', disease: 'HIV/AIDS', frequency: 'Quarterly', lastRun: '2024-01-01', createdBy: 'Dr. Grace Banda' },
  { id: 3, name: 'National Disease Overview', disease: 'All', frequency: 'Weekly', lastRun: '2024-01-14', createdBy: 'Hon. Peter Kumwenda' },
  { id: 4, name: 'TB DOTS Performance', disease: 'Tuberculosis', frequency: 'Monthly', lastRun: '2024-01-01', createdBy: 'Mary Chirwa' },
]

// Heatmap data for regional distribution
export const districtHeatmapData = [
  { district: 'Lilongwe', cases: 5200, severity: 'high' },
  { district: 'Blantyre', cases: 4800, severity: 'high' },
  { district: 'Mzimba', cases: 2100, severity: 'medium' },
  { district: 'Zomba', cases: 1900, severity: 'medium' },
  { district: 'Mangochi', cases: 3500, severity: 'high' },
  { district: 'Dedza', cases: 1200, severity: 'medium' },
  { district: 'Salima', cases: 1800, severity: 'medium' },
  { district: 'Karonga', cases: 950, severity: 'low' },
  { district: 'Nkhotakota', cases: 780, severity: 'low' },
  { district: 'Chitipa', cases: 420, severity: 'low' },
  { district: 'Machinga', cases: 2200, severity: 'medium' },
  { district: 'Thyolo', cases: 1650, severity: 'medium' },
  { district: 'Mulanje', cases: 1400, severity: 'medium' },
  { district: 'Phalombe', cases: 890, severity: 'low' },
  { district: 'Chiradzulu', cases: 720, severity: 'low' },
  { district: 'Nsanje', cases: 1100, severity: 'medium' },
  { district: 'Chikwawa', cases: 1350, severity: 'medium' },
  { district: 'Balaka', cases: 980, severity: 'low' },
]
