'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
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
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--bg-page)' }}>
      {user && <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />}
      <main style={{ 
        flex: 1, 
        padding: '32px 24px', 
        maxWidth: '1600px', 
        margin: '0 auto', 
        width: '100%',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
      }}>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </main>
    </div>
  )
}
