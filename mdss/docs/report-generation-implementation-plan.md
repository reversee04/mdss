# Report Generation and Downloading Implementation Plan

## Overview

This document outlines the implementation plan for making report generation and downloading fully functional in the MDSS application.

## Current State

### Existing Functionality
- **API Endpoint**: `/api/reports`
  - POST: Generate reports (CSV and JSON formats)
  - GET: Get saved reports for a user
  - CSV generation includes: demographics, diseases, outcomes, encounters, facilities, trends
- **Frontend Page**: `/app/reports/page.tsx`
  - Report generation with filters (disease, location, time range)
  - Chart preview (line, bar, pie charts)
  - Export options (CSV, PDF via print window)
  - Saved reports tab with mock data
  - Report configuration dialog (not functional)

### Database Schema
- **Report Model**: `report_id`, `user_id`, `analysis_id`, `report_type`, `filters_used`, `generated_at`, `file_path`
- **Analysis Model**: `analysis_id`, `treatment_id`, `encounter_id`

### Gaps Identified
1. PDF generation is basic (opens print window, not true PDF)
2. No proper PDF library integration
3. No report template saving functionality
4. No scheduled report generation
5. No report sharing/collaboration
6. No advanced formatting options
7. No report history/versioning
8. No email delivery of reports
9. Saved reports tab uses mock data, not real database data
10. No report configuration persistence
11. No report scheduling/automation
12. No report templates management
13. **No disease-by-district breakdown in reports**
14. **No detailed case outcome statistics**
15. **No comprehensive outcome statistics by disease/district**
16. **Filter adjustments not fully integrated with report generation**

## Implementation Plan

### Phase 0: Enhanced Data Structure for Granular Statistics

#### 0.1 Disease-by-District Breakdown
Reports must include detailed breakdowns showing:
- **Each disease by each district**: Cross-tabulation of diseases across all districts
- **Case counts per disease-district combination**: Total cases for each disease in each district
- **Outcome breakdown by disease-district**: For each disease in each district, show:
  - Recovered cases
  - Deaths
  - Ongoing cases
  - Unknown outcomes
  - Recovery rate
  - Mortality rate
- **Time series by disease-district**: Trends over time for each disease in each district

#### 0.2 Comprehensive Outcome Statistics
Reports must include:
- **All outcome types**: Recovered, Deaths, Ongoing, Unknown, Treatment Failure, Lost to Follow-up
- **Outcome breakdown by disease**: For each disease, show all outcome types with counts and percentages
- **Outcome breakdown by district**: For each district, show all outcome types with counts and percentages
- **Outcome breakdown by facility**: For each facility, show all outcome types
- **Outcome trends over time**: How outcomes change over the selected time period
- **Case Fatality Rate (CFR)**: By disease, by district, by facility
- **Treatment Success Rate (TSR)**: By disease, by district, by facility

#### 0.3 Filter Integration
All filter adjustments must work correctly in report generation:
- **Disease filter**: When a specific disease is selected, reports show only that disease's data
- **District filter**: When a district is selected, reports show only that district's data
- **Facility filter**: When a facility is selected, reports show only that facility's data
- **Date range filter**: Reports respect the selected date range for all statistics
- **Time range filter**: Quick selections (7 days, 30 days, 90 days, etc.) work correctly
- **Combined filters**: Multiple filters work together (e.g., Malaria in Lilongwe district for last 30 days)

### Phase 1: Database Schema Updates

#### 1.1 Add ReportTemplate Table
```prisma
model ReportTemplate {
  id                String   @id @default(cuid())
  template_name     String   @unique @db.VarChar(200)
  user_id           String
  user              User     @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  
  // Configuration
  report_type       String   @db.VarChar(50) // surveillance, outbreak, compliance, custom
  filters           Json     // Stored as JSON object
  chart_config      Json     // Chart type, colors, layout
  export_format     String   @default("csv") // csv, pdf, excel, json
  
  // Scheduling
  schedule_enabled  Boolean  @default(false)
  schedule_frequency String?  // daily, weekly, monthly, quarterly
  schedule_day      Int?     // Day of week/month
  schedule_time     String?  @db.VarChar(10) // HH:MM format
  next_run          DateTime?
  last_run          DateTime?
  
  // Sharing
  is_public         Boolean  @default(false)
  shared_with       String[] @default([]) // Array of user_ids
  
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  
  generated_reports GeneratedReport[]
}

model GeneratedReport {
  id                String   @id @default(cuid())
  template_id       String?
  template          ReportTemplate? @relation(fields: [template_id], references: [template_id], onDelete: SetNull)
  user_id           String
  user              User     @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  
  // Report Details
  report_name       String   @db.VarChar(200)
  report_type       String   @db.VarChar(50)
  file_path         String   @db.VarChar(500)
  file_size         BigInt
  format            String   @db.VarChar(20) // csv, pdf, excel, json
  
  // Metadata
  filters_used      Json
  generated_at      DateTime @default(now())
  expires_at        DateTime?
  
  // Statistics
  download_count    Int      @default(0)
  last_downloaded   DateTime?
  
  created_at        DateTime @default(now())
}
```

