# Audit Logs Implementation Plan

## Overview

This document outlines the implementation plan for comprehensive audit logging functionality in the MDSS application, including the ability to view and manage audit logs in the admin dashboard.

## Current State

### Existing Infrastructure
- **Database Schema**: `AuditLog` model exists with fields:
  - `log_id` (String, primary key)
  - `user_id` (String, foreign key to User)
  - `action` (String)
  - `entity_affected` (String)
  - `timestamp` (DateTime, default now)
  - `details` (Text, optional)
- **Admin Page**: `/admin/audit` page exists but uses mock data
- **Partial Implementation**: Some settings APIs already create audit logs:
  - Profile updates (`/api/settings/profile`)
  - Password changes (`/api/settings/profile/password`)
  - 2FA changes (`/api/settings/profile/2fa`)
  - Avatar uploads (`/api/settings/profile/avatar`)
  - Notification preferences (`/api/settings/notifications`)
  - System settings (`/api/settings/system`)
  - Maintenance actions (`/api/settings/system/maintenance`)

### Gaps Identified
1. **No audit logging for user login/logout**
2. **No audit logging for admin user management actions** (create, update, delete users)
3. **No audit logging for ETL operations**
4. **No audit logging for report generation**
5. **No audit logging for alert acknowledgment**
6. **Admin audit page uses mock data instead of real database queries**
7. **No API endpoint for fetching audit logs**
8. **No filtering capabilities on audit logs**
9. **No export functionality for audit logs**
10. **No audit log retention policy**

## Implementation Plan

### Phase 1: Database Schema Updates

#### 1.1 Enhance AuditLog Model
```prisma
model AuditLog {
  log_id          String   @id @db.VarChar(50)
  user_id         String   @db.VarChar(50)
  user            User     @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  
  action          String   @db.VarChar(100)
  entity_affected String   @db.VarChar(100)
  entity_id       String?  @db.VarChar(100) // ID of the affected entity
  timestamp       DateTime @default(now())
  details         String?  @db.Text
  
  // Additional fields for better tracking
  ip_address      String?  @db.VarChar(45) // IPv6 compatible
  user_agent      String?  @db.VarChar(500)
  severity        String   @default("info") // info, warning, error, critical
  category        String   @default("general") // auth, profile, admin, system, etl, report, alert
  
  created_at      DateTime @default(now())
}
```

#### 1.2 Add AuditLog Retention Policy
- Implement automatic cleanup of old logs
- Keep logs for 90 days by default (configurable)
- Critical logs kept for 1 year

### Phase 2: Audit Logging Service

#### 2.1 Create Audit Logging Service
```typescript
// src/services/audit.service.ts
import { prisma } from '@/lib/prisma';

export enum AuditAction {
  // Auth
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  
  // Profile
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  2FA_ENABLED = '2FA_ENABLED',
  2FA_DISABLED = '2FA_DISABLED',
  AVATAR_UPDATED = 'AVATAR_UPDATED',
  
  // Admin
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  USER_STATUS_CHANGED = 'USER_STATUS_CHANGED',
  
  // System
  SYSTEM_SETTING_UPDATED = 'SYSTEM_SETTING_UPDATED',
  MAINTENANCE_TRIGGERED = 'MAINTENANCE_TRIGGERED',
  
  // ETL
  ETL_SYNC_STARTED = 'ETL_SYNC_STARTED',
  ETL_SYNC_COMPLETED = 'ETL_SYNC_COMPLETED',
  ETL_SYNC_FAILED = 'ETL_SYNC_FAILED',
  
  // Reports
  REPORT_GENERATED = 'REPORT_GENERATED',
  REPORT_DOWNLOADED = 'REPORT_DOWNLOADED',
  
  // Alerts
  ALERT_ACKNOWLEDGED = 'ALERT_ACKNOWLEDGED',
  ALERT_CREATED = 'ALERT_CREATED',
}

export enum AuditCategory {
  AUTH = 'auth',
  PROFILE = 'profile',
  ADMIN = 'admin',
  SYSTEM = 'system',
  ETL = 'etl',
  REPORT = 'report',
  ALERT = 'alert',
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

interface AuditLogOptions {
  userId: string;
  action: AuditAction;
  entityAffected: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  severity?: AuditSeverity;
  category?: AuditCategory;
}

export class AuditService {
  static async log(options: AuditLogOptions) {
    try {
      await prisma.auditLog.create({
        data: {
          log_id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          user_id: options.userId,
          action: options.action,
          entity_affected: options.entityAffected,
          entity_id: options.entityId,
          details: options.details,
          ip_address: options.ipAddress,
          user_agent: options.userAgent,
          severity: options.severity || AuditSeverity.INFO,
          category: options.category || AuditCategory.GENERAL,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging failure shouldn't break the main operation
    }
  }
  
  static async cleanupOldLogs(daysToKeep: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    await prisma.auditLog.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
        severity: { not: AuditSeverity.CRITICAL },
      },
    });
  }
}
```

