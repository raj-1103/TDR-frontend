'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Shield, Search, ChevronDown, LogOut, User, Settings, Menu, X, RefreshCw } from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'

export default function Navbar({ sidebarOpen, onToggleSidebar }: { sidebarOpen?: boolean, onToggleSidebar?: () => void }) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const searchablePages = [
    { name: 'Dashboard', path: '/dashboard', icon: User, roles: ['OFFICER', 'ADMIN', 'SUPERADMIN'], keywords: ['home', 'overview', 'stats'] },
    { name: 'Upload Document', path: '/dashboard/upload', icon: Shield, roles: ['OFFICER', 'ADMIN', 'SUPERADMIN'], keywords: ['add', 'new', 'tdr', 'issue', 'request'] },
    { name: 'Request Transfer', path: '/dashboard', icon: RefreshCw, roles: ['OFFICER', 'ADMIN', 'SUPERADMIN'], keywords: ['transfer', 'send', 'move', 'change owner'] },
    { name: 'Verify Authenticity', path: '/verify', icon: Shield, roles: ['OFFICER', 'ADMIN', 'SUPERADMIN', 'GUEST'], keywords: ['check', 'audit', 'valid'] },
    { name: 'Document History', path: '/history', icon: Search, roles: ['OFFICER', 'ADMIN', 'SUPERADMIN'], keywords: ['logs', 'timeline', 'events', 'audit trail'] },
    { name: 'Admin Panel', path: '/admin', icon: Settings, roles: ['ADMIN', 'SUPERADMIN'], keywords: ['manage', 'approvals', 'requests'] },
    { name: 'User Management', path: '/admin/users', icon: User, roles: ['ADMIN', 'SUPERADMIN'], keywords: ['officers', 'staff', 'accounts'] },
    { name: 'Portal Settings', path: '/admin/settings', icon: Settings, roles: ['ADMIN', 'SUPERADMIN'], keywords: ['password', 'profile', 'config'] },
  ]

  const filteredResults = searchQuery.trim() === '' 
    ? [] 
    : searchablePages.filter(page => 
        (page.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
         page.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))) &&
        (!user || page.roles.includes(user.role))
      )



  return (
    <header className="sticky top-0 z-50 bg-[#11233d] border-b border-white/5" style={{ backgroundColor: '#11233d' }}>
      {/* Top strip */}
      <div style={{ background: '#11233d', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '8px 0', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={14} color="#10b981" />
            <span><strong style={{ color: '#ffffff' }}>Official Portal</strong> of Surat Municipal Corporation — Government of Gujarat</span>
          </div>
          <Link href="/verify" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>Verify Authenticity</Link>
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between" style={{ height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {onToggleSidebar && !sidebarOpen && (
            <button 
              onClick={onToggleSidebar}
              style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Menu size={24} />
            </button>
          )}
          {/* Logo */}
        <Link href="/" className="flex items-center">
          <img src="/smc-logo-white.png" alt="SMC e-TDR Portal" style={{ height: 64, objectFit: 'contain' }} />
        </Link>
        </div>

        {/* Search */}
        <div className="hidden md:flex items-center" style={{ position: 'relative' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 16px', gap: 10, width: 320, display: 'flex', alignItems: 'center' }}>
            <Search size={16} color="rgba(255,255,255,0.5)" />
            <input 
              placeholder="Search pages, services..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: 14, width: '100%' }} 
            />
          </div>

          {searchQuery.trim() !== '' && filteredResults.length === 0 && (
            <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: '#ffffff', border: '1px solid var(--border)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', borderRadius: 10, padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 13, zIndex: 1000 }}>
              No results found for "{searchQuery}"
            </div>
          )}

          {filteredResults.length > 0 && (

            <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: '#ffffff', border: '1px solid var(--border)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', borderRadius: 10, overflow: 'hidden', zIndex: 1000 }}>
              {filteredResults.map((page, idx) => (
                <Link 
                  key={idx} 
                  href={page.path}
                  onClick={() => setSearchQuery('')}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: 'var(--text-primary)', textDecoration: 'none', fontSize: 13, borderBottom: idx === filteredResults.length - 1 ? 'none' : '1px solid var(--border)', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <page.icon size={14} color="var(--text-secondary)" />
                  {page.name}
                </Link>
              ))}
            </div>
          )}
        </div>


        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <NotificationBell />
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserOpen(!userOpen)}
                  className="flex items-center gap-3"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
                >
                  <div style={{ width: 42, height: 42, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <User size={20} />
                  </div>
                  <div style={{ textAlign: 'left', display: 'none', md: 'block' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>{user.name || 'Guest User'}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: 500 }}>Portal Access</div>
                  </div>
                  <ChevronDown size={14} color="rgba(255,255,255,0.4)" />
                </button>

                {userOpen && (
                  <div style={{ position: 'absolute', right: 0, top: '110%', background: '#ffffff', border: '1px solid var(--border)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', borderRadius: 10, padding: 8, minWidth: 200, zIndex: 100 }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user.email}</div>
                      <div style={{ fontSize: 11, marginTop: 4 }}><span className="badge badge-approved">{user.role}</span></div>
                    </div>
                    <Link href="/dashboard" onClick={() => setUserOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', borderRadius: 6, cursor: 'pointer', textDecoration: 'none' }}>
                      <User size={14} /> Dashboard
                    </Link>
                    {(user.role === 'ADMIN' || user.role === 'SUPERADMIN') && (
                      <Link href="/admin" onClick={() => setUserOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', borderRadius: 6, cursor: 'pointer', textDecoration: 'none' }}>
                        <Settings size={14} /> Admin Panel
                      </Link>
                    )}
                    <button onClick={() => { logout(); setUserOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 13, color: '#f87171', borderRadius: 6, cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left' }}>
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost" style={{ border: '1px solid rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Sign In</Link>
              <Link href="/register" className="btn-primary" style={{ padding: '12px 24px', fontSize: 14, fontWeight: 700, borderRadius: 10, gap: 10, background: '#1e40af', border: '1px solid #3b82f6' }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>+</span> Register User
              </Link>
            </>
          )}

          <button className="md:hidden btn-ghost" style={{ padding: '8px 10px' }} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ borderTop: '1px solid var(--border)', background: '#ffffff', padding: '16px' }} className="md:hidden flex flex-col gap-2">
          <Link href="/" className="btn-ghost" style={{ justifyContent: 'flex-start' }}>Home</Link>
          <Link href="/dashboard" className="btn-ghost" style={{ justifyContent: 'flex-start' }}>Dashboard</Link>
          <Link href="/verify" className="btn-ghost" style={{ justifyContent: 'flex-start' }}>Verify</Link>
          {!user && <Link href="/login" className="btn-primary" style={{ justifyContent: 'flex-start' }}>Sign In</Link>}
        </div>
      )}
    </header>
  )
}
