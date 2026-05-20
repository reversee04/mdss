# Dashboard-Based Alert System Analysis

## Current Implementation Analysis

### Existing Components
1. **Alert Service** (`src/services/alert.service.ts`)
   - Monitors diseases against population thresholds
   - Creates alert records in database via `prisma.outbreakAlert.create()`
   - Has `sendNotifications()` function that's currently a TODO (just logs to console)
   - Supports cooldown periods to prevent alert fatigue

2. **Alerts Page** (`src/app/alerts/page.tsx`)
   - Displays alerts using mock data from `@/lib/mock-data`
   - Has tabs for active, acknowledged, escalated alerts
   - Shows alert details in a dialog
   - Currently not connected to real data

3. **API Routes** (`src/app/api/alerts/route.ts`)
   - Fetches alerts from database with filtering options
   - Supports filtering by diseaseId, severity, acknowledged status
   - Returns alerts with disease information included

4. **Dashboard Layout** (`src/components/dashboard/dashboard-layout.tsx`)
   - Supports multiple roles: admin, analyst, ministry
   - Has navbar and sidebar navigation
   - No current alert notification display

### Database Schema
- `Disease` model has threshold fields: `outbreak_threshold`, `warning_threshold`, `monitoring_enabled`, `alert_recipients`, `alert_cooldown_hours`
- `OutbreakAlert` model tracks alert history with fields for alert type, severity, location, cases, threshold, message, acknowledgment status

## Proposed Dashboard-Based Alert System Architecture

### 1. Alert Flow
```
Threshold Monitoring → Alert Creation → Database Storage → Dashboard Display → User Action
```

### 2. Dashboard Integration Points

#### A. Navbar Alert Notification Badge
- Show count of unacknowledged alerts
- Color-coded by severity (red for critical, orange for high, etc.)
- Click to show dropdown with recent alerts
- Real-time updates via polling or WebSocket

#### B. Dashboard Alert Cards
- Dedicated alert section on main dashboard
- Show active alerts with severity indicators
- Quick action buttons (acknowledge, escalate, view details)
- Filter by disease, location, severity

#### C. Role-Based Alert Visibility
- **Admin**: All alerts, can configure thresholds, can acknowledge/escalate
- **Analyst**: Alerts for their assigned regions/diseases, can acknowledge
- **Ministry**: High-level summary, critical alerts only, can view and acknowledge

### 3. Implementation Components

#### A. Alert Context/Hook
- React context to manage alert state across dashboard
- Polling mechanism to fetch new alerts periodically
- WebSocket support for real-time updates (optional)

#### B. Alert Notification Components
- `AlertBadge` - Shows alert count in navbar
- `AlertDropdown` - Shows recent alerts dropdown
- `AlertCard` - Individual alert display component
- `AlertPanel` - Dedicated alert section for dashboards

#### C. API Enhancements
- Add endpoint for alert statistics (counts by severity/status)
- Add endpoint for real-time alert updates
- Add endpoint for alert acknowledgment/escalation
- Add WebSocket endpoint for real-time push (optional)

### 4. Data Flow

```
1. Scheduled Job (hourly)
   ↓
2. monitorAllDiseases() checks thresholds
   ↓
3. If threshold breached → sendAlert() creates OutbreakAlert record
   ↓
4. Alert stored in database
   ↓
5. Dashboard polls API every 30-60 seconds
   ↓
6. New alerts displayed in navbar badge and dashboard
   ↓
7. User acknowledges/escalates alert
   ↓
8. Alert status updated in database
```

### 5. Key Changes Needed

1. **Update Alerts Page** - Replace mock data with API fetch
2. **Add Alert Badge to Navbar** - Show unacknowledged alert count
3. **Create Alert Context** - Manage alert state across dashboard
4. **Add Alert Panel to Dashboards** - Show active alerts on main pages
5. **Implement Polling/Real-time Updates** - Keep alerts current
6. **Add Alert Action Endpoints** - Acknowledge, escalate, add notes
7. **Update sendNotifications()** - Remove email/SMS, focus on dashboard

### 6. Priority Implementation Order

1. Update alerts page to use real API data
2. Add alert badge to navbar with polling
3. Create alert panel component for dashboards
4. Implement alert acknowledgment/escalation endpoints
5. Add role-based alert filtering
6. Implement real-time updates (WebSocket or polling optimization)
7. Add alert history and analytics

## Benefits of Dashboard-Based System

1. **Immediate Visibility** - Alerts appear directly in the user's workspace
2. **Role-Based Access** - Different users see relevant alerts
3. **Quick Action** - Users can acknowledge/escalate without leaving dashboard
4. **Real-Time Updates** - No delay from email delivery
5. **Centralized Management** - All alerts in one place with full history
6. **Reduced Alert Fatigue** - Cooldown and acknowledgment system prevents spam
7. **Better Tracking** - Complete audit trail of alert actions
