'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Activity,
  Users,
  Building2,
  Settings,
  FileText,
  Bell,
  Database,
  Shield,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  ClipboardList,
  UserCircle,
  LogOut,
  ChevronDown,
  Stethoscope,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

type UserRole = 'admin' | 'analyst' | 'ministry'

interface SidebarNavProps {
  role: UserRole
}

const adminNav = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { title: 'ETL Monitoring', href: '/admin/etl', icon: Database },
  { title: 'User Management', href: '/admin/users', icon: Users },
  { title: 'Thresholds', href: '/admin/disease-thresholds', icon: Users },
  // { title: 'Facility Management', href: '/admin/facilities', icon: Building2 },
  { title: 'API Integrations', href: '/admin/integrations', icon: Activity },
  { title: 'Audit Logs', href: '/admin/audit', icon: ClipboardList },
  { title: 'Notifications', href: '/admin/notifications', icon: Bell, badge: 2 },
  { title: 'Reports', href: '/admin/reports', icon: FileText },
  { title: 'Settings', href: '/settings', icon: Settings },
]

const analystNav = [
  { title: 'Dashboard', href: '/analyst', icon: LayoutDashboard },
  {
    title: 'Analytics',
    icon: BarChart3,
    children: [
      { title: 'Disease Trends', href: '/analyst/trends', icon: LineChart },
      { title: 'Geographic Analysis', href: '/analyst/geographic', icon: PieChart },
      { title: 'Demographics', href: '/analyst/demographics', icon: Users },
    ],
  },
  // { title: 'Treatment Effectiveness', href: '/analyst/treatment', icon: TrendingUp },
  { title: 'Patient Data', href: '/patient-data', icon: Stethoscope },
  { title: 'Alerts', href: '/alerts', icon: Bell, badge: 3 },
  { title: 'Reports', href: '/analyst/reports', icon: FileText },
  { title: 'Settings', href: '/settings', icon: Settings },
]

const ministryNav = [
  { title: 'Dashboard', href: '/ministry', icon: LayoutDashboard },
  { title: 'National Overview', href: '/ministry/overview', icon: BarChart3 },
  { title: 'Regional Analysis', href: '/ministry/regional', icon: PieChart },
  { title: 'Alerts', href: '/alerts', icon: Bell, badge: 3 },
  { title: 'Reports', href: '/ministry/reports', icon: FileText },
  { title: 'Settings', href: '/settings', icon: Settings },
]

const navConfig: Record<UserRole, typeof adminNav | typeof analystNav | typeof ministryNav> = {
  admin: adminNav,
  analyst: analystNav,
  ministry: ministryNav,
}

const roleLabels: Record<UserRole, string> = {
  admin: 'System Administrator',
  analyst: 'Data Analyst',
  ministry: 'Ministry Official',
}

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname()
  const navItems = navConfig[role]
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = (title: string) => {
    setOpenItems((prev) =>
      prev.includes(title) ? prev.filter((i) => i !== title) : [...prev, title]
    )
  }

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <Link href={`/${role}`} className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-sidebar-primary" />
          <div>
            <span className="font-bold text-lg">MDSS</span>
            <p className="text-xs text-sidebar-foreground/70">Malawi Health</p>
          </div>
        </Link>
      </div>

      {/* Role Badge */}
      <div className="px-4 py-3 border-b border-sidebar-border">
        <Badge variant="outline" className="w-full justify-center py-1 text-sidebar-foreground border-sidebar-border">
          {roleLabels[role]}
        </Badge>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            if ('children' in item && item.children) {
              const isOpen = openItems.includes(item.title)
              const isActive = item.children.some((child) => pathname === child.href)

              return (
                <Collapsible key={item.title} open={isOpen} onOpenChange={() => toggleItem(item.title)}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-between text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {item.title}
                      </span>
                      <ChevronDown
                        className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 pt-1 space-y-1">
                    {item.children.map((child) => (
                      <Button
                        key={child.href}
                        variant="ghost"
                        asChild
                        className={cn(
                          'w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                          pathname === child.href &&
                          'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
                        )}
                      >
                        <Link href={child.href}>
                          <child.icon className="mr-3 h-4 w-4" />
                          {child.title}
                        </Link>
                      </Button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )
            }

            const isActive = pathname === item.href

            return (
              <Button
                key={item.href}
                variant="ghost"
                asChild
                className={cn(
                  'w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive &&
                  'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
                )}
              >
                <Link href={item.href}>
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.title}
                  {'badge' in item && item.badge && (
                    <Badge className="ml-auto bg-destructive text-destructive-foreground">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </Button>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User Section */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <UserCircle className="h-10 w-10 text-sidebar-foreground/70" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Dr. Grace Banda</p>
            <p className="text-xs text-sidebar-foreground/70 truncate">g.banda@health.gov.mw</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          asChild
        >
          <Link href="/login">
            <LogOut className="mr-3 h-4 w-4" />
            Sign Out
          </Link>
        </Button>
      </div>
    </div>
  )
}