#### 1.2 Update User Model
```prisma
model User {
  user_id       String     @id @db.VarChar(50)
  name          String     @db.VarChar(100)
  email         String     @unique @db.VarChar(100)
  password_hash String     @db.VarChar(255)
  role          String     @db.VarChar(50)
  status        String     @default("active") @db.VarChar(20)
  last_login    DateTime?
  created_at    DateTime   @default(now())
  updated_at    DateTime   @updatedAt
  reports       Report[]
  audit_logs    AuditLog[]
  settings      UserSettings?
  notifications  NotificationPreferences?
  report_templates ReportTemplate[]
  generated_reports GeneratedReport[]
}
```

### Phase 2: API Endpoints

#### 2.1 Report Template APIs

**POST /api/reports/templates**
- Create a new report template
- Body: { template_name, report_type, filters, chart_config, export_format, schedule_enabled, schedule_frequency, schedule_day, schedule_time, is_public, shared_with }
- Validates: template_name uniqueness, required fields
- Returns: created template with ID

**GET /api/reports/templates**
- Get all report templates for current user
- Query params: ?include_public=true
- Returns: array of templates

**GET /api/reports/templates/[id]**
- Get specific template by ID
- Validates: user owns template or template is public/shared with user
- Returns: template details

**PUT /api/reports/templates/[id]**
- Update existing template
- Body: { template_name, filters, chart_config, export_format, schedule_enabled, schedule_frequency, schedule_day, schedule_time, is_public, shared_with }
- Validates: user owns template
- Returns: updated template

**DELETE /api/reports/templates/[id]**
- Delete template
- Validates: user owns template
- Returns: success message

**POST /api/reports/templates/[id]/run**
- Run report generation immediately from template
- Returns: generated report ID

#### 2.2 Report Generation APIs

**POST /api/reports/generate**
- Generate report on-demand (enhanced with granular statistics)
- Body: { format, filters, report_name, chart_config, include_charts }
- Supported formats: csv, pdf, excel, json
- **Enhanced data structure includes**:
  - `diseaseByDistrict`: Array of objects with disease, district, total_cases, outcomes (recovered, deaths, ongoing, unknown), recovery_rate, mortality_rate
  - `outcomeStatistics`: Object with breakdown by disease, district, facility, and time series
  - `caseFatalityRate`: CFR by disease, district, facility
  - `treatmentSuccessRate`: TSR by disease, district, facility
  - `outcomeTrends`: Time series of outcomes over the selected period
- **Filter integration**: All filters (disease, district, facility, date range, time range) are applied to all statistics
- Returns: generated report with download URL

**GET /api/reports/[id]**
- Get report metadata
- Returns: report details

**GET /api/reports/[id]/download**
- Download report file
- Returns: file stream with appropriate headers

**GET /api/reports**
- Get generated reports for current user
- Query params: ?limit=20&offset=0&format=csv
- Returns: paginated list of reports

#### 2.3 Report Scheduling APIs

**POST /api/reports/schedule**
- Create/update scheduled report
- Body: { template_id, schedule_frequency, schedule_day, schedule_time }
- Returns: schedule details

**GET /api/reports/scheduled**
- Get all scheduled reports for current user
- Returns: array of scheduled reports

**DELETE /api/reports/scheduled/[id]**
- Cancel scheduled report
- Returns: success message

#### 2.4 Report Sharing APIs

**POST /api/reports/[id]/share**
- Share report with other users
- Body: { user_ids, is_public }
- Returns: sharing details

**GET /api/reports/[id]/shared-with**
- Get list of users report is shared with
- Returns: array of users

