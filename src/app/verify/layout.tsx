'use client'
import PortalLayout from '@/components/PortalLayout'

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout publicOnly={true}>{children}</PortalLayout>
}
