'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { listUsers, directAssignRole, retireIdentity } from '@/lib/api'
import { UserPlus, ShieldCheck, RefreshCw, CheckCircle, AlertCircle, Mail, User, Copy, X, Zap, ShieldAlert, Trash2, UserMinus, Search, ExternalLink, MoreVertical, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardBody } from '@/components/Card'

export default function ManageAdminsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'ADMINS' | 'USERS'>('ADMINS')
  const [showAssignModal, setShowAssignModal] = useState(false)

  // Quick Setup State
  const [quickForm, setQuickForm] = useState({ email: '', role: 'JUNIOR' })
  const [assigning, setAssigning] = useState(false)

  // Retire State
  const [retiringUser, setRetiringUser] = useState<any | null>(null)
  const [processingRetire, setProcessingRetire] = useState(false)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN') { router.push('/admin'); return }
    load()
  }, [user])

  const load = async () => {
    setLoading(true)
    try {
      const res = await listUsers()
      setUsers(res.users || [])
    } catch (e: any) { toast.error(e.message) }
    setLoading(false)
  }

  const handleDirectAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickForm.email || !quickForm.role) return
    setAssigning(true)
    try {
      await directAssignRole(user!.fabricID, quickForm.email, quickForm.role)
      toast.success(`Role ${quickForm.role} assigned to ${quickForm.email}`)
      setQuickForm({ email: '', role: 'JUNIOR' })
      setShowAssignModal(false)
      await load()
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign role')
    }
    setAssigning(false)
  }

  const handleRetire = async () => {
    if (!retiringUser) return
    setProcessingRetire(true)
    try {
      await retireIdentity(user!.fabricID, retiringUser.email)
      toast.success(`User ${retiringUser.email} removed successfully`)
      setRetiringUser(null)
      await load()
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove user')
    }
    setProcessingRetire(false)
  }

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('ID copied to clipboard')
  }

  const authorityRoles = ['ADMIN', 'SUPERADMIN', 'JUNIOR', 'ASSISTANT', 'TDO', 'CITY', 'COMMISSIONER']
  const admins = users.filter(u => authorityRoles.includes(u.role))
  const regularUsers = users.filter(u => u.role === 'USER')
  
  const currentList = activeTab === 'ADMINS' ? admins : regularUsers

  const filtered = currentList.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 60 }}>
      <main>
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <Link href="/admin" className="hover:text-blue-600 transition-colors no-underline text-slate-400">Administration</Link>
              <span>/</span>
              <span className="text-slate-600">System Access</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">User Management</h1>
            <p className="text-slate-500 font-medium">Manage system users, assign roles, and review account security.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={load} 
              disabled={loading}
              className="flex items-center gap-2 h-11 px-5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-blue-600' : 'text-slate-400'} />
              Reload Users
            </button>
            <button 
              onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-2 h-11 px-5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              <UserPlus size={18} />
              Assign Role
            </button>
          </div>
        </div>

        {/* Unified Interface Card */}
        <Card className="border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Tabs */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl w-full md:w-auto">
              <button
                onClick={() => setActiveTab('ADMINS')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === 'ADMINS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 border-transparent bg-transparent'}`}
              >
                <ShieldCheck size={16} /> Administrators <span className="ml-1 bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">{admins.length}</span>
              </button>
              <button
                onClick={() => setActiveTab('USERS')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === 'USERS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 border-transparent bg-transparent'}`}
              >
                <User size={16} /> Regular Users <span className="ml-1 bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">{regularUsers.length}</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name, email or ID..." 
                className="w-full h-11 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User Profile</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Fabric ID</th>
                  {activeTab === 'ADMINS' && <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                      No users found matching your search.
                    </td>
                  </tr>
                ) : filtered.map((u, i) => (
                  <tr key={u.fabricID} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${activeTab === 'ADMINS' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                          {u.name ? u.name.charAt(0).toUpperCase() : <User size={16} />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{u.name || (activeTab === 'ADMINS' ? 'System Admin' : 'Unset Profile')}</div>
                          <div className="text-xs text-slate-500 font-medium">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 group cursor-pointer" onClick={() => copy(u.fabricID)}>
                        <code className="text-xs text-slate-500 group-hover:text-blue-600 transition-colors">{u.fabricID.slice(0, 16)}...</code>
                        <Copy size={12} className="text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    </td>
                    {activeTab === 'ADMINS' && (
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setRetiringUser(u)}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors border-none bg-transparent cursor-pointer"
                          title="Remove User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Assign Role Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 border-0">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Shield size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Assign Role</h3>
                    <p className="text-xs text-slate-500 font-medium">Elevate a user to an administrative role</p>
                  </div>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors border-none bg-transparent cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleDirectAssign} className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">User Email Address</label>
                    <input 
                      type="email" 
                      required
                      className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium placeholder-slate-400"
                      placeholder="user@example.com"
                      value={quickForm.email}
                      onChange={e => setQuickForm({ ...quickForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Select Role</label>
                    <select 
                      className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                      value={quickForm.role}
                      onChange={e => setQuickForm({ ...quickForm, role: e.target.value })}
                    >
                      <option value="JUNIOR">Junior Officer</option>
                      <option value="ASSISTANT">Assistant Officer</option>
                      <option value="TDO">TDO Officer</option>
                      <option value="CITY">City Engineer</option>
                      <option value="COMMISSIONER">Commissioner</option>
                      <option value="ADMIN">System Admin</option>
                    </select>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100/50 mt-2">
                    <p className="text-xs text-blue-800 font-medium flex gap-2">
                      <AlertCircle size={14} className="shrink-0 text-blue-600 mt-0.5" />
                      Role assignments are recorded on the ledger and grant immediate access to sensitive operations.
                    </p>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full h-12 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 border-none cursor-pointer flex items-center justify-center gap-2 mt-2"
                    disabled={assigning}
                  >
                    {assigning ? <RefreshCw className="animate-spin" size={18} /> : <><CheckCircle size={18} /> Confirm Assignment</>}
                  </button>
                </form>
              </div>
            </Card>
          </div>
        )}

        {/* Remove Confirmation Modal */}
        {retiringUser && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 border-0">
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6 border border-red-100">
                  <ShieldAlert size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Remove User?</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                  Are you certain you want to remove <span className="font-bold text-slate-900">{retiringUser.email}</span>? This will permanently disable their privileges.
                </p>
                <div className="flex gap-3">
                  <button className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all border-none cursor-pointer" onClick={() => setRetiringUser(null)}>Cancel</button>
                  <button 
                    className="flex-1 h-12 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 border-none cursor-pointer flex items-center justify-center gap-2"
                    onClick={handleRetire}
                    disabled={processingRetire}
                  >
                    {processingRetire ? <RefreshCw className="animate-spin" size={18} /> : 'Confirm Removal'}
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}

      </main>
    </div>
  )
}