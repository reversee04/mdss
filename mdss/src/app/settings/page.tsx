'use client'

import { useState, useEffect, useRef } from 'react'
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
import { User, Shield, Bell, Database, Lock, Eye, Save, Upload, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function SettingsPage() {
  const { toast } = useToast()
  
  // Profile State
  const [profile, setProfile] = useState<any>({
    name: '', email: '', phone: '', job_title: '', department: '', profile_image_url: '', role: ''
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Password State
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [savingPassword, setSavingPassword] = useState(false)
  
  // 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  // Notifications State
  const [notifications, setNotifications] = useState<any>(null)
  const [savingNotifications, setSavingNotifications] = useState(false)

  // System State
  const [systemConfig, setSystemConfig] = useState<any>(null)
  const [maintenanceLoading, setMaintenanceLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchProfile()
    fetchNotifications()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/settings/profile')
      const data = await res.json()
      if (data.success) {
        setProfile(data.data)
        setTwoFactorEnabled(data.data.two_factor_enabled)
        if (data.data.role === 'System Admin') {
          fetchSystemConfig()
        }
      }
    } catch (error) {
      console.error('Error fetching profile', error)
    }
  }

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/settings/notifications')
      const data = await res.json()
      if (data.success) setNotifications(data.data)
    } catch (error) {
      console.error('Error fetching notifications', error)
    }
  }

  const fetchSystemConfig = async () => {
    try {
      const res = await fetch('/api/settings/system')
      const data = await res.json()
      if (data.success) setSystemConfig(data.data)
    } catch (error) {
      console.error('Error fetching system config', error)
    }
  }

  const handleProfileUpdate = async () => {
    setSavingProfile(true)
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Success", description: "Profile updated successfully." })
      } else {
        toast({ variant: "destructive", title: "Error", description: data.error || "Failed to update profile." })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/settings/profile/avatar', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        setProfile({ ...profile, profile_image_url: data.url })
        toast({ title: "Success", description: "Avatar uploaded successfully." })
      } else {
        toast({ variant: "destructive", title: "Error", description: data.error || "Failed to upload avatar." })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handlePasswordUpdate = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "New passwords do not match." })
      return
    }

    setSavingPassword(true)
    try {
      const res = await fetch('/api/settings/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Success", description: "Password updated successfully." })
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        toast({ variant: "destructive", title: "Error", description: data.error || "Failed to update password." })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." })
    } finally {
      setSavingPassword(false)
    }
  }

  const handle2FAToggle = async (enabled: boolean) => {
    try {
      const res = await fetch('/api/settings/profile/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })
      const data = await res.json()
      if (data.success) {
        setTwoFactorEnabled(enabled)
        toast({ title: "Success", description: `2FA ${enabled ? 'enabled' : 'disabled'} successfully.` })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update 2FA setting." })
    }
  }

  const handleNotificationUpdate = async (key: string, value: any) => {
    const updated = { ...notifications, [key]: value }
    setNotifications(updated)

    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      })
      if (!res.ok) throw new Error("Failed to update")
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update notification setting." })
      setNotifications(notifications) // Revert
    }
  }

  const runMaintenanceTask = async (action: string) => {
    setMaintenanceLoading(action)
    try {
      const res = await fetch('/api/settings/system/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Success", description: data.message })
      } else {
        toast({ variant: "destructive", title: "Error", description: data.error || "Task failed." })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." })
    } finally {
      setMaintenanceLoading(null)
    }
  }

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
            <TabsTrigger value="profile"><User className="h-4 w-4 mr-2" /> Profile</TabsTrigger>
            <TabsTrigger value="permissions"><Shield className="h-4 w-4 mr-2" /> Permissions</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-2" /> Notifications</TabsTrigger>
            {profile?.role === 'System Admin' && (
              <TabsTrigger value="system"><Database className="h-4 w-4 mr-2" /> System</TabsTrigger>
            )}
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
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {profile.profile_image_url ? (
                      <img src={profile.profile_image_url} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-primary">{profile.name ? profile.name.charAt(0) : 'U'}</span>
                    )}
                  </div>
                  <div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/png, image/jpeg" 
                      ref={fileInputRef} 
                      onChange={handleAvatarUpload}
                    />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
                      {uploadingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      Change Photo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG. Max 2MB</p>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={profile.email} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title</Label>
                    <Input id="title" value={profile.job_title} onChange={(e) => setProfile({...profile, job_title: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" value={profile.department} onChange={(e) => setProfile({...profile, department: e.target.value})} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleProfileUpdate} disabled={savingProfile}>
                    {savingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
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
                  <Input id="currentPassword" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={handlePasswordUpdate} disabled={savingPassword}>
                    {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Password
                  </Button>
                </div>
                <Separator />
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
                  <Switch checked={twoFactorEnabled} onCheckedChange={handle2FAToggle} />
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
                    <p className="font-semibold">{profile.role || 'User'}</p>
                    <p className="text-sm text-muted-foreground">Assigned system role</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium">Permissions</h4>
                  <div className="grid gap-3">
                    {[
                      { name: 'View Dashboard', granted: true },
                      { name: 'Manage Users', granted: profile.role === 'System Admin' },
                      { name: 'Manage Facilities', granted: profile.role === 'System Admin' || profile.role === 'Data Entry' },
                      { name: 'View Patient Data', granted: true },
                      { name: 'Generate Reports', granted: profile.role === 'System Admin' || profile.role === 'Analyst' },
                      { name: 'Configure System', granted: profile.role === 'System Admin' },
                      { name: 'View Audit Logs', granted: profile.role === 'System Admin' },
                      { name: 'Manage Integrations', granted: profile.role === 'System Admin' },
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
            {notifications && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Configure how and when you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Alert Notifications</h4>
                    {[
                      { key: 'critical_outbreak_alerts', name: 'Critical outbreak alerts', description: 'Immediate notifications for outbreak detection' },
                      { key: 'high_severity_alerts', name: 'High severity alerts', description: 'Alerts for significant health concerns' },
                      { key: 'medium_severity_alerts', name: 'Medium severity alerts', description: 'Notifications for moderate issues' },
                      { key: 'data_quality_alerts', name: 'Data quality alerts', description: 'Issues with data integrity or completeness' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <Switch checked={notifications[item.key]} onCheckedChange={(c) => handleNotificationUpdate(item.key, c)} />
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">System Notifications</h4>
                    {[
                      { key: 'etl_pipeline_status', name: 'ETL pipeline status', description: 'Updates on data processing jobs' },
                      { key: 'system_maintenance', name: 'System maintenance', description: 'Scheduled maintenance notifications' },
                      { key: 'report_generation', name: 'Report generation', description: 'Notifications when reports are ready' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <Switch checked={notifications[item.key]} onCheckedChange={(c) => handleNotificationUpdate(item.key, c)} />
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Email Digest Frequency</Label>
                    <Select value={notifications.email_digest_frequency} onValueChange={(v) => handleNotificationUpdate('email_digest_frequency', v)}>
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
            )}
          </TabsContent>

          {/* System Tab */}
          {profile?.role === 'System Admin' && (
            <TabsContent value="system">
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                  <CardDescription>Configure system-wide settings (Admin only)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {systemConfig && Object.entries(systemConfig).map(([category, items]: [string, any]) => (
                    <div key={category} className="space-y-4">
                      <h4 className="font-medium capitalize">{category} Settings</h4>
                      {items.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{item.key.replace(/_/g, ' ')}</p>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                          {item.value === 'true' || item.value === 'false' ? (
                            <Switch checked={item.value === 'true'} />
                          ) : (
                            <Input defaultValue={item.value} className="w-24" />
                          )}
                        </div>
                      ))}
                      <Separator />
                    </div>
                  ))}

                  <div className="space-y-4">
                    <h4 className="font-medium">Maintenance</h4>
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => runMaintenanceTask('clear_cache')} disabled={maintenanceLoading === 'clear_cache'}>
                        {maintenanceLoading === 'clear_cache' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Clear Cache
                      </Button>
                      <Button variant="outline" onClick={() => runMaintenanceTask('export_logs')} disabled={maintenanceLoading === 'export_logs'}>
                        {maintenanceLoading === 'export_logs' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Export System Logs
                      </Button>
                      <Button variant="outline" onClick={() => runMaintenanceTask('run_diagnostics')} disabled={maintenanceLoading === 'run_diagnostics'}>
                        {maintenanceLoading === 'run_diagnostics' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Run Diagnostics
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
