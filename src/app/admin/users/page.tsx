'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

import { listUsers, directAssignRole, retireIdentity } from '@/lib/api'
import { UserPlus, ShieldCheck, RefreshCw, CheckCircle, AlertCircle, Mail, User, Copy, X, Zap, ShieldAlert, Trash2, UserMinus } from 'lucide-react'
import { toast } from 'sonner'

export default function ManageAdminsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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
      const res = await directAssignRole(user!.fabricID, quickForm.email, quickForm.role)
      toast.success(`Role ${quickForm.role} assigned immediately to ${quickForm.email}. TxID: ${res.txID}`)
      setQuickForm({ email: '', role: 'JUNIOR' })
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
      const res = await retireIdentity(user!.fabricID, retiringUser.email)
      toast.success(`Officer ${retiringUser.email} retired successfully. TxID: ${res.txID}`)
      setRetiringUser(null)
      await load()
    } catch (err: any) {
      toast.error(err.message || 'Failed to retire officer')
    }
    setProcessingRetire(false)
  }


  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Fabric ID copied')
  }

  const authorityRoles = ['ADMIN', 'SUPERADMIN', 'JUNIOR', 'ASSISTANT', 'TDO', 'CITY', 'COMMISSIONER']
  const admins = users.filter(u => authorityRoles.includes(u.role))
  const regularUsers = users.filter(u => u.role === 'USER')
  const filtered = (list: any[]) => list.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <main>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                <Link href="/admin" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Admin</Link> › Manage Admins
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Manage Admins</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Create admin accounts and view all registered users.</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" onClick={load} disabled={loading}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>

          {/* Quick Setup Section */}
          <div className="glass-card" style={{ padding: '24px', marginBottom: 24, border: '1px solid rgba(124, 58, 237, 0.2)', background: 'linear-gradient(to bottom right, #ffffff, #f5f3ff)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, background: '#7c3aed', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={16} color="white" />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1e1b4b' }}>Quick Setup: Direct Role Assignment</h2>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Bypass approval queue and assign authority roles immediately.</p>
              </div>
            </div>

            <form onSubmit={handleDirectAssign} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 200 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>User Email</label>
                <input 
                  type="email" 
                  className="tdr-input" 
                  placeholder="user@example.com"
                  value={quickForm.email}
                  onChange={e => setQuickForm({ ...quickForm, email: e.target.value })}
                  required
                />
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>Select Role</label>
                <select 
                  className="tdr-input"
                  value={quickForm.role}
                  onChange={e => setQuickForm({ ...quickForm, role: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="JUNIOR">JUNIOR</option>
                  <option value="ASSISTANT">ASSISTANT</option>
                  <option value="TDO">TDO</option>
                  <option value="CITY">CITY</option>
                  <option value="COMMISSIONER">COMMISSIONER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ background: '#7c3aed', borderColor: '#7c3aed', padding: '12px 20px' }}
                disabled={assigning}
              >
                {assigning ? 'Assigning...' : 'Assign Role Immediately'}
              </button>
            </form>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total Users', value: users.length, color: '#60a5fa' },
              { label: 'Admins & Authorities', value: admins.length, color: '#a78bfa' },
              { label: 'Super Admins', value: users.filter(u => u.role === 'SUPERADMIN').length, color: '#f59e0b' },
              { label: 'Regular Users', value: regularUsers.length, color: '#34d399' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)', color }}>{value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>


          {/* Search */}
          <div style={{ marginBottom: 16 }}>
            <input
              className="tdr-input"
              placeholder="Search by email or name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: 360 }}
            />
          </div>

          {/* Admins Table */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={13} color="var(--navy-400)" /> Admins & Authorities ({admins.length})
            </h2>

            {loading ? (
              <div className="glass-card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>Loading…</div>
            ) : (
              <div className="glass-card" style={{ overflowX: 'auto' }}>
                <table className="tdr-table">
                  <thead>
                    <tr><th>Name / Email</th><th>Fabric ID</th><th>Role</th><th>Created</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {filtered(admins).map(u => (
                      <tr key={u.fabricID}>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, background: 'rgba(37,99,235,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--navy-400)', border: '1px solid rgba(37,99,235,0.1)' }}>
                              {(u.name || u.email || 'A').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{u.name || 'Unnamed Officer'}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--navy-400)' }}>
                              {u.fabricID?.slice(0, 20)}…
                            </code>
                            <button onClick={() => copy(u.fabricID)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                              <Copy size={11} />
                            </button>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${authorityRoles.includes(u.role) ? 'badge-approved' : 'badge-pending'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td>
                          {u.role !== 'SUPERADMIN' && (
                            <button 
                              className="btn-ghost" 
                              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '6px 12px', fontSize: 12 }}
                              onClick={() => setRetiringUser(u)}
                            >
                              <UserMinus size={13} style={{ marginRight: 6 }} /> Retire
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filtered(admins).length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>No admins found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Regular Users Table */}
          <section>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Regular Users ({regularUsers.length})
            </h2>
            <div className="glass-card" style={{ overflowX: 'auto' }}>
              <table className="tdr-table">
                <thead>
                  <tr><th>Name / Email</th><th>Fabric ID</th><th>Role</th><th>Registered</th></tr>
                </thead>
                <tbody>
                  {filtered(regularUsers).map(u => (
                    <tr key={u.fabricID}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{u.name || '—'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--navy-400)' }}>{u.fabricID?.slice(0, 20)}…</code>
                          <button onClick={() => copy(u.fabricID)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><Copy size={11} /></button>
                        </div>
                      </td>
                      <td><span className="badge badge-rejected">USER</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.createdAt}</td>
                    </tr>
                  ))}
                  {filtered(regularUsers).length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Retire Confirmation Modal */}
          {retiringUser && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
              backdropFilter: 'blur(4px)'
            }}>
              <div className="glass-card" style={{ width: '100%', maxWidth: 400, padding: 32, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <ShieldAlert size={32} color="#ef4444" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Retire Officer?</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
                  Are you sure you want to retire <strong>{retiringUser.name || retiringUser.email}</strong>? 
                  This will permanently revoke their access to the TDR portal.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button 
                    className="btn-ghost" 
                    style={{ flex: 1 }}
                    onClick={() => setRetiringUser(null)}
                    disabled={processingRetire}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-danger" 
                    style={{ flex: 1, background: '#ef4444', color: 'white', fontWeight: 700 }}
                    onClick={handleRetire}
                    disabled={processingRetire}
                  >
                    {processingRetire ? 'Retiring...' : 'Yes, Retire'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
    </div>
  )
}