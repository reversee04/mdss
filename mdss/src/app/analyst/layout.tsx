import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

export default function AnalystLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout role="analyst">{children}</DashboardLayout>
}
