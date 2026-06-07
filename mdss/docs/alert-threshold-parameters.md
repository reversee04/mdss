# Alert Threshold Parameters

## Overview

This document explains the parameters and conditions that must be met for the alert threshold system to work correctly in the MDSS application.

## Alert System Architecture

The alert system monitors disease cases and triggers alerts when thresholds are breached. It operates at two levels:
- **National level**: Monitors cases across the entire country
- **District level**: Monitors cases within specific districts

## Required Parameters

### 1. Disease-Level Configuration Parameters

These parameters are stored in the `Disease` table and must be configured for each disease:

#### `monitoring_enabled` (Boolean)
- **Purpose**: Enable or disable monitoring for a specific disease
- **Default**: `true`
- **Required**: Yes - if set to `false`, no alerts will be generated for this disease
- **Example**: `true`

#### `outbreak_threshold` (Integer)
- **Purpose**: The threshold (in cases per 100,000 population) that triggers an OUTBREAK alert
- **Default**: `0`
- **Required**: Yes - if set to `0` or `null`, outbreak alerts will not be triggered
- **Unit**: Cases per 100,000 population
- **Example**: `50` (means 50 cases per 100k population triggers outbreak)
- **Note**: This is the higher threshold - used for serious outbreaks

#### `warning_threshold` (Integer)
- **Purpose**: The threshold (in cases per 100,000 population) that triggers a WARNING alert
- **Default**: `0`
- **Required**: Yes - if set to `0` or `null`, warning alerts will not be triggered
- **Unit**: Cases per 100,000 population
- **Example**: `30` (means 30 cases per 100k population triggers warning)
- **Note**: This is the lower threshold - used for early warning

#### `alert_cooldown_hours` (Integer)
- **Purpose**: Minimum number of hours to wait before sending another alert for the same disease/location
- **Default**: `24`
- **Required**: No
- **Unit**: Hours
- **Example**: `24` (means wait 24 hours before sending another alert)
- **Behavior**: 
  - Prevents alert spam
  - Won't create alert if an unacknowledged alert exists
  - Won't create alert if one was sent within this period

#### `alert_recipients` (String Array)
- **Purpose**: List of email addresses to receive alert notifications
- **Default**: `[]` (empty array)
- **Required**: No
- **Example**: `["admin@example.com", "epidemiologist@example.com"]`
- **Note**: Currently used for future email/SMS notifications

### 2. Data Parameters

#### Case Count Window
- **Fixed Parameter**: 7 days
- **Purpose**: The time window for counting cases
- **Calculation**: Counts all encounters with `date_of_diagnosis` in the last 7 days
- **Example**: If today is June 7, counts cases from June 1 to June 7

#### Population Data
- **Purpose**: Used to calculate cases per 100,000 population
- **Source**: Hardcoded district populations in `alert.service.ts`
- **District Populations**:
  - Balaka: 438,000
  - Blantyre: 1,450,000
  - Chikwawa: 626,000
  - Chiradzulu: 356,000
  - Chitipa: 276,000
  - Dedza: 943,000
  - Karonga: 392,000
  - Lilongwe: 2,700,000
  - Machinga: 771,000
  - Mangochi: 1,160,000
  - Mulanje: 684,000
  - Mzimba: 1,070,000
  - Nkhotakota: 395,000
  - Nsanje: 333,000
  - Phalombe: 449,000
  - Salima: 478,000
  - Thyolo: 721,000
  - Zomba: 1,050,000
- **National Population**: Sum of all districts (~19,000,000)
- **Fallback**: If district not found, uses 100,000 as default

### 3. Calculation Parameters

#### Cases per 100k Formula
```
casesPer100k = (currentCases / population) * 100,000
```

**Example Calculation**:
- Current cases in last 7 days: 150
- District population: 1,000,000
- Cases per 100k = (150 / 1,000,000) * 100,000 = 15

### 4. Alert Triggering Logic

#### Alert Type Determination
The system checks thresholds in this order:

1. **Outbreak Alert**:
   - Condition: `casesPer100k >= outbreak_threshold`
   - Severity: Based on ratio (see below)
   - Example: If outbreak_threshold = 50 and casesPer100k = 60 → OUTBREAK

2. **Warning Alert**:
   - Condition: `casesPer100k >= warning_threshold` AND `casesPer100k < outbreak_threshold`
   - Severity: Based on ratio (see below)
   - Example: If warning_threshold = 30 and casesPer100k = 35 → WARNING

3. **No Alert**:
   - Condition: `casesPer100k < warning_threshold`
   - Example: If warning_threshold = 30 and casesPer100k = 25 → NO ALERT

#### Severity Determination
Severity is calculated based on the ratio of actual cases to threshold:

```
ratio = casesPer100k / threshold
```