### Phase 3: Authentication Audit Logging

#### 3.1 Add Login Logging
```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { AuditService, AuditAction, AuditCategory } from '@/services/audit.service';

// In the signIn callback
callbacks: {
  async signIn({ user, account }) {
    await AuditService.log({
      userId: user.id,
      action: AuditAction.LOGIN,
      entityAffected: 'User',
      entityId: user.id,
      details: `User ${user.email} logged in via ${account?.provider}`,
      category: AuditCategory.AUTH,
    });
    return true;
  },
  async signOut({ token }) {
    await AuditService.log({
      userId: token.sub,
      action: AuditAction.LOGOUT,
      entityAffected: 'User',
      entityId: token.sub,
      details: `User logged out`,
      category: AuditCategory.AUTH,
    });
  },
},
```

#### 3.2 Add Failed Login Logging
```typescript
// In your authentication logic
try {
  // authentication attempt
} catch (error) {
  await AuditService.log({
    userId: 'SYSTEM', // or unknown user ID
    action: AuditAction.LOGIN_FAILED,
    entityAffected: 'User',
    details: `Failed login attempt for email: ${email}`,
    severity: AuditSeverity.WARNING,
    category: AuditCategory.AUTH,
  });
}
```

### Phase 4: Admin Actions Audit Logging

#### 4.1 User Management Logging
```typescript
// src/app/api/admin/users/route.ts
import { AuditService, AuditAction, AuditCategory } from '@/services/audit.service';

// POST - Create user
export async function POST(request: NextRequest) {
  // ... existing code ...
  
  const newUser = await prisma.user.create({ ... });
  
  await AuditService.log({
    userId: session.user.id,
    action: AuditAction.USER_CREATED,
    entityAffected: 'User',
    entityId: newUser.user_id,
    details: `Created user: ${newUser.name} (${newUser.email}) with role: ${newUser.role}`,
    category: AuditCategory.ADMIN,
  });
  
  // ... return response
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  // ... existing code ...
  
  await AuditService.log({
    userId: session.user.id,
    action: AuditAction.USER_UPDATED,
    entityAffected: 'User',
    entityId: userId,
    details: `Updated user: ${updatedUser.name} (${updatedUser.email})`,
    category: AuditCategory.ADMIN,
  });
  
  // ... return response
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  // ... existing code ...
  
  await AuditService.log({
    userId: session.user.id,
    action: AuditAction.USER_DELETED,
    entityAffected: 'User',
    entityId: userId,
    details: `Deleted user: ${deletedUser.name} (${deletedUser.email})`,
    severity: AuditSeverity.WARNING,
    category: AuditCategory.ADMIN,
  });
  
  // ... return response
}
```

#### 4.2 Role Change Logging
```typescript
// When changing user role
await AuditService.log({
  userId: session.user.id,
  action: AuditAction.USER_ROLE_CHANGED,
  entityAffected: 'User',
  entityId: userId,
  details: `Changed role from ${oldRole} to ${newRole} for user: ${user.name}`,
  category: AuditCategory.ADMIN,
});
```

