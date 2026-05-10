'use client'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { User, Shield, Bell, Database, Lock, Eye, Save } from 'lucide-react'

export default function SettingsPage() {
  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile and system preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="permissions">
              <Shield className="h-4 w-4 mr-2" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="system">
              <Database className="h-4 w-4 mr-2" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">GB</span>
                  </div>
                  <div>
                    <Button variant="outline" size="sm">Change Photo</Button>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG. Max 2MB</p>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue="Grace" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="Banda" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="g.banda@health.gov.mw" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" defaultValue="+265 999 123 456" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title</Label>
                    <Input id="title" defaultValue="System Administrator" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" defaultValue="Health Information Systems" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage your password and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex justify-end">
                  <Button variant="outline">Update Password</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle>Role Permissions</CardTitle>
                <CardDescription>View your current role and permissions (read-only)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                  <Shield className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold">System Administrator</p>
                    <p className="text-sm text-muted-foreground">Full system access</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium">Permissions</h4>
                  <div className="grid gap-3">
                    {[
                      { name: 'View Dashboard', granted: true },
                      { name: 'Manage Users', granted: true },
                      { name: 'Manage Facilities', granted: true },
                      { name: 'View Patient Data', granted: true },
                      { name: 'Generate Reports', granted: true },
                      { name: 'Configure System', granted: true },
                      { name: 'View Audit Logs', granted: true },
                      { name: 'Manage Integrations', granted: true },
                    ].map((permission) => (
                      <div key={permission.name} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span>{permission.name}</span>
                        </div>
                        <Badge variant={permission.granted ? 'default' : 'secondary'} className={permission.granted ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                          {permission.granted ? 'Granted' : 'Denied'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Alert Notifications</h4>
                  {[
                    { name: 'Critical outbreak alerts', description: 'Immediate notifications for outbreak detection' },
                    { name: 'High severity alerts', description: 'Alerts for significant health concerns' },
                    { name: 'Medium severity alerts', description: 'Notifications for moderate issues' },
                    { name: 'Data quality alerts', description: 'Issues with data integrity or completeness' },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium">System Notifications</h4>
                  {[
                    { name: 'ETL pipeline status', description: 'Updates on data processing jobs' },
                    { name: 'System maintenance', description: 'Scheduled maintenance notifications' },
                    { name: 'Report generation', description: 'Notifications when reports are ready' },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <Switch defaultChecked={item.name !== 'Report generation'} />
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Email Digest Frequency</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Configure system-wide settings (Admin only)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Data Settings</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-refresh dashboard</p>
                      <p className="text-sm text-muted-foreground">Automatically refresh data every 5 minutes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Data anonymization</p>
                      <p className="text-sm text-muted-foreground">Anonymize patient identifiers in exports</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium">Alert Thresholds</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Outbreak detection threshold</Label>
                      <Input type="number" defaultValue="20" />
                      <p className="text-xs text-muted-foreground">Cases per day to trigger alert</p>
                    </div>
                    <div className="space-y-2">
                      <Label>CFR alert threshold</Label>
                      <Input type="number" defaultValue="5" />
                      <p className="text-xs text-muted-foreground">Percentage to trigger fatality alert</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium">Maintenance</h4>
                  <div className="flex gap-4">
                    <Button variant="outline">Clear Cache</Button>
                    <Button variant="outline">Export System Logs</Button>
                    <Button variant="outline">Run Diagnostics</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
