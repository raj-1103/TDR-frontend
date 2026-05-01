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
    <div className="min-h-screen bg-[#f8fafc]" style={{ backgroundColor: '#f8fafc' }}>
      <Navbar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div style={{ display: 'flex' }}>
        {user && <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />}
        <main style={{ flex: 1, padding: '32px', minHeight: 'calc(100vh - 100px)', transition: 'all 0.3s ease' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