### Phase 5: ETL Audit Logging

#### 5.1 ETL Sync Logging
```typescript
// src/app/api/admin/etl/route.ts
import { AuditService, AuditAction, AuditCategory, AuditSeverity } from '@/services/audit.service';

export async function POST() {
  try {
    await AuditService.log({
      userId: session.user.id,
      action: AuditAction.ETL_SYNC_STARTED,
      entityAffected: 'ETL',
      details: 'ETL sync initiated by admin',
      category: AuditCategory.ETL,
    });
    
    // ... trigger sync ...
    
    await AuditService.log({
      userId: session.user.id,
      action: AuditAction.ETL_SYNC_COMPLETED,
      entityAffected: 'ETL',
      details: `ETL sync completed successfully. Records: ${result.recordsCount}`,
      category: AuditCategory.ETL,
    });
    
  } catch (error) {
    await AuditService.log({
      userId: session.user.id,
      action: AuditAction.ETL_SYNC_FAILED,
      entityAffected: 'ETL',
      details: `ETL sync failed: ${error.message}`,
      severity: AuditSeverity.ERROR,
      category: AuditCategory.ETL,
    });
    throw error;
  }
}
```

#### 5.2 Automatic ETL Logging
```typescript
// In hospitalAPI syncToMDSS function
// src/hospitalAPI/src/api/getAll.ts

async function syncToMDSS() {
  try {
    // Log sync start
    await prisma.auditLog.create({
      data: {
        log_id: `LOG-${Date.now()}`,
        user_id: 'SYSTEM',
        action: 'ETL_SYNC_STARTED',
        entity_affected: 'ETL',
        details: 'Automatic ETL sync started',
        category: 'etl',
      },
    });
    
    // ... sync logic ...
    
    // Log sync completion
    await prisma.auditLog.create({
      data: {
        log_id: `LOG-${Date.now()}`,
        user_id: 'SYSTEM',
        action: 'ETL_SYNC_COMPLETED',
        entity_affected: 'ETL',
        details: `Automatic ETL sync completed. Patients: ${patients.length}, Encounters: ${encounters.length}`,
        category: 'etl',
      },
    });
  } catch (error) {
    // Log sync failure
    await prisma.auditLog.create({
      data: {
        log_id: `LOG-${Date.now()}`,
        user_id: 'SYSTEM',
        action: 'ETL_SYNC_FAILED',
        entity_affected: 'ETL',
        details: `Automatic ETL sync failed: ${error.message}`,
        severity: 'error',
        category: 'etl',
      },
    });
  }
}
```

### Phase 6: Report Generation Audit Logging

#### 6.1 Report Generation Logging
```typescript
// src/app/api/reports/route.ts
import { AuditService, AuditAction, AuditCategory } from '@/services/audit.service';

export async function POST(request: NextRequest) {
  const { format, filters, reportName } = await request.json();
  
  await AuditService.log({
    userId: session.user.id,
    action: AuditAction.REPORT_GENERATED,
    entityAffected: 'Report',
    details: `Generated ${format} report: ${reportName} with filters: ${JSON.stringify(filters)}`,
    category: AuditCategory.REPORT,
  });
  
  // ... generate report ...
}
```

#### 6.2 Report Download Logging
```typescript
// src/app/api/reports/[id]/download/route.ts
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  await AuditService.log({
    userId: session.user.id,
    action: AuditAction.REPORT_DOWNLOADED,
    entityAffected: 'Report',
    entityId: params.id,
    details: `Downloaded report: ${params.id}`,
    category: AuditCategory.REPORT,
  });
  
  // ... download logic ...
}
```

### Phase 7: Alert Audit Logging