**DELETE /api/reports/[id]/share/[userId]**
- Remove sharing with specific user
- Returns: success message

### Phase 3: PDF Generation Implementation

#### 3.1 Install PDF Library
```bash
npm install jspdf jspdf-autotable
npm install @types/jspdf --save-dev
```

#### 3.2 Create PDF Generation Service
```typescript
// src/services/pdf.service.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export class PDFService {
  generateReportPDF(data: any, config: any): Blob {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(config.reportName, 14, 20);
    
    // Add metadata
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Filters: ${Object.entries(data.filters || {}).map(([k, v]) => `${k}: ${v || 'all'}`).join(', ')}`, 14, 38);
    
    // Add tables for each section
    this.addEncounterStats(doc, data.encounters);
    this.addDiseaseByDistrict(doc, data.diseaseByDistrict);
    this.addOutcomeStatistics(doc, data.outcomeStatistics);
    this.addCaseFatalityRate(doc, data.caseFatalityRate);
    this.addTreatmentSuccessRate(doc, data.treatmentSuccessRate);
    this.addDiseaseDistribution(doc, data.diseases);
    this.addDemographics(doc, data.demographics);
    
    // Add charts if requested
    if (config.include_charts) {
      this.addCharts(doc, data, config);
    }
    
    return doc.output('blob');
  }
  
  private addEncounterStats(doc: jsPDF, data: any) {
    doc.setFontSize(14);
    doc.text('Encounter Statistics', 14, 50);
    
    autoTable(doc, {
      startY: 55,
      head: [['Metric', 'Value']],
      body: [
        ['Total Encounters', data.totalEncounters || 0],
        ['Average Duration (days)', data.avgDuration || 0],
      ],
    });
  }
  
  private addDiseaseByDistrict(doc: jsPDF, data: any) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Disease by District Breakdown', 14, 20);
    
    const tableData = data.map((item: any) => [
      item.disease,
      item.district,
      item.total_cases,
      item.outcomes.recovered,
      item.outcomes.deaths,
      item.outcomes.ongoing,
      item.outcomes.unknown,
      `${item.recovery_rate}%`,
      `${item.mortality_rate}%`,
    ]);
    
    autoTable(doc, {
      startY: 25,
      head: [['Disease', 'District', 'Total Cases', 'Recovered', 'Deaths', 'Ongoing', 'Unknown', 'Recovery Rate', 'Mortality Rate']],
      body: tableData,
    });
  }
  
  private addOutcomeStatistics(doc: jsPDF, data: any) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Comprehensive Outcome Statistics', 14, 20);
    
    // Outcome breakdown by disease
    if (data.byDisease) {
      doc.setFontSize(12);
      doc.text('By Disease', 14, 30);
      
      const diseaseData = data.byDisease.map((item: any) => [
        item.disease,
        item.recovered,
        item.deaths,
        item.ongoing,
        item.unknown,
        item.treatment_failure,
        item.lost_to_followup,
        `${item.recovery_rate}%`,
        `${item.mortality_rate}%`,
      ]);
      
      autoTable(doc, {
        startY: 35,
        head: [['Disease', 'Recovered', 'Deaths', 'Ongoing', 'Unknown', 'Treatment Failure', 'Lost to Follow-up', 'Recovery Rate', 'Mortality Rate']],
        body: diseaseData,
      });
    }
    
    // Outcome breakdown by district
    if (data.byDistrict) {
      doc.addPage();
      doc.setFontSize(12);
      doc.text('By District', 14, 20);
      
      const districtData = data.byDistrict.map((item: any) => [
        item.district,
        item.recovered,
        item.deaths,
        item.ongoing,
        item.unknown,
        `${item.recovery_rate}%`,
        `${item.mortality_rate}%`,
      ]);
      
      autoTable(doc, {
        startY: 25,
        head: [['District', 'Recovered', 'Deaths', 'Ongoing', 'Unknown', 'Recovery Rate', 'Mortality Rate']],
        body: districtData,
      });
    }
  }
  
  private addCaseFatalityRate(doc: jsPDF, data: any) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Case Fatality Rate (CFR)', 14, 20);
    
    const cfrData = Object.entries(data.byDisease || {}).map(([disease, rate]: [string, any]) => [disease, `${rate}%`]);
    
    autoTable(doc, {
      startY: 25,
      head: [['Disease', 'CFR']],
      body: cfrData,
    });
  }
  
  private addTreatmentSuccessRate(doc: jsPDF, data: any) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Treatment Success Rate (TSR)', 14, 20);
    
    const tsrData = Object.entries(data.byDisease || {}).map(([disease, rate]: [string, any]) => [disease, `${rate}%`]);
    
    autoTable(doc, {
      startY: 25,
      head: [['Disease', 'TSR']],
      body: tsrData,
    });
  }
  
  // ... other methods for different sections
}
```

#### 3.3 Excel Generation
```bash
npm install xlsx
npm install @types/xlsx --save-dev
```

```typescript
// src/services/excel.service.ts
import * as XLSX from 'xlsx';

