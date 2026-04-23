'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Shield, Bell, Search, ChevronDown, LogOut, User, Settings, Menu, X } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  return (
    <header style={{ borderBottom: '1px solid var(--border)', background: 'rgba(8,21,37,0.95)', backdropFilter: 'blur(16px)' }} className="sticky top-0 z-50">
      {/* Top strip */}
      <div style={{ background: 'var(--navy-900)', borderBottom: '1px solid var(--border)', padding: '6px 0', fontSize: 12, color: 'var(--text-secondary)' }}>
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <span>🛡️ <strong style={{ color: 'var(--text-primary)' }}>Official Portal</strong> of Surat Municipal Corporation — Government of Gujarat</span>
          <Link href="/verify" style={{ color: '#60a5fa', textDecoration: 'underline', fontSize: 12 }}>Verify Authenticity</Link>
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between" style={{ height: 64 }}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#1d4ed8,#0891b2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={20} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.2 }}>Surat Municipal Corporation</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>e-TDR Blockchain Portal</div>
          </div>
        </Link>

        {/* Search */}
        <div className="hidden md:flex items-center" style={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', gap: 8, width: 260 }}>
          <Search size={14} color="var(--text-secondary)" />
          <input placeholder="Search pages, services..." style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 13, width: '100%' }} />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* <button style={{ position: 'relative', background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}>
                <Bell size={16} color="var(--text-secondary)" />
                <span style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, background: '#ef4444', borderRadius: '50%' }} />
              </button> */}

              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserOpen(!userOpen)}
                  className="flex items-center gap-2"
                  style={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: 'var(--text-primary)' }}
                >
                  <div style={{ width: 26, height: 26, background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{user.name || user.email}</span>
                  <ChevronDown size={13} color="var(--text-secondary)" />
                </button>

                {userOpen && (
                  <div style={{ position: 'absolute', right: 0, top: '110%', background: 'var(--navy-800)', border: '1px solid var(--border)', borderRadius: 10, padding: 8, minWidth: 200, zIndex: 100 }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user.email}</div>
                      <div style={{ fontSize: 11, marginTop: 2 }}><span className="badge badge-approved">{user.role}</span></div>
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
              <Link href="/login" className="btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }}>Sign In</Link>
              <Link href="/register" className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>+ Register User</Link>
            </>
          )}

          <button className="md:hidden btn-ghost" style={{ padding: '8px 10px' }} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ borderTop: '1px solid var(--border)', background: 'var(--navy-900)', padding: '16px' }} className="md:hidden flex flex-col gap-2">
          <Link href="/" className="btn-ghost" style={{ justifyContent: 'flex-start' }}>Home</Link>
          <Link href="/dashboard" className="btn-ghost" style={{ justifyContent: 'flex-start' }}>Dashboard</Link>
          <Link href="/verify" className="btn-ghost" style={{ justifyContent: 'flex-start' }}>Verify</Link>
          {!user && <Link href="/login" className="btn-primary" style={{ justifyContent: 'flex-start' }}>Sign In</Link>}
        </div>
      )}
    </header>
  )
}
