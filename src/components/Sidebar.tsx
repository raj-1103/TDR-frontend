'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { LayoutDashboard, Upload, UploadCloud, ArrowLeftRight, CheckCircle, ShieldCheck, Users, FileSearch, LogOut, Clock, Settings, Menu, ShoppingBag, ListChecks } from 'lucide-react'

  const authorityRoles = ['ADMIN', 'SUPERADMIN', 'JUNIOR', 'ASSISTANT', 'TDO', 'CITY', 'COMMISSIONER']

  const navItems = [
    { href: '/dashboard',          label: 'Dashboard',         icon: LayoutDashboard, roles: [...authorityRoles, 'USER'] },
    { href: '/dashboard/upload',   label: 'Upload Document',   icon: Upload,          roles: [...authorityRoles, 'USER'] },
    { href: '/dashboard/issue',    label: 'Request TDR Issue', icon: CheckCircle,     roles: [...authorityRoles, 'USER'] },
    { href: '/dashboard/transfer', label: 'Request Transfer',  icon: ArrowLeftRight,  roles: [...authorityRoles, 'USER'] },
    { href: '/marketplace',        label: 'Marketplace',       icon: ShoppingBag,     roles: [...authorityRoles, 'USER'] },
    { href: '/history',            label: 'Document History',  icon: Clock,           roles: [...authorityRoles, 'USER'] },
    { href: '/verify',             label: 'Verify Document',   icon: FileSearch,      roles: [...authorityRoles, 'USER'] },
    { href: '/admin',              label: 'Admin Panel',       icon: ShieldCheck,     roles: authorityRoles },
    { href: '/admin/approvals',    label: 'Pending Approvals', icon: ListChecks,      roles: authorityRoles },
    { href: '/admin/users',        label: 'Manage Admins',     icon: Users,           roles: ['ADMIN','SUPERADMIN'] }, // Keep this restricted
    { href: '/admin/bulk-upload',  label: 'Bulk Upload',       icon: UploadCloud,     roles: ['ADMIN','SUPERADMIN'] },
    { href: '/admin/settings',     label: 'Settings',          icon: Settings,        roles: [...authorityRoles, 'USER'] },
  ]

export default function Sidebar({ isOpen, onToggle }: { isOpen: boolean, onToggle: () => void }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const visible = navItems.filter(i => user && i.roles.includes(user.role))

  return (
    <aside 
      className="min-h-screen bg-[#11233d] flex flex-col p-0 shrink-0 text-white" 
      style={{ 
        width: isOpen ? 280 : 0, 
        overflow: 'hidden', 
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isOpen ? 1 : 0,
        backgroundColor: '#11233d',
        height: '100%',
        overflowY: 'auto',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
      }}
    >
      {/* Sidebar Header */}
      <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>

        <button 
          onClick={onToggle}
          style={{ background: '#1e40af', border: '1px solid #3b82f6', padding: 8, borderRadius: 10, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Menu size={22} />
        </button>
      </div>

      <div style={{ padding: '0 24px 12px', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
        Navigation
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, padding: '0 16px' }}>
        {visible.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: active ? 700 : 500,
                color: active ? 'white' : 'rgba(255,255,255,0.6)',
                background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <Icon size={20} style={{ opacity: active ? 1 : 0.6 }} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={logout}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 8, fontSize: 13, color: '#f87171', background: 'rgba(239,68,68,0.05)', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 600 }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  )
}