'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Shield, Search, ChevronDown, LogOut, User, Settings, Menu, X, RefreshCw, Bell, ExternalLink, Command, ShoppingBag } from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'

export default function Navbar({ sidebarOpen, onToggleSidebar }: { sidebarOpen?: boolean, onToggleSidebar?: () => void }) {
  const { user, logout } = useAuth()
  const [userOpen, setUserOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const searchablePages = [
    { name: 'Dashboard', path: '/dashboard', icon: User, roles: ['OFFICER', 'ADMIN', 'SUPERADMIN', 'USER'], keywords: ['home', 'overview', 'stats'] },
    { name: 'Upload Document', path: '/dashboard/upload', icon: Shield, roles: ['OFFICER', 'ADMIN', 'SUPERADMIN', 'USER'], keywords: ['add', 'new', 'tdr', 'issue', 'request'] },
    { name: 'Request TDR Issue', path: '/dashboard/issue', icon: RefreshCw, roles: ['OFFICER', 'ADMIN', 'SUPERADMIN', 'USER'], keywords: ['mint', 'create', 'official'] },
    { name: 'Verify Authenticity', path: '/verify', icon: Shield, roles: ['OFFICER', 'ADMIN', 'SUPERADMIN', 'GUEST', 'USER'], keywords: ['check', 'audit', 'valid'] },
    { name: 'Marketplace', path: '/marketplace', icon: ShoppingBag, roles: ['OFFICER', 'ADMIN', 'SUPERADMIN', 'USER'], keywords: ['buy', 'sell', 'bids'] },
    { name: 'Admin Panel', path: '/admin', icon: Settings, roles: ['ADMIN', 'SUPERADMIN', 'JUNIOR', 'ASSISTANT', 'TDO', 'CITY', 'COMMISSIONER'], keywords: ['manage', 'approvals', 'requests'] },
    { name: 'User Management', path: '/admin/users', icon: User, roles: ['ADMIN', 'SUPERADMIN'], keywords: ['officers', 'staff', 'accounts'] },
    { name: 'Portal Settings', path: '/admin/settings', icon: Settings, roles: ['ADMIN', 'SUPERADMIN', 'USER'], keywords: ['password', 'profile', 'config'] },
  ]

  const filteredResults = searchQuery.trim() === ''
    ? []
    : searchablePages.filter(page =>
      (page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))) &&
      (!user || page.roles.includes(user.role))
    )

  return (
    <header
      className={`sticky top-0 z-[100] transition-all duration-500 backdrop-blur-xl border-b border-white/60 ${scrolled ? 'bg-white/70 shadow-[0_8px_32px_rgba(0,0,0,0.04)]' : 'bg-white/40'}`}
      style={{ WebkitBackdropFilter: 'blur(16px)' }}
    >
      {/* Official Government Strip */}


      {/* Main Navigation Bar */}
      <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between" style={{ height: 72 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>


          <Link href="/" className="flex items-center gap-4 group no-underline ml-2">
            <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30 group-hover:rotate-6 transition-transform">
              <Shield size={24} color="white" />
            </div>
            <div className="flex flex-col">
              <span style={{ fontSize: 19, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>
                e-TDR <span className="text-blue-600">Portal</span>
              </span>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>
                Blockchain Enabled Trust
              </span>
            </div>
          </Link>
        </div>

        {/* Global Search */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-12" style={{ position: 'relative' }}>
          <div style={{
            background: scrolled ? '#f1f5f9' : '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '0 16px',
            width: '100%',
            height: 42,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            transition: 'all 0.2s',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }} className="focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
            <Search size={16} color="#94a3b8" />
            <input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, width: '100%', fontWeight: 500 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#f8fafc', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>
              <Command size={10} /> K
            </div>
          </div>

          {searchQuery.trim() !== '' && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
              background: '#ffffff', border: '1px solid var(--border)',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              borderRadius: 14, overflow: 'hidden', zIndex: 1000
            }}>
              {filteredResults.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                  No matches for "<span style={{ fontWeight: 600 }}>{searchQuery}</span>"
                </div>
              ) : (
                <div style={{ padding: '6px' }}>
                  <div style={{ padding: '8px 12px', fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Results</div>
                  {filteredResults.map((page, idx) => (
                    <Link
                      key={idx}
                      href={page.path}
                      onClick={() => setSearchQuery('')}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors group no-underline"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                        <page.icon size={14} className="text-slate-500 group-hover:text-blue-600" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{page.name}</span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{page.keywords.slice(0, 2).join(' • ')}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <NotificationBell />

              <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />

              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserOpen(!userOpen)}
                  className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all bg-transparent cursor-pointer"
                >
                  <div className="flex flex-col items-end mr-1 hidden sm:flex">
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>{user.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#3b82f6' }}>{user.role}</span>
                  </div>
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {(user.name && user.name !== 'Authorized User') ? user.name[0].toUpperCase() : user.email?.[0].toUpperCase() || 'U'}
                  </div>
                  <ChevronDown size={14} color="#94a3b8" />
                </button>

                {userOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setUserOpen(false)} />
                    <div style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                      background: '#ffffff', border: '1px solid var(--border)',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                      borderRadius: 14, padding: 6, minWidth: 240, zIndex: 100
                    }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Connected Account</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{user.email}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>ID: {user.fabricID?.slice(0, 16)}...</div>
                      </div>
                      <div style={{ padding: 4 }}>
                        <Link href="/dashboard" onClick={() => setUserOpen(false)} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-blue-600 transition-all no-underline text-sm font-medium">
                          <User size={16} /> My Dashboard
                        </Link>
                        {user.role !== 'USER' && (
                          <Link href="/admin" onClick={() => setUserOpen(false)} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-blue-600 transition-all no-underline text-sm font-medium">
                            <Settings size={16} /> Administration
                          </Link>
                        )}
                        <button
                          onClick={() => { logout(); setUserOpen(false) }}
                          className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-red-50 text-red-600 transition-all text-sm font-medium border-none bg-transparent cursor-pointer"
                        >
                          <LogOut size={16} /> Sign Out Session
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors no-underline">
                Login
              </Link>
              <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-all no-underline flex items-center gap-2">
                Get Started <Shield size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
