# Settings Pages and Profile Management Implementation Plan

## Overview

This document outlines the implementation plan for making all settings pages and profile management settings functional in the MDSS application.

## Current State

### Existing Settings Page
- **Location**: `src/app/settings/page.tsx`
- **Tabs**: Profile, Permissions, Notifications, System
- **Status**: UI exists but has no backend integration - all values are hardcoded

### Database Schema
- **User Model**: `user_id`, `name`, `email`, `password_hash`, `role`, `status`, `last_login`, `created_at`, `updated_at`
- **Gaps**: No UserSettings, NotificationPreferences, or SystemConfiguration tables

### Existing APIs
- `/api/admin/users` - GET all users, POST create user
- **Gaps**: No APIs for profile updates, password changes, notification preferences, or system settings

## Implementation Plan

### Phase 1: Database Schema Updates

#### 1.1 Add UserSettings Table
```prisma
model UserSettings {
  id                String   @id @default(cuid())
  user_id           String   @unique
  user              User     @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  
  // Profile Information
  phone             String?  @db.VarChar(20)
  job_title         String?  @db.VarChar(100)
  department        String?  @db.VarChar(100)
  profile_image_url String?  @db.VarChar(500)
  
  // Security Settings
  two_factor_enabled Boolean @default(false)
  two_factor_secret String?  @db.VarChar(255)
  
  // UI Preferences
  theme             String   @default("light") // light, dark, system
  language          String   @default("en")
  timezone          String   @default("Africa/Blantyre")
  
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
}
```

#### 1.2 Add NotificationPreferences Table
```prisma
model NotificationPreferences {
  id                   String   @id @default(cuid())
  user_id              String   @unique
  user                 User     @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  
  // Alert Notifications
  critical_outbreak_alerts    Boolean @default(true)
  high_severity_alerts        Boolean @default(true)
  medium_severity_alerts      Boolean @default(true)
  data_quality_alerts         Boolean @default(true)
  
  // System Notifications
  etl_pipeline_status        Boolean @default(true)
  system_maintenance          Boolean @default(true)
  report_generation           Boolean @default(false)
  
  // Email Settings
  email_digest_frequency      String   @default("daily") // realtime, hourly, daily, weekly
  email_enabled               Boolean  @default(true)
  
  created_at                  DateTime @default(now())
  updated_at                  DateTime @updatedAt
}
```

#### 1.3 Add SystemConfiguration Table
```prisma
model SystemConfiguration {
  id                    String   @id @default(cuid())
  key                   String   @unique
  value                 String
  description           String?  @db.Text
  category              String   @default("general") // general, data, alerts, maintenance
  
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
}
```

