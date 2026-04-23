'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { LayoutDashboard, Upload, ArrowLeftRight, CheckCircle, ShieldCheck, Users, FileSearch, LogOut, Clock, Settings } from 'lucide-react'

const navItems = [
  { href: '/dashboard',          label: 'Dashboard',         icon: LayoutDashboard, roles: ['USER','ADMIN','SUPERADMIN'] },
  { href: '/dashboard/upload',   label: 'Upload Document',   icon: Upload,          roles: ['USER','ADMIN','SUPERADMIN'] },
  { href: '/dashboard/issue',    label: 'Request TDR Issue', icon: CheckCircle,     roles: ['USER','ADMIN','SUPERADMIN'] },
  { href: '/dashboard/transfer', label: 'Request Transfer',  icon: ArrowLeftRight,  roles: ['USER','ADMIN','SUPERADMIN'] },
  { href: '/history',            label: 'Document History',  icon: Clock,           roles: ['USER','ADMIN','SUPERADMIN'] },
  { href: '/verify',             label: 'Verify Document',   icon: FileSearch,      roles: ['USER','ADMIN','SUPERADMIN'] },
  { href: '/admin',              label: 'Admin Panel',       icon: ShieldCheck,     roles: ['ADMIN','SUPERADMIN'] },
  { href: '/admin/users',        label: 'Manage Admins',     icon: Users,           roles: ['SUPERADMIN'] },
  { href: '/admin/settings',     label: 'Settings',          icon: Settings,        roles: ['USER','ADMIN','SUPERADMIN'] },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const visible = navItems.filter(i => user && i.roles.includes(user.role))

  return (
    <aside style={{ width: 220, minHeight: '100vh', background: 'var(--navy-900)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '20px 10px', flexShrink: 0 }}>
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {visible.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? '#60a5fa' : 'var(--text-secondary)',
                background: active ? 'rgba(96,165,250,0.1)' : 'transparent',
                border: active ? '1px solid rgba(96,165,250,0.2)' : '1px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
        <div style={{ padding: '8px 12px', marginBottom: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name || user?.email}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{user?.role}</div>
        </div>
        <button
          onClick={logout}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, fontSize: 13, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </aside>
  )
}