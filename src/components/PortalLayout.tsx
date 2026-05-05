'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'

export default function PortalLayout({ children, publicOnly = false }: { children: React.ReactNode, publicOnly?: boolean }) {
  const { user } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (!publicOnly && !user) router.push('/login')
  }, [user, router, publicOnly])

  if (!user && !publicOnly) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
      <Navbar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {user && <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />}
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto', transition: 'all 0.3s ease' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