#### 1.4 Update User Model
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
}
```

### Phase 2: API Endpoints

#### 2.1 Profile Management APIs

**GET /api/settings/profile**
- Get current user's profile information
- Returns: name, email, phone, job_title, department, profile_image_url, role, status

**PUT /api/settings/profile**
- Update user's profile information
- Body: { name, phone, job_title, department }
- Validates: email uniqueness, required fields

**POST /api/settings/profile/avatar**
- Upload profile image
- Validates: file type (JPG, PNG), size (max 2MB)
- Stores: file URL in UserSettings.profile_image_url

**POST /api/settings/profile/password**
- Change user's password
- Body: { currentPassword, newPassword, confirmPassword }
- Validates: current password, password strength, confirmation match
- Updates: password_hash in User table

**POST /api/settings/profile/2fa**
- Enable/disable two-factor authentication
- Body: { enabled: boolean }
- Generates/revokes 2FA secret

#### 2.2 Notification Preferences APIs

**GET /api/settings/notifications**
- Get user's notification preferences
- Returns: all notification preference settings

**PUT /api/settings/notifications**
- Update notification preferences
- Body: { critical_outbreak_alerts, high_severity_alerts, medium_severity_alerts, data_quality_alerts, etl_pipeline_status, system_maintenance, report_generation, email_digest_frequency, email_enabled }

#### 2.3 System Settings APIs (Admin Only)

**GET /api/settings/system**
- Get system-wide configuration
- Returns: all system settings grouped by category

**PUT /api/settings/system**
- Update system configuration (admin only)
- Body: { key, value }
- Validates: admin role, valid configuration keys

**POST /api/settings/system/maintenance**
- Trigger maintenance tasks
- Body: { action: "clear_cache" | "export_logs" | "run_diagnostics" }
- Returns: task result

### Phase 3: Frontend Implementation

#### 3.1 Profile Tab Updates

**Profile Information Section**
- Load user data from `/api/settings/profile` on mount
- Implement form state management
- Add validation for required fields
- Implement save functionality with loading states
- Add success/error toast notifications
- Implement profile image upload with preview

**Security Section**
- Load current 2FA status from `/api/settings/profile`
- Implement password change form with validation
- Add password strength indicator
- Implement 2FA toggle with confirmation
- Add success/error toast notifications

#### 3.2 Permissions Tab Updates

- Load user's role and permissions from `/api/settings/profile`
- Display current role with badge
- Show permissions list with granted/denied status
- Keep read-only as designed (permissions managed by admin)

#### 3.3 Notifications Tab Updates

- Load notification preferences from `/api/settings/notifications` on mount
- Implement state management for all toggles
- Implement save functionality with loading states
- Add success/error toast notifications
- Implement email digest frequency selector

#### 3.4 System Tab Updates

- Load system configuration from `/api/settings/system` on mount
- Implement state management for all settings
- Add admin role check (hide/disable for non-admins)
- Implement save functionality with loading states
- Implement maintenance action buttons with loading states
- Add success/error toast notifications

### Phase 4: Security Considerations

#### 4.1 Authentication & Authorization
- All settings APIs require authentication
- System settings APIs require admin role
- Validate user can only modify their own settings
- Implement role-based access control (RBAC)

#### 4.2 Data Validation
- Validate all input data on both client and server
- Sanitize user inputs to prevent XSS
- Validate file uploads (type, size, content)
- Implement password strength requirements (min 8 chars, uppercase, lowercase, number, special char)

#### 4.3 Audit Logging
- Log all profile changes to AuditLog table
- Log all password changes
- Log all system configuration changes
- Include user_id, action, entity_affected, timestamp, details

#### 4.4 Password Security
- Use bcrypt for password hashing (already implemented)
- Implement rate limiting for password change attempts
- Log out user from all sessions after password change
- Send email notification on password change

### Phase 5: Testing & Validation

#### 5.1 Unit Tests
- Test all API endpoints
- Test validation logic
- Test password strength validation
- Test file upload validation

#### 5.2 Integration Tests
- Test profile update flow
- Test password change flow
- Test notification preferences update
- Test system settings update (admin only)

#### 5.3 Manual Testing Checklist
- [ ] Profile information can be updated
- [ ] Profile image can be uploaded
- [ ] Password can be changed with correct current password
- [ ] Password change fails with incorrect current password
- [ ] Password change fails with weak password
- [ ] 2FA can be enabled/disabled
- [ ] Notification preferences can be updated
- [ ] Email digest frequency can be changed
- [ ] System settings can be updated (admin only)
- [ ] Non-admins cannot access system settings
- [ ] Audit logs are created for all changes
- [ ] Toast notifications show success/error messages

### Phase 6: Deployment

#### 6.1 Database Migration
- Create Prisma migration for new tables
- Run migration in development environment
- Test migration in staging environment
- Run migration in production environment

#### 6.2 API Deployment
- Deploy new API endpoints
- Update API documentation
- Test endpoints in production

#### 6.3 Frontend Deployment
- Deploy updated settings page
- Test in production environment
- Monitor for errors

## Implementation Order

1. **Phase 1**: Database schema updates (1-2 days)
2. **Phase 2**: API endpoints implementation (2-3 days)
3. **Phase 3**: Frontend implementation (2-3 days)
4. **Phase 4**: Security implementation (1-2 days, can be done in parallel with Phase 2-3)
5. **Phase 5**: Testing & validation (2-3 days)
6. **Phase 6**: Deployment (1 day)

**Total Estimated Time**: 9-14 days

## Dependencies

- Prisma ORM
- Next.js API Routes
- bcryptjs (already installed)
- File upload library (e.g., formidable or next-connect)
- Toast notification library (already in use)
- Form validation library (e.g., zod or react-hook-form)

## Risks & Mitigations

### Risk 1: Database Migration Issues
- **Mitigation**: Test migrations thoroughly in development and staging before production
- **Backup**: Create database backup before production migration

### Risk 2: File Upload Security
- **Mitigation**: Implement strict file validation (type, size, content scanning)
- **Storage**: Use secure storage (e.g., AWS S3 with proper permissions)

### Risk 3: Password Change Vulnerabilities
- **Mitigation**: Implement rate limiting, strong validation, and audit logging
- **Session Management**: Invalidate all sessions after password change

### Risk 4: Permission Escalation
- **Mitigation**: Strict RBAC implementation, server-side validation for all admin operations
- **Audit**: Log all admin actions for review

## Success Criteria

1. All profile management settings are functional
2. User can update personal information
3. User can change password securely
4. User can manage notification preferences
5. Admin can manage system settings
6. All changes are properly audited
7. Security best practices are followed
8. User experience is smooth with proper feedback