#### 7.1 Alert Acknowledgment Logging
```typescript
// src/app/api/alerts/[id]/acknowledge/route.ts
import { AuditService, AuditAction, AuditCategory } from '@/services/audit.service';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  await AuditService.log({
    userId: session.user.id,
    action: AuditAction.ALERT_ACKNOWLEDGED,
    entityAffected: 'Alert',
    entityId: params.id,
    details: `Acknowledged alert: ${params.id}`,
    category: AuditCategory.ALERT,
  });
  
  // ... acknowledge logic ...
}
```

### Phase 8: Audit Logs API Endpoint

#### 8.1 Create Audit Logs API
```typescript
// src/app/api/admin/audit-logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const action = searchParams.get('action');
    const severity = searchParams.get('severity');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (userId) where.user_id = userId;
    if (category) where.category = category;
    if (action) where.action = action;
    if (severity) where.severity = severity;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.auditLog.count({ where });

    return NextResponse.json({
      success: true,
      data: logs.map(log => ({
        id: log.log_id,
        user: log.user.name,
        email: log.user.email,
        role: log.user.role,
        action: log.action,
        entityAffected: log.entity_affected,
        entityId: log.entity_id,
        timestamp: log.timestamp.toISOString(),
        details: log.details,
        ipAddress: log.ip_address,
        severity: log.severity,
        category: log.category,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit logs', message: error.message },
      { status: 500 }
    );
  }
}
```

### Phase 9: Admin Audit Logs Page Update

#### 9.1 Replace Mock Data with Real API
```typescript
// src/app/admin/audit/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { DataTable } from '@/components/dashboard/data-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, FileText, User, Database, Settings, Bell, Loader2 } from 'lucide-react'

type AuditLog = {
  id: string
  user: string
  email: string
  role: string
  action: string
  entityAffected: string
  entityId?: string
  timestamp: string
  details?: string
  ipAddress?: string
  severity: string
  category: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')

  useEffect(() => {
    fetchAuditLogs()
  }, [filterCategory, filterSeverity])

  const fetchAuditLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterCategory !== 'all') params.append('category', filterCategory)
      if (filterSeverity !== 'all') params.append('severity', filterSeverity)
      
      const response = await fetch(`/api/admin/audit-logs?${params}`)
      const data = await response.json()
      if (data.success) {
        setLogs(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    // Export logic
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all system activities and user actions
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="profile">Profile</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="etl">ETL</SelectItem>
                  <SelectItem value="report">Reports</SelectItem>
                  <SelectItem value="alert">Alerts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Severity</label>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Complete history of system events and user actions</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={logs}
            columns={[
              { key: 'timestamp', header: 'Timestamp' },
              {
                key: 'user',
                header: 'User',
                render: (item) => (
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">
                        {item.user.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{item.user}</div>
                      <div className="text-xs text-muted-foreground">{item.email}</div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'action',
                header: 'Action',
                render: (item) => (
                  <Badge 
                    variant={item.severity === 'error' || item.severity === 'critical' ? 'destructive' : 'outline'}
                  >
                    {item.action}
                  </Badge>
                ),
              },
              {
                key: 'category',
                header: 'Category',
                render: (item) => (
                  <Badge variant="secondary">{item.category}</Badge>
                ),
              },
              {
                key: 'details',
                header: 'Details',
                render: (item) => (
                  <span className="text-sm text-muted-foreground max-w-xs truncate block">
                    {item.details}
                  </span>
                ),
              },
            ]}
            searchPlaceholder="Search audit logs..."
            pageSize={20}
          />
        </CardContent>
      </Card>
    </div>
  )
}
```

### Phase 10: Export Functionality

#### 10.1 Add CSV Export
```typescript
// src/app/api/admin/audit-logs/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    if (category) where.category = category;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    const csvRows = [
      ['Timestamp', 'User', 'Email', 'Role', 'Action', 'Category', 'Severity', 'Entity Affected', 'Details', 'IP Address'],
      ...logs.map(log => [
        log.timestamp.toISOString(),
        log.user.name,
        log.user.email,
        log.user.role,
        log.action,
        log.category,
        log.severity,
        log.entity_affected,
        log.details || '',
        log.ip_address || '',
      ]),
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Failed to export audit logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export audit logs', message: error.message },
      { status: 500 }
    );
  }
}
```

