'use client'

import { useState } from 'react'
import { DataTable } from '@/components/dashboard/data-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2, Plus, MapPin, Activity } from 'lucide-react'
import { facilities, districts } from '@/lib/mock-data'

const facilitiesWithStatus = facilities.map((f, i) => ({
  ...f,
  status: i === 2 ? 'offline' : i === 4 ? 'degraded' : 'online',
  lastReport: `2024-01-${15 - i} ${10 + i}:${30 - i * 5}`,
  recordsToday: Math.floor(Math.random() * 200) + 50,
}))

export default function FacilityManagementPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facility Management</h1>
          <p className="text-muted-foreground">
            Manage health facilities and their reporting status
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Facility
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Facility</DialogTitle>
              <DialogDescription>
                Register a new health facility in the surveillance system.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="facilityName">Facility Name</Label>
                <Input id="facilityName" placeholder="Enter facility name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem key={district} value={district.toLowerCase()}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Facility Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="central">Central Hospital</SelectItem>
                    <SelectItem value="district">District Hospital</SelectItem>
                    <SelectItem value="health-centre">Health Centre</SelectItem>
                    <SelectItem value="clinic">Clinic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="integration">Integration Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select integration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openmrs">OpenMRS</SelectItem>
                    <SelectItem value="dhis2">DHIS2 Direct</SelectItem>
                    <SelectItem value="manual">Manual Entry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsAddDialogOpen(false)}>
                Add Facility
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facilities</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{facilities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{facilitiesWithStatus.filter((f) => f.status === 'online').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Degraded</CardTitle>
            <Activity className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{facilitiesWithStatus.filter((f) => f.status === 'degraded').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <Activity className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{facilitiesWithStatus.filter((f) => f.status === 'offline').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Facilities Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Facilities</CardTitle>
          <CardDescription>Health facilities registered in the surveillance network</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={facilitiesWithStatus}
            columns={[
              {
                key: 'name',
                header: 'Facility',
                render: (item) => (
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {item.district}
                    </p>
                  </div>
                ),
              },
              {
                key: 'type',
                header: 'Type',
                render: (item) => <Badge variant="outline">{item.type}</Badge>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (item) => (
                  <Badge
                    variant={
                      item.status === 'online'
                        ? 'default'
                        : item.status === 'offline'
                        ? 'destructive'
                        : 'secondary'
                    }
                    className={
                      item.status === 'online'
                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                        : item.status === 'degraded'
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                        : ''
                    }
                  >
                    {item.status}
                  </Badge>
                ),
              },
              { key: 'lastReport', header: 'Last Report' },
              {
                key: 'recordsToday',
                header: 'Records Today',
                render: (item) => <span className="font-medium">{item.recordsToday}</span>,
              },
              {
                key: 'actions',
                header: '',
                render: () => (
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                ),
              },
            ]}
            searchPlaceholder="Search facilities..."
          />
        </CardContent>
      </Card>
    </div>
  )
}