| Ratio Range | Severity |
|-------------|----------|
| ratio >= 2.0 | Critical |
| ratio >= 1.5 | High |
| ratio >= 1.2 | Medium |
| ratio < 1.2 | Low |

**Examples**:
- Threshold = 50, Actual = 120 → ratio = 2.4 → Critical
- Threshold = 50, Actual = 80 → ratio = 1.6 → High
- Threshold = 50, Actual = 60 → ratio = 1.2 → Medium
- Threshold = 50, Actual = 55 → ratio = 1.1 → Low

### 5. Cooldown Logic

The system prevents duplicate alerts through two mechanisms:

#### Active Alert Check
- Checks if there's an unacknowledged alert for the same:
  - Disease
  - Alert type (warning/outbreak)
  - District/region
- If found: No new alert created

#### Cooldown Period Check
- Checks if an alert was sent within the last `alert_cooldown_hours`
- If found: No new alert created
- Example: If cooldown = 24 hours and alert sent 5 hours ago → No new alert

### 6. Focused Diseases

The system only monitors diseases that match one of these criteria:

#### By ICD-10 Code
- B20 (HIV/AIDS)
- B50 (Malaria)
- A15 (Tuberculosis)
- A00 (Cholera)

#### By Disease Name
- HIV/AIDS
- Malaria
- Malaria (P. falciparum)
- Tuberculosis
- Cholera

#### By Simple ID
- hiv
- malaria
- tb
- cholera

**Note**: Diseases not in this list will not be monitored even if thresholds are configured.

## Complete Alert Triggering Flow

```
1. Check if disease is in focused diseases list
   ↓ No → Skip monitoring
   ↓ Yes → Continue

2. Check if monitoring_enabled = true
   ↓ No → Skip monitoring
   ↓ Yes → Continue

3. Count cases in last 7 days for disease (and district if specified)
   ↓

4. Get population (district or national)
   ↓

5. Calculate casesPer100k = (cases / population) * 100,000
   ↓

6. Check outbreak_threshold
   ↓ If casesPer100k >= outbreak_threshold → OUTBREAK alert
   ↓ Else continue

7. Check warning_threshold
   ↓ If casesPer100k >= warning_threshold → WARNING alert
   ↓ Else → NO ALERT

8. If alert type determined:
   - Check for active unacknowledged alert
   - Check cooldown period
   - If both clear → Create alert
   - If either blocked → Skip alert creation

9. If alert created:
   - Store in database
   - Update last_alert_sent timestamp
   - Send notifications (dashboard, email, SMS)
```

## Example Scenarios

### Scenario 1: Outbreak Alert Triggered
**Configuration**:
- Disease: Malaria
- outbreak_threshold: 50
- warning_threshold: 30
- monitoring_enabled: true
- alert_cooldown_hours: 24

**Data**:
- Cases in last 7 days: 600
- District: Lilongwe (population: 2,700,000)

**Calculation**:
- casesPer100k = (600 / 2,700,000) * 100,000 = 22.2
- 22.2 < 30 (warning_threshold) → NO ALERT

**Result**: No alert (threshold not met)

---

### Scenario 2: Outbreak Alert Triggered
**Configuration**:
- Disease: Cholera
- outbreak_threshold: 50
- warning_threshold: 30
- monitoring_enabled: true
- alert_cooldown_hours: 24

**Data**:
- Cases in last 7 days: 1,500
- District: Zomba (population: 1,050,000)

**Calculation**:
- casesPer100k = (1,500 / 1,050,000) * 100,000 = 142.9
- 142.9 >= 50 (outbreak_threshold) → OUTBREAK alert
- ratio = 142.9 / 50 = 2.86 → Critical severity

**Result**: OUTBREAK alert created with Critical severity

---

### Scenario 3: Warning Alert Triggered
**Configuration**:
- Disease: Tuberculosis
- outbreak_threshold: 50
- warning_threshold: 30
- monitoring_enabled: true
- alert_cooldown_hours: 24

**Data**:
- Cases in last 7 days: 400
- District: Blantyre (population: 1,450,000)

**Calculation**:
- casesPer100k = (400 / 1,450,000) * 100,000 = 27.6
- 27.6 < 50 (outbreak_threshold)
- 27.6 < 30 (warning_threshold) → NO ALERT

**Result**: No alert (threshold not met)

---

### Scenario 4: Warning Alert Triggered
**Configuration**:
- Disease: Tuberculosis
- outbreak_threshold: 50
- warning_threshold: 20
- monitoring_enabled: true
- alert_cooldown_hours: 24

**Data**:
- Cases in last 7 days: 400
- District: Blantyre (population: 1,450,000)

**Calculation**:
- casesPer100k = (400 / 1,450,000) * 100,000 = 27.6
- 27.6 < 50 (outbreak_threshold)
- 27.6 >= 20 (warning_threshold) → WARNING alert
- ratio = 27.6 / 20 = 1.38 → High severity