export class ExcelService {
  generateReportExcel(data: any, config: any): Blob {
    const workbook = XLSX.utils.book_new();
    
    // Add summary sheet
    const summaryData = [
      ['Report Name', config.reportName],
      ['Generated', new Date().toISOString()],
      ['Filters', Object.entries(data.filters || {}).map(([k, v]) => `${k}: ${v || 'all'}`).join(', ')],
      [''],
      ['Total Encounters', data.encounters?.totalEncounters || 0],
      ['Average Duration', data.encounters?.avgDuration || 0],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Add disease-by-district breakdown sheet
    if (data.diseaseByDistrict) {
      const diseaseDistrictData = [
        ['Disease', 'District', 'Total Cases', 'Recovered', 'Deaths', 'Ongoing', 'Unknown', 'Recovery Rate', 'Mortality Rate'],
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
      const diseaseDistrictSheet = XLSX.utils.aoa_to_sheet(diseaseDistrictData);
      XLSX.utils.book_append_sheet(workbook, diseaseDistrictSheet, 'Disease by District');
    }
    
    // Add comprehensive outcome statistics sheet
    if (data.outcomeStatistics) {
      // Outcome breakdown by disease
      if (data.outcomeStatistics.byDisease) {
        const diseaseOutcomeData = [
          ['Disease', 'Recovered', 'Deaths', 'Ongoing', 'Unknown', 'Treatment Failure', 'Lost to Follow-up', 'Recovery Rate', 'Mortality Rate'],
          ...data.outcomeStatistics.byDisease.map((item: any) => [
            item.disease,
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
        const diseaseOutcomeSheet = XLSX.utils.aoa_to_sheet(diseaseOutcomeData);
        XLSX.utils.book_append_sheet(workbook, diseaseOutcomeSheet, 'Outcomes by Disease');
      }
      
      // Outcome breakdown by district
      if (data.outcomeStatistics.byDistrict) {
        const districtOutcomeData = [
          ['District', 'Recovered', 'Deaths', 'Ongoing', 'Unknown', 'Recovery Rate', 'Mortality Rate'],
          ...data.outcomeStatistics.byDistrict.map((item: any) => [
            item.district,
            item.recovered,
            item.deaths,
            item.ongoing,
            item.unknown,
            item.recovery_rate,
            item.mortality_rate,
          ]),
        ];
        const districtOutcomeSheet = XLSX.utils.aoa_to_sheet(districtOutcomeData);
        XLSX.utils.book_append_sheet(workbook, districtOutcomeSheet, 'Outcomes by District');
      }
    }
    
    // Add Case Fatality Rate sheet
    if (data.caseFatalityRate) {
      const cfrData = [
        ['Disease', 'CFR (%)'],
        ...Object.entries(data.caseFatalityRate.byDisease || {}).map(([disease, rate]: [string, any]) => [disease, rate]),
      ];
      const cfrSheet = XLSX.utils.aoa_to_sheet(cfrData);
      XLSX.utils.book_append_sheet(workbook, cfrSheet, 'Case Fatality Rate');
    }
    
    // Add Treatment Success Rate sheet
    if (data.treatmentSuccessRate) {
      const tsrData = [
        ['Disease', 'TSR (%)'],
        ...Object.entries(data.treatmentSuccessRate.byDisease || {}).map(([disease, rate]: [string, any]) => [disease, rate]),
      ];
      const tsrSheet = XLSX.utils.aoa_to_sheet(tsrData);
      XLSX.utils.book_append_sheet(workbook, tsrSheet, 'Treatment Success Rate');
    }
    
    // Add disease distribution sheet
    if (data.diseases?.byDisease) {
      const diseaseData = [['Disease', 'Count'], ...data.diseases.byDisease.map((d: any) => [d.disease, d.count])];
      const diseaseSheet = XLSX.utils.aoa_to_sheet(diseaseData);
      XLSX.utils.book_append_sheet(workbook, diseaseSheet, 'Diseases');
    }
    
    // Add demographics sheet
    if (data.demographics) {
      // Age distribution
      if (data.demographics.ageDistribution) {
        const ageData = [
          ['Age Group', 'Count'],
          ...Object.entries(data.demographics.ageDistribution).map(([group, count]) => [group, count]),
        ];
        const ageSheet = XLSX.utils.aoa_to_sheet(ageData);
        XLSX.utils.book_append_sheet(workbook, ageSheet, 'Age Distribution');
      }
      
      // Gender distribution
      if (data.demographics.genderBreakdown) {
        const genderData = [
          ['Gender', 'Count'],
          ...data.demographics.genderBreakdown.map((g: any) => [g.sex, g._count.sex]),
        ];
        const genderSheet = XLSX.utils.aoa_to_sheet(genderData);
        XLSX.utils.book_append_sheet(workbook, genderSheet, 'Gender Distribution');
      }
    }
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
}
```

### Phase 4: File Storage

#### 4.1 File Storage Configuration
- Use local filesystem for development
- Use AWS S3 or similar for production
- Create storage service abstraction

```typescript
// src/services/storage.service.ts
export class StorageService {
  async saveFile(file: Buffer, filename: string, mimeType: string): Promise<string> {
    // Development: save to local filesystem
    // Production: upload to S3
    const path = `./reports/${filename}`;
    await fs.writeFile(path, file);
    return path;
  }
  
  async getFile(path: string): Promise<Buffer> {
    return fs.readFile(path);
  }
  
  async deleteFile(path: string): Promise<void> {
    await fs.unlink(path);
  }
}
```

### Phase 5: Scheduled Report Execution

#### 5.1 Cron Job Implementation
```typescript
// src/app/api/cron/reports/route.ts
import { prisma } from '@/lib/prisma';
import { ReportService } from '@/services/report.service';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get templates with enabled schedules
  const scheduledTemplates = await prisma.reportTemplate.findMany({
    where: {
      schedule_enabled: true,
      next_run: { lte: new Date() },
    },
    include: { user: true },
  });
  
  // Generate reports for each scheduled template
  for (const template of scheduledTemplates) {
    await ReportService.generateFromTemplate(template);
    
    // Update next_run based on frequency
    const nextRun = calculateNextRun(template.schedule_frequency, template.schedule_day, template.schedule_time);
    await prisma.reportTemplate.update({
      where: { id: template.id },
      data: { next_run, last_run: new Date() },
    });
  }
  
  return NextResponse.json({ success: true, processed: scheduledTemplates.length });
}
```

### Phase 6: Frontend Implementation

#### 6.1 Report Template Management
- Create template creation/edit dialog
- Implement form with all configuration options
- Add template list with search/filter
- Implement template sharing UI
- Add template duplication functionality

#### 6.2 Enhanced Report Generation
- Integrate with real API endpoints
- Add format selector (CSV, PDF, Excel, JSON)
- Implement chart inclusion options
- Add report preview before generation
- Show generation progress for large reports
- **Display disease-by-district breakdown in preview**
- **Show comprehensive outcome statistics in preview**
- **Include CFR and TSR statistics in preview**
- **Ensure all filter adjustments work correctly in preview and generation**
- **Add data validation to ensure filters are properly applied**

#### 6.3 Saved Reports Tab
- Replace mock data with real API calls
- Implement pagination
- Add search and filter
- Add download functionality
- Show report metadata (size, format, generated date)
- Implement report deletion
- Add report sharing UI

#### 6.4 Scheduled Reports
- Add scheduled reports tab
- Show schedule status and next run time
- Enable/disable schedules
- Edit schedule configuration
- View scheduled report history

#### 6.5 Report Preview
- Implement real-time preview using selected filters
- Show charts based on chart configuration
- Allow preview before generation
- Support different chart types and layouts

### Phase 7: Email Delivery

#### 7.1 Email Service
```typescript
// src/services/email.service.ts
import nodemailer from 'nodemailer';

export class EmailService {
  async sendReportEmail(report: GeneratedReport, recipient: string) {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: recipient,
      subject: `Report: ${report.report_name}`,
      text: `Your report is ready. Download it here: ${report.download_url}`,
      attachments: [
        {
          filename: `${report.report_name}.${report.format}`,
          path: report.file_path,
        },
      ],
    });
  }
}
```

#### 7.2 Email Notification Integration
- Add email option to scheduled reports
- Send notification when report is generated
- Include download link or attachment
- Support multiple recipients

### Phase 8: Security & Access Control

#### 8.1 Authentication & Authorization
- All report APIs require authentication
- Template access: owner, public, or shared
- Report access: owner or shared
- Admin can view all reports

#### 8.2 File Access Control
- Validate user has access before allowing download
- Use signed URLs for S3 files
- Implement access logging

#### 8.3 Rate Limiting
- Limit report generation frequency
- Limit download attempts
- Implement queue for large reports

### Phase 9: Testing & Validation

#### 9.1 Unit Tests
- Test PDF generation service
- Test Excel generation service
- Test storage service
- Test email service
- Test report scheduling logic

#### 9.2 Integration Tests
- Test report generation flow
- Test template creation and usage
- Test scheduled report execution
- Test file upload/download
- Test email delivery

#### 9.3 Manual Testing Checklist
- [ ] CSV report can be generated and downloaded
- [ ] PDF report can be generated and downloaded
- [ ] Excel report can be generated and downloaded
- [ ] JSON report can be generated and downloaded
- [ ] Report templates can be created
- [ ] Report templates can be edited
- [ ] Report templates can be deleted
- [ ] Report templates can be shared
- [ ] Scheduled reports run automatically
- [ ] Email notifications are sent
- [ ] Large reports handle gracefully
- [ ] File access control works correctly

### Phase 10: Deployment

#### 10.1 Database Migration
- Create Prisma migration for new tables
- Test in development environment
- Test in staging environment
- Run in production environment

#### 10.2 File Storage Setup
- Configure S3 bucket for production
- Set up IAM roles and policies
- Configure CDN for file delivery

#### 10.3 Cron Job Setup
- Configure cron job for scheduled reports
- Set up monitoring and alerts
- Test schedule execution

#### 10.4 Email Configuration
- Configure SMTP settings
- Test email delivery
- Set up email templates

## Implementation Order

1. **Phase 1**: Database schema updates (1-2 days)
2. **Phase 2**: API endpoints implementation (3-4 days)
3. **Phase 3**: PDF generation implementation (1-2 days)
4. **Phase 4**: File storage implementation (1 day)
5. **Phase 5**: Scheduled report execution (1-2 days)
6. **Phase 6**: Frontend implementation (3-4 days)
7. **Phase 7**: Email delivery (1-2 days, can be done in parallel with Phase 6)
8. **Phase 8**: Security & access control (1-2 days, can be done in parallel with Phase 6)
9. **Phase 9**: Testing & validation (2-3 days)
10. **Phase 10**: Deployment (1-2 days)

**Total Estimated Time**: 15-24 days

## Dependencies

- **PDF Generation**: jspdf, jspdf-autotable
- **Excel Generation**: xlsx
- **Email**: nodemailer
- **File Storage**: AWS SDK (for S3) or local filesystem
- **Scheduling**: node-cron or Vercel Cron
- **Validation**: zod or similar

## Risks & Mitigations

### Risk 1: Large Report Generation Timeout
- **Mitigation**: Implement async generation with job queue, show progress to user, send email when ready

### Risk 2: File Storage Costs
- **Mitigation**: Implement file expiration, compress files, use CDN for delivery

### Risk 3: Email Delivery Failures
- **Mitigation**: Implement retry logic, fallback to download link, log failures for monitoring

### Risk 4: Scheduled Report Execution Failures
- **Mitigation**: Implement error handling, retry logic, alert on failures, manual trigger option

### Risk 5: PDF Generation Complexity
- **Mitigation**: Start with simple PDF, add advanced features incrementally, consider commercial PDF library if needed

## Success Criteria

1. Users can generate reports in CSV, PDF, Excel, and JSON formats
2. Users can create, edit, and delete report templates
3. Users can schedule reports for automatic generation
4. Users can share reports with other users
5. Scheduled reports run automatically and notify users
6. Large reports handle gracefully without timeout
7. File access control works correctly
8. Email notifications are sent reliably
9. Report generation is performant
10. User experience is smooth with proper feedback