### Phase 11: Automated Cleanup

#### 11.1 Scheduled Cleanup Job
```typescript
// src/app/api/cron/audit-cleanup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AuditService } from '@/services/audit.service';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const daysToKeep = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '90');
  
  await AuditService.cleanupOldLogs(daysToKeep);

  return NextResponse.json({ 
    success: true, 
    message: `Cleaned up audit logs older than ${daysToKeep} days` 
  });
}
```

### Phase 12: Testing & Validation

#### 12.1 Manual Testing Checklist
- [ ] User login creates audit log
- [ ] User logout creates audit log
- [ ] Failed login attempt creates audit log
- [ ] Profile update creates audit log
- [ ] Password change creates audit log
- [ ] 2FA enable/disable creates audit log
- [ ] Admin user creation creates audit log
- [ ] Admin user update creates audit log
- [ ] Admin user deletion creates audit log
- [ ] Role change creates audit log
- [ ] System setting update creates audit log
- [ ] Maintenance action creates audit log
- [ ] ETL sync creates audit log (start and completion)
- [ ] Report generation creates audit log
- [ ] Report download creates audit log
- [ ] Alert acknowledgment creates audit log
- [ ] Audit logs page displays real data
- [ ] Filtering by category works
- [ ] Filtering by severity works
- [ ] Filtering by date range works
- [ ] Export to CSV works
- [ ] Pagination works
- [ ] Search functionality works

### Phase 13: Deployment

#### 13.1 Database Migration
- Create Prisma migration for AuditLog model updates
- Test in development environment
- Test in staging environment
- Run in production environment

#### 13.2 Environment Variables
- Add `AUDIT_LOG_RETENTION_DAYS` to environment variables
- Add `CRON_SECRET` for scheduled cleanup job

#### 13.3 Cron Job Setup
- Configure cron job for audit log cleanup (run weekly)
- Set up monitoring for cleanup job

## Implementation Order

1. **Phase 1**: Database schema updates (1 day)
2. **Phase 2**: Audit logging service (1 day)
3. **Phase 3**: Authentication audit logging (1 day)
4. **Phase 4**: Admin actions audit logging (1 day)
5. **Phase 5**: ETL audit logging (1 day)
6. **Phase 6**: Report generation audit logging (0.5 day)
7. **Phase 7**: Alert audit logging (0.5 day)
8. **Phase 8**: Audit logs API endpoint (1 day)
9. **Phase 9**: Admin audit logs page update (1 day)
10. **Phase 10**: Export functionality (0.5 day)
11. **Phase 11**: Automated cleanup (0.5 day)
12. **Phase 12**: Testing & validation (1-2 days)
13. **Phase 13**: Deployment (0.5 day)

**Total Estimated Time**: 10-12 days

## Dependencies

- Prisma ORM (already in use)
- Next.js API Routes (already in use)
- Cron job scheduler (node-cron or Vercel Cron)

## Risks & Mitigations

### Risk 1: Audit Logging Performance Impact
- **Mitigation**: Use async logging, don't block main operations, implement queue for high-volume logging

### Risk 2: Database Growth
- **Mitigation**: Implement retention policy, automated cleanup, compress old logs if needed

### Risk 3: Sensitive Information in Logs
- **Mitigation**: Sanitize sensitive data before logging, implement data masking for passwords, tokens, etc.

### Risk 4: Missing Logs Due to Errors
- **Mitigation**: Wrap audit logging in try-catch, log failures to system logs, don't throw errors

## Success Criteria

1. All user login/logout events are logged
2. All profile changes are logged
3. All admin actions are logged
4. All ETL operations are logged
5. All report generation/downloads are logged
6. All alert actions are logged
7. Admin audit logs page displays real data from database
8. Filtering and search work correctly
9. Export functionality works
10. Automated cleanup runs successfully
11. Audit logging doesn't impact application performance
12. Sensitive information is properly masked in logs
