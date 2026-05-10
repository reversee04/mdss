import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

export default function MinistryLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout role="ministry">{children}</DashboardLayout>
}
