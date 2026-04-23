'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { listUsers, createAdminBySuperAdmin } from '@/lib/api'
import { UserPlus, ShieldCheck, RefreshCw, CheckCircle, AlertCircle, Mail, User, Copy, X } from 'lucide-react'

export default function ManageAdminsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', name: '' })
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (user.role !== 'SUPERADMIN') { router.push('/admin'); return }
    load()
  }, [user])

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await listUsers()
      setUsers(res.users || [])
    } catch (e: any) { showToast(e.message, false) }
    setLoading(false)
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email) return
    setCreating(true)
    try {
      const res = await createAdminBySuperAdmin(user!.fabricID, form.email, form.name)
      showToast(`Admin created! Welcome email sent to ${res.email}`, true)
      setForm({ email: '', name: '' })
      setShowForm(false)
      await load()
    } catch (err: any) {
      showToast(err.message || 'Failed to create admin', false)
    }
    setCreating(false)
  }

  const copy = (text: string) => navigator.clipboard.writeText(text)

  const admins = users.filter(u => u.role === 'ADMIN' || u.role === 'SUPERADMIN')
  const regularUsers = users.filter(u => u.role === 'USER')
  const filtered = (list: any[]) => list.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy-950)' }}>
      <Navbar />
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '32px', minHeight: 'calc(100vh - 64px)' }}>

          {/* Toast */}
          {toast && (
            <div style={{
              position: 'fixed', top: 80, right: 24, zIndex: 200,
              background: toast.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${toast.ok ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
              borderRadius: 10, padding: '12px 18px', fontSize: 13,
              color: toast.ok ? '#34d399' : '#f87171',
              display: 'flex', alignItems: 'center', gap: 8, maxWidth: 400,
              backdropFilter: 'blur(8px)',
            }}>
              {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              {toast.msg}
            </div>
          )}

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
              <button
                onClick={() => setShowForm(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                  background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: 'white',
                  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <UserPlus size={15} /> Create Admin
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total Users', value: users.length, color: '#60a5fa' },
              { label: 'Admins', value: users.filter(u => u.role === 'ADMIN').length, color: '#a78bfa' },
              { label: 'Super Admins', value: users.filter(u => u.role === 'SUPERADMIN').length, color: '#f59e0b' },
              { label: 'Regular Users', value: regularUsers.length, color: '#34d399' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)', color }}>{value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Create Admin Modal */}
          {showForm && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}>
              <div className="glass-card" style={{ width: '100%', maxWidth: 460, padding: 32, position: 'relative' }}>
                <button
                  onClick={() => { setShowForm(false); setForm({ email: '', name: '' }) }}
                  style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  <X size={18} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 40, height: 40, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserPlus size={18} color="#a78bfa" />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Create New Admin</h2>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      They'll receive an email with login instructions.
                    </p>
                  </div>
                </div>

                {/* What happens info box */}
                <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#c4b5fd', marginBottom: 20, lineHeight: 1.7 }}>
                  <strong>What happens:</strong><br />
                  1. Admin account created on Fabric CA with role <code>ADMIN</code><br />
                  2. Saved to DB with temp password <code>ChangeMe123!</code><br />
                  3. Welcome email sent with login link and temp password
                </div>

                <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                      Full Name (optional)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input
                        type="text"
                        className="tdr-input"
                        style={{ paddingLeft: 34 }}
                        placeholder="Town Planning Officer"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                      Official Email <span style={{ color: '#f87171' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input
                        type="email"
                        className="tdr-input"
                        style={{ paddingLeft: 34 }}
                        placeholder="officer@smc.gov.in"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {creating && (
                    <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#93c5fd' }}>
                      ⏳ Registering on Hyperledger Fabric CA — this may take 30–60 seconds…
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button
                      type="submit"
                      disabled={creating}
                      style={{
                        flex: 1, padding: '11px', borderRadius: 8, border: 'none', cursor: creating ? 'not-allowed' : 'pointer',
                        background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: 'white',
                        fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        opacity: creating ? 0.6 : 1,
                      }}
                    >
                      {creating ? 'Creating…' : <><UserPlus size={15} /> Create Admin & Send Email</>}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); setForm({ email: '', name: '' }) }}
                      className="btn-ghost"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

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
              <ShieldCheck size={13} color="#a78bfa" /> Admins & SuperAdmins ({admins.length})
            </h2>

            {loading ? (
              <div className="glass-card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>Loading…</div>
            ) : (
              <div className="glass-card" style={{ overflowX: 'auto' }}>
                <table className="tdr-table">
                  <thead>
                    <tr><th>Name / Email</th><th>Fabric ID</th><th>Role</th><th>Created</th></tr>
                  </thead>
                  <tbody>
                    {filtered(admins).map(u => (
                      <tr key={u.fabricID}>
                        <td>
                          <div style={{ fontWeight: 500, fontSize: 14 }}>{u.name || '—'}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>
                              {u.fabricID?.slice(0, 20)}…
                            </code>
                            <button onClick={() => copy(u.fabricID)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                              <Copy size={11} />
                            </button>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${u.role === 'SUPERADMIN' ? 'badge-approved' : 'badge-pending'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.createdAt}</td>
                      </tr>
                    ))}
                    {filtered(admins).length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>No admins found</td></tr>
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
                          <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>{u.fabricID?.slice(0, 20)}…</code>
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

        </main>
      </div>
    </div>
  )
}