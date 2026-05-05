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
      {/* Navbar — fixed at top, never scrolls */}
      <div style={{ flexShrink: 0 }}>
        <Navbar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      {/* Body row: sidebar + content, fills remaining viewport height */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar — scrolls independently if nav items overflow */}
        {user && (
          <div style={{ flexShrink: 0, overflowY: 'auto', height: '100%' }}>
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
          </div>
        )}

        {/* Main content — has its own scroll, sidebar unaffected */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px', transition: 'all 0.3s ease' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
