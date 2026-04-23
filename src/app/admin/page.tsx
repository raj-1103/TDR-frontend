'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import {
  getPendingRequests,
  getPendingIssueRequests,
  approveTransfer,
  rejectTransfer,
  approveIssueTDR,
  rejectIssueTDR,
} from '@/lib/api'
import { CheckCircle, XCircle, RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react'

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [transfers, setTransfers] = useState<any[]>([])
  const [issues, setIssues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') { router.push('/dashboard'); return }
    load()
  }, [user])

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const load = async () => {
    setLoading(true)
    try {
      const [t, i] = await Promise.all([getPendingRequests(), getPendingIssueRequests()])
      setTransfers(t.requests || [])
      setIssues(i.requests || [])
    } catch (e: any) {
      showToast(e.message, false)
    }
    setLoading(false)
  }

  const handleApproveIssue = async (requestID: string) => {
    setActing(requestID)
    try {
      await approveIssueTDR(user!.fabricID, requestID)
      showToast('TDR issue approved!', true)
      await load()
    } catch (e: any) { showToast(e.message, false) }
    setActing(null)
  }

  const handleRejectIssue = async (requestID: string) => {
    const reason = window.prompt('Enter rejection reason:')
    if (reason === null) return
    setActing(requestID)
    try {
      await rejectIssueTDR(user!.fabricID, requestID, reason || 'Rejected by admin')
      showToast('Request rejected.', true)
      await load()
    } catch (e: any) { showToast(e.message, false) }
    setActing(null)
  }

  const handleApproveTransfer = async (requestID: string) => {
    setActing(requestID)
    try {
      await approveTransfer(user!.fabricID, requestID)
      showToast('Transfer approved! PDF generated if applicable.', true)
      await load()
    } catch (e: any) { showToast(e.message, false) }
    setActing(null)
  }

  const handleRejectTransfer = async (requestID: string) => {
    const reason = window.prompt('Enter rejection reason:')
    if (reason === null) return
    setActing(requestID)
    try {
      await rejectTransfer(user!.fabricID, requestID, reason || 'Rejected by admin')
      showToast('Transfer rejected.', true)
      await load()
    } catch (e: any) { showToast(e.message, false) }
    setActing(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy-950)' }}>
      <Navbar />
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '32px', minHeight: 'calc(100vh - 100px)' }}>
          {/* Toast */}
          {toast && (
            <div style={{
              position: 'fixed', top: 80, right: 24, zIndex: 200,
              background: toast.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${toast.ok ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
              borderRadius: 10, padding: '12px 18px', fontSize: 13,
              color: toast.ok ? '#34d399' : '#f87171',
              display: 'flex', alignItems: 'center', gap: 8, maxWidth: 380,
              backdropFilter: 'blur(8px)',
              animation: 'fadeIn 0.2s ease',
            }}>
              {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              {toast.msg}
            </div>
          )}

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                <Link href="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Dashboard</Link> › Admin Panel
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Admin Panel</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Review and resolve pending TDR issue and transfer requests.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#34d399' }}>
                <ShieldCheck size={14} /> {user?.role}
              </div>
              <button className="btn-ghost" onClick={load} disabled={loading}>
                <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                Refresh
              </button>
              {user?.role === 'SUPERADMIN' && (
                <Link href="/admin/users" className="btn-primary" style={{ fontSize: 13, padding: '8px 16px' }}>
                  Manage Users
                </Link>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Pending Issue Requests', value: issues.length, color: '#f59e0b' },
              { label: 'Pending Transfer Requests', value: transfers.length, color: '#3b82f6' },
              { label: 'Total Pending', value: issues.length + transfers.length, color: '#a78bfa' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)', color }}>{value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          {loading ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>
              Loading requests from blockchain…
            </div>
          ) : (
            <>
              {/* Issue Requests */}
              <section style={{ marginBottom: 36 }}>
                <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={14} color="#f59e0b" />
                  Pending TDR Issue Requests ({issues.length})
                </h2>

                {issues.length === 0 ? (
                  <div className="glass-card" style={{ padding: '28px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
                    ✅ No pending issue requests
                  </div>
                ) : (
                  <div className="glass-card" style={{ overflowX: 'auto' }}>
                    <table className="tdr-table" style={{ minWidth: 700 }}>
                      <thead>
                        <tr>
                          <th>Request ID</th>
                          <th>Doc ID</th>
                          <th>TDR ID</th>
                          <th>Owner</th>
                          <th>Area</th>
                          <th>Requested</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {issues.map(req => (
                          <tr key={req.requestID}>
                            <td>
                              <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>
                                {req.requestID}
                              </code>
                            </td>
                            <td>
                              <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>{req.docID}</code>
                            </td>
                            <td style={{ fontWeight: 500 }}>{req.tdrID}</td>
                            <td>
                              <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                                {req.owner?.slice(0, 18)}…
                              </code>
                            </td>
                            <td>{req.area?.toLocaleString()} sq m</td>
                            <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{req.createdAt}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  className="btn-success"
                                  onClick={() => handleApproveIssue(req.requestID)}
                                  disabled={acting === req.requestID}
                                >
                                  <CheckCircle size={12} />
                                  {acting === req.requestID ? '…' : 'Approve'}
                                </button>
                                <button
                                  className="btn-danger"
                                  onClick={() => handleRejectIssue(req.requestID)}
                                  disabled={acting === req.requestID}
                                >
                                  <XCircle size={12} />
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Transfer Requests */}
              <section>
                <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={14} color="#3b82f6" />
                  Pending Transfer Requests ({transfers.length})
                </h2>

                {transfers.length === 0 ? (
                  <div className="glass-card" style={{ padding: '28px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
                    ✅ No pending transfer requests
                  </div>
                ) : (
                  <div className="glass-card" style={{ overflowX: 'auto' }}>
                    <table className="tdr-table" style={{ minWidth: 700 }}>
                      <thead>
                        <tr>
                          <th>Request ID</th>
                          <th>TDR ID</th>
                          <th>Doc ID</th>
                          <th>From</th>
                          <th>To (New Owner)</th>
                          <th>Requested</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transfers.map(req => (
                          <tr key={req.requestID}>
                            <td>
                              <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>
                                {req.requestID}
                              </code>
                            </td>
                            <td style={{ fontWeight: 500 }}>{req.tdrID}</td>
                            <td>
                              <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>{req.docID}</code>
                            </td>
                            <td>
                              <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                                {req.fromOwner?.slice(0, 16)}…
                              </code>
                            </td>
                            <td style={{ fontSize: 12 }}>{req.toOwner}</td>
                            <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{req.createdAt}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  className="btn-success"
                                  onClick={() => handleApproveTransfer(req.requestID)}
                                  disabled={acting === req.requestID}
                                >
                                  <CheckCircle size={12} />
                                  {acting === req.requestID ? '…' : 'Approve'}
                                </button>
                                <button
                                  className="btn-danger"
                                  onClick={() => handleRejectTransfer(req.requestID)}
                                  disabled={acting === req.requestID}
                                >
                                  <XCircle size={12} />
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
