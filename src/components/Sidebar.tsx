'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard, Upload, UploadCloud, ArrowLeftRight,
  CheckCircle, ShieldCheck, Users, FileSearch, LogOut,
  Clock, Settings, Menu, ShoppingBag, ListChecks, ChevronRight, X
} from 'lucide-react'

const authorityRoles = ['ADMIN', 'SUPERADMIN', 'JUNIOR', 'ASSISTANT', 'TDO', 'CITY', 'COMMISSIONER']

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: [...authorityRoles, 'USER'] },
  { href: '/dashboard/upload', label: 'Upload Document', icon: Upload, roles: [...authorityRoles, 'USER'] },
  { href: '/dashboard/issue', label: 'Request TDR Issue', icon: CheckCircle, roles: [...authorityRoles, 'USER'] },
  { href: '/dashboard/transfer', label: 'Transfer Request', icon: ArrowLeftRight, roles: [...authorityRoles, 'USER'] },
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag, roles: [...authorityRoles, 'USER'] },
  { href: '/history', label: 'Activity History', icon: Clock, roles: [...authorityRoles, 'USER'] },
  { href: '/verify', label: 'Verify Audit', icon: FileSearch, roles: [...authorityRoles, 'USER'] },
  { href: '/admin', label: 'Admin Control', icon: ShieldCheck, roles: authorityRoles },
  { href: '/admin/approvals', label: 'Approval Queue', icon: ListChecks, roles: authorityRoles },
  { href: '/admin/users', label: 'User Management', icon: Users, roles: ['ADMIN', 'SUPERADMIN'] },
  { href: '/admin/bulk-upload', label: 'Bulk Processing', icon: UploadCloud, roles: ['ADMIN', 'SUPERADMIN'] },
  { href: '/admin/settings', label: 'Portal Settings', icon: Settings, roles: [...authorityRoles, 'USER'] },
]

export default function Sidebar({ isOpen, onToggle }: { isOpen: boolean, onToggle: () => void }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const visible = navItems.filter(i => user && i.roles.includes(user.role))

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onToggle}
      />

      <aside
        onClick={(e) => e.stopPropagation()}
        className={`fixed lg:sticky top-0 lg:top-[73px] left-0 bottom-0 z-[150] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] border-r border-slate-800 flex flex-col ${isOpen ? 'w-[280px] translate-x-0' : 'w-0 -translate-x-full lg:w-[80px] lg:translate-x-0'
          }`}
        style={{
          background: '#0f172a',
          height: 'calc(100vh - 73px)',
          minHeight: 'calc(100vh - 73px)'
        }}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header Area - Clean & Informative */}
          <div className={`p-6 flex items-center ${isOpen ? 'justify-between' : 'justify-center'}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            {isOpen && (
              <div className="flex items-center gap-3 animate-in fade-in duration-500">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <LayoutDashboard size={18} color="white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-white uppercase tracking-[0.1em]">Navigation</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Control Center</span>
                </div>
              </div>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              className={`flex items-center justify-center rounded-xl transition-all duration-200 border border-transparent hover:bg-slate-700/50 cursor-pointer ${isOpen ? 'w-8 h-8 text-slate-400 hover:text-white' : 'w-10 h-10 bg-slate-800 text-slate-300 shadow-sm'}`}
            >
              <Menu size={isOpen ? 18 : 20} />
            </button>
          </div>

          {/* Scrollable Navigation - Updated class for visibility */}
          <div className="flex-1 overflow-y-auto px-3 py-4 visible-scrollbar">
            <nav className="space-y-1.5 pb-20">
              {visible.map(({ href, label, icon: Icon }) => {
                const active = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    title={!isOpen ? label : ''}
                    className={`flex items-center group no-underline transition-all duration-200 ${isOpen ? 'px-4 py-2.5 rounded-xl gap-3' : 'p-3 justify-center rounded-xl'
                      } ${active
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                  >
                    <Icon size={20} className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    {isOpen && (
                      <span className="text-[13px] font-bold whitespace-nowrap overflow-hidden tracking-tight">
                        {label}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* STICKY FOOTER / Profile Card */}
          <div className="mt-auto border-t border-slate-800 bg-[#0f172a] p-4 z-10">
            {isOpen ? (
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800/50 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shrink-0">
                    {(user?.name && user.name !== 'Authorized User') ? user.name[0].toUpperCase() : user?.email?.[0].toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="text-sm font-black text-white truncate leading-tight">{user?.name}</span>
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">Role: {user?.role}</span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-black border border-red-500/20 cursor-pointer uppercase tracking-tighter"
                >
                  <LogOut size={14} /> Terminate Session
                </button>
              </div>
            ) : (
              <button
                onClick={logout}
                title="Sign Out"
                className="w-12 h-12 mx-auto rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-500/20 cursor-pointer shadow-sm"
              >
                <LogOut size={20} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}