**Result**: WARNING alert created with High severity

---

### Scenario 5: Alert Blocked by Cooldown
**Configuration**:
- Disease: Cholera
- outbreak_threshold: 50
- warning_threshold: 30
- monitoring_enabled: true
- alert_cooldown_hours: 24

**Data**:
- Cases in last 7 days: 1,500
- District: Zomba (population: 1,050,000)
- Previous alert sent: 5 hours ago

**Calculation**:
- casesPer100k = 142.9
- 142.9 >= 50 → OUTBREAK alert
- Check cooldown: 5 hours < 24 hours → BLOCKED

**Result**: No alert created (cooldown period active)

---

### Scenario 6: Monitoring Disabled
**Configuration**:
- Disease: Malaria
- outbreak_threshold: 50
- warning_threshold: 30
- monitoring_enabled: false
- alert_cooldown_hours: 24

**Data**:
- Cases in last 7 days: 10,000
- District: Lilongwe (population: 2,700,000)

**Calculation**:
- casesPer100k = 370.4
- 370.4 >= 50 → Would be OUTBREAK
- But monitoring_enabled = false → SKIP

**Result**: No alert (monitoring disabled)

## Common Issues and Troubleshooting

### Issue 1: Alerts Not Triggering
**Possible Causes**:
1. `monitoring_enabled` is `false` for the disease
2. Thresholds are set to `0` or `null`
3. Disease is not in the focused diseases list
4. Cases are not being recorded in the last 7 days
5. Population data is incorrect
6. Cooldown period is blocking new alerts

**Troubleshooting Steps**:
1. Check disease configuration in database
2. Verify thresholds are set to meaningful values
3. Ensure disease is in focused diseases list
4. Check if encounters exist in the last 7 days
5. Verify district population data
6. Check for existing unacknowledged alerts
7. Check last_alert_sent timestamp

### Issue 2: Too Many Alerts
**Possible Causes**:
1. Thresholds are set too low
2. Cooldown period is too short
3. Alerts are not being acknowledged

**Solutions**:
1. Increase threshold values
2. Increase `alert_cooldown_hours`
3. Acknowledge alerts in the dashboard

### Issue 3: Alerts Not Showing in Dashboard
**Possible Causes**:
1. Alerts are being created but not fetched
2. API endpoint is not working
3. Frontend is not polling for alerts

**Troubleshooting Steps**:
1. Check database for alert records
2. Verify `/api/alerts` endpoint is working
3. Check browser console for errors
4. Verify polling interval (should be every 60 seconds)

## Database Schema Reference

### Disease Table
```prisma
model Disease {
  disease_id          String   @id @default(uuid())
  icd10Code           String?  @unique
  disease_name        String
  
  // Alert threshold settings
  outbreak_threshold   Int?     @default(0)      // Cases per 100k
  warning_threshold    Int?     @default(0)      // Cases per 100k
  monitoring_enabled   Boolean  @default(true)
  alert_recipients     String[] @default([])
  last_alert_sent      DateTime?
  alert_cooldown_hours Int      @default(24)
  
  outbreak_alerts      OutbreakAlert[]
}
```

### OutbreakAlert Table
```prisma
model OutbreakAlert {
  alert_id           String   @id
  disease_id         String
  alert_type         String   // 'warning' or 'outbreak'
  severity           String   // 'low', 'medium', 'high', 'critical'
  district           String?
  region             String?
  current_cases      Int
  threshold_value    Int
  population         Int
  cases_per_100k     Float
  message            String
  sent_at            DateTime @default(now())
  acknowledged       Boolean  @default(false)
  acknowledged_by    String?
  acknowledged_at    DateTime?
  
  disease            Disease  @relation(fields: [disease_id], references: [disease_id])
}
```

## API Endpoints

### GET /api/alerts
Fetch all alerts with optional filtering

### GET /api/alerts/statistics
Get alert statistics and metrics

### POST /api/alerts/trigger-monitoring
Manually trigger the monitoring process

### POST /api/alerts/[alertId]/acknowledge
Acknowledge an alert

### GET /api/alerts/monitor
Monitor a specific disease

## Recommended Threshold Values

Based on WHO guidelines and epidemiological standards:

### Cholera
- Warning threshold: 10 cases per 100k
- Outbreak threshold: 30 cases per 100k
- Cooldown: 24 hours

### Malaria
- Warning threshold: 50 cases per 100k
- Outbreak threshold: 100 cases per 100k
- Cooldown: 24 hours

### Tuberculosis
- Warning threshold: 20 cases per 100k
- Outbreak threshold: 50 cases per 100k
- Cooldown: 48 hours

### HIV/AIDS
- Warning threshold: 15 cases per 100k
- Outbreak threshold: 30 cases per 100k
- Cooldown: 48 hours

**Note**: These values should be adjusted based on local epidemiological context and baseline incidence rates.
