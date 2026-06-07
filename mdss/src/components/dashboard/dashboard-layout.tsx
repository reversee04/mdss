'use client'

import { useEffect, useState } from 'react'
import { SidebarNav } from './sidebar-nav'
import { Navbar } from './navbar'
import { Sheet, SheetContent } from '@/components/ui/sheet'

type UserRole = 'admin' | 'analyst' | 'ministry'

interface DashboardLayoutProps {
  children: React.ReactNode
  role?: UserRole
}

function mapSessionRole(role?: string): UserRole {
  switch (role) {
    case 'admin':
    case 'System Admin':
      return 'admin'
    case 'data_analyst':
    case 'Analyst':
      return 'analyst'
    case 'ministry_official':
    case 'Ministry Official':
      return 'ministry'
    default:
      return 'analyst'
  }
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [resolvedRole, setResolvedRole] = useState<UserRole | null>(role ?? null)

  useEffect(() => {
    if (role) {
      setResolvedRole(role)
      return
    }

    let cancelled = false

    async function fetchSessionRole() {
      try {
        const response = await fetch('/api/auth/session')
        const session = await response.json()
        if (!cancelled) {
          setResolvedRole(mapSessionRole(session?.user?.role))
        }
      } catch (error) {
        console.error('Failed to resolve dashboard role:', error)
        if (!cancelled) setResolvedRole('analyst')
      }
    }

    fetchSessionRole()

    return () => {
      cancelled = true
    }
  }, [role])

  if (!resolvedRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading dashboard...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 lg:block">
        <SidebarNav role={resolvedRole} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarNav role={resolvedRole} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pl-64">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